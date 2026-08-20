import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { hashPassword, comparePassword } from "../users/bcrypt";
import { createRawToken, hashToken } from "../lib/token";
import {
  LoginSchema,
  UserSchema,
  UserBaseSchemaExport,
} from "../Schemas/usersSchema";
import {
  getDiscountCycle,
  turnsUntilNextDiscount as calcTurnsUntilNextDiscount,
  isThisTurnEligible,
} from "../lib/discount";
import {
  assertNoPendingAppointments,
  PendingAppointmentsError,
} from "../lib/barberBusinessRules";
import { assertEntityExists } from "../lib/entityChecks";
import { parseValidatedInput } from "../lib/zodHelpers";

const INITIAL_TO_MEDIUM_DAYS = parseInt(
  process.env.INITIAL_TO_MEDIUM_DAYS || "30",
  10,
);
const INITIAL_TO_MEDIUM_COUNT = parseInt(
  process.env.INITIAL_TO_MEDIUM_COUNT || "5",
  10,
);
const MEDIUM_TO_PREMIUM_YEARS = parseInt(
  process.env.MEDIUM_TO_PREMIUM_YEARS || "3",
  10,
);
const MEDIUM_TO_PREMIUM_COUNT = parseInt(
  process.env.MEDIUM_TO_PREMIUM_COUNT || "25",
  10,
);
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || "60",
  10,
);
const PASSWORD_RESET_TOKEN_TTL_MINUTES = parseInt(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || "30",
  10,
);

const buildLoyaltyProgress = async (
  codCliente: string,
  categoriaActual?: {
    categorias?: { nombreCategoria: string; descuentoCorte: number };
    ultimaFechaInicio?: Date;
  } | null,
) => {
  if (
    !categoriaActual ||
    !categoriaActual.categorias ||
    !categoriaActual.ultimaFechaInicio
  ) {
    return null;
  }

  const nombreCategoria = categoriaActual.categorias.nombreCategoria;
  const descuentoCorte = categoriaActual.categorias.descuentoCorte;
  const startDate = new Date(categoriaActual.ultimaFechaInicio);

  let nextCategory: string | null = null;
  let countRequired: number | null = null;
  let thresholdDate: Date | null = null;

  if (nombreCategoria === "Inicial") {
    nextCategory = "Medium";
    countRequired = INITIAL_TO_MEDIUM_COUNT;
    thresholdDate = new Date(startDate);
    thresholdDate.setDate(thresholdDate.getDate() + INITIAL_TO_MEDIUM_DAYS);
  } else if (nombreCategoria === "Medium") {
    nextCategory = "Premium";
    countRequired = MEDIUM_TO_PREMIUM_COUNT;
    thresholdDate = new Date(startDate);
    thresholdDate.setFullYear(
      thresholdDate.getFullYear() + MEDIUM_TO_PREMIUM_YEARS,
    );
  }

  const countCurrent = await prisma.turno.count({
    where: {
      codCliente,
      estado: "Cobrado",
      fechaTurno: { gt: startDate },
    },
  });

  const now = new Date();
  const totalMs = thresholdDate
    ? Math.max(thresholdDate.getTime() - startDate.getTime(), 0)
    : 0;
  const elapsedMs = thresholdDate
    ? Math.min(Math.max(now.getTime() - startDate.getTime(), 0), totalMs)
    : 0;

  const timeProgress = totalMs > 0 ? elapsedMs / totalMs : 1;
  const countProgress =
    countRequired && countRequired > 0
      ? Math.min(countCurrent / countRequired, 1)
      : 1;
  const progress = nextCategory ? Math.min(timeProgress, countProgress) : null;
  const daysRequired = totalMs > 0 ? Math.ceil(totalMs / MS_PER_DAY) : null;
  const daysCurrent = totalMs > 0 ? Math.floor(elapsedMs / MS_PER_DAY) : null;

  // calculate cicle of discount for the current category (if applicable)
  const discountCycle = getDiscountCycle(nombreCategoria);

  let turnsUntilNextDiscount: number | null = null;
  let discountProgress: number | null = null;
  let isThisTurnEligibleFlag: boolean | null = null;

  if (discountCycle && typeof countCurrent === "number") {
    turnsUntilNextDiscount = calcTurnsUntilNextDiscount(
      countCurrent,
      discountCycle,
    );
    discountProgress =
      discountCycle > 0
        ? Math.round(
            ((discountCycle - (turnsUntilNextDiscount ?? 0)) / discountCycle) *
              100,
          ) / 100
        : null;
    isThisTurnEligibleFlag = isThisTurnEligible(countCurrent, discountCycle);
  }

  const discountTurnsRequired = discountCycle
    ? Math.max(discountCycle - 1, 0)
    : null;
  const discountTurnsCompleted =
    discountTurnsRequired !== null && turnsUntilNextDiscount !== null
      ? Math.min(
          Math.max(discountTurnsRequired - turnsUntilNextDiscount, 0),
          discountTurnsRequired,
        )
      : null;

  return {
    currentCategory: nombreCategoria,
    currentDiscount: descuentoCorte,
    nextCategory,
    countCurrent,
    countRequired,
    daysCurrent,
    daysRequired,
    progress,
    isMaxCategory: false,
    // Additional fields for progress toward the next discount within the category.
    discountCycle,
    turnsUntilNextDiscount,
    discountProgress,
    isThisTurnEligible: isThisTurnEligibleFlag,
    discountTurnsRequired,
    discountTurnsCompleted,
  };
};

// function to create a normal user (without CUIL)
export const store = async (
  dni: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string,
  cuil?: string,
  codSucursal?: string,
) => {
  try {
    // Sanitizar inputs
    const sanitizedData = {
      dni: sanitizeInput(dni),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
      cuil: cuil ? sanitizeInput(cuil) : undefined, // sanitize if exists
    };

    // validation with zod
    const validatedData = parseValidatedInput(UserSchema, sanitizedData);

    console.log("Creating user");

   // Encrypt the password after sanitization.
    const hashedPassword = await hashPassword(validatedData.contraseña);
    let cuilValue = null;
    if (validatedData.cuil) {
      // clean CUIL for storage (remove dashes and spaces)
      cuilValue = validatedData.cuil.replace(/[-\s]/g, "");
    }
    // create user (map password -> contrase_a, without transaction to avoid transaction errors in dev)
    const createData: Prisma.usuariosUncheckedCreateInput = {
      dni: validatedData.dni,
      cuil: cuilValue, // normal users don't have CUIL
      nombre: validatedData.nombre,
      apellido: validatedData.apellido,
      telefono: validatedData.telefono,
      email: validatedData.email,
      emailVerificado: false,
      contrase_a: hashedPassword,
      codSucursal: codSucursal || null,
    };

    const usuario = await prisma.usuarios.create({
      data: createData,
    });

    // Only create a current category for customers (without CUIL).
    if (!cuilValue) {
      // find inicial category
      const categoriaInicial = await prisma.categoria.findFirst({
        where: { nombreCategoria: "Inicial" },
      });

      if (!categoriaInicial) {
        throw new DatabaseError(
          "Categoría inicial no encontrada en el sistema",
        );
      }

      // create current category for the client
      await prisma.categoria_vigente.create({
        data: {
          codCategoria: categoriaInicial.codCategoria,
          codCliente: usuario.codUsuario,
          ultimaFechaInicio: new Date(),
        },
      });

      console.log("Client created with initial category assigned");
    }
    const userType =
      cuilValue === "1" ? "admin" : cuilValue ? "barber" : "client";
    console.log(`${userType} created successfully`);
    return usuario;
  } catch (error) {
    console.error(
      "Error creating user:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // handle errors of DB (Prisma)
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as {
        code: string;
        message: string;
        meta?: { target?: string[] };
      };

      // P2002: Unique constraint violation
      if (prismaError.code === "P2002") {
        // Extract which field caused the duplicate error
        const target = prismaError.meta?.target;

        if (target && Array.isArray(target)) {
          if (target.includes("email")) {
            throw new DatabaseError(
              "El email ya está registrado en el sistema",
            );
          }
          // DNI and CUIL can be duplicated, only validate email
        }

        // if the error is not related to email, we ignore it (allows for duplicate DNI/CUIL)
        throw new DatabaseError(
          "Los datos ingresados ya existen en el sistema",
        );
      }

      // P2003: Foreign key constraint violation
      if (prismaError.code === "P2003") {
        throw new DatabaseError("La sucursal especificada no existe");
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async (userType?: "client" | "barber") => {
  //specify type of user to display.

  try {
    console.log(`Fetching all ${userType} with Prisma`);

    if (userType === "client") {
      const usuarios = await prisma.usuarios.findMany({
        where: { cuil: null, activo: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        include: {
          categoria_vigente: {
            orderBy: { ultimaFechaInicio: "desc" },
            take: 1,
            include: {
              categorias: true,
            },
          },
        },
      });

      const clientIds = usuarios.map((usuario) => usuario.codUsuario);
      const [totalCounts, canceledCounts] =
        clientIds.length > 0
          ? await Promise.all([
              prisma.turno.groupBy({
                by: ["codCliente"],
                where: {
                  codCliente: { in: clientIds },
                },
                _count: {
                  _all: true,
                },
              }),
              prisma.turno.groupBy({
                by: ["codCliente"],
                where: {
                  codCliente: { in: clientIds },
                  estado: "Cancelado",
                },
                _count: {
                  _all: true,
                },
              }),
            ])
          : [[], []];

      const totalCountsMap = new Map(
        totalCounts.map((row) => [row.codCliente, row._count._all]),
      );
      const canceledCountsMap = new Map(
        canceledCounts.map((row) => [row.codCliente, row._count._all]),
      );

      const usuariosConResumen = usuarios.map((usuario) => {
        const categoriaActual = usuario.categoria_vigente[0];

        return {
          ...usuario,
          categoriaActual: categoriaActual
            ? {
                codCategoria: categoriaActual.codCategoria,
                nombreCategoria: categoriaActual.categorias.nombreCategoria,
                descCategoria: categoriaActual.categorias.descCategoria,
                descuentoCorte: categoriaActual.categorias.descuentoCorte,
                descuentoProducto: categoriaActual.categorias.descuentoProducto,
                fechaInicio: categoriaActual.ultimaFechaInicio,
              }
            : null,
          appointmentCounts: {
            total: totalCountsMap.get(usuario.codUsuario) ?? 0,
            canceled: canceledCountsMap.get(usuario.codUsuario) ?? 0,
          },
          categoria_vigente: undefined,
        };
      });

      console.log(`Retrieved ${usuariosConResumen.length} ${userType}`);
      return usuariosConResumen;
    }

    let whereCondition = {};
    switch (userType) {
      case "barber":
        // show all the barbers (active and inactive) so the admin can see them
        whereCondition = {
          AND: [{ cuil: { not: null } }, { cuil: { not: "1" } }],
          // DONT filter by active to show also the barbers that are inactive
        };
        break;
      default:
        whereCondition = { activo: true }; //  all active users
    }

    // only users without CUIL (clients)
    const usuarios = await prisma.usuarios.findMany({
      where: whereCondition,
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    console.log(`Retrieved ${usuarios.length} ${userType}`);
    return usuarios;
  } catch (error) {
    console.error(
      `Error fetching ${userType}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al obtener lista de usuarios");
  }
};

export const findById = async (codUsuario: string) => {
  try {
    console.log("🔍 Debug - findById called with:", codUsuario);

    const sanitizedCodUsuario = sanitizeInput(codUsuario);
    console.log("🔍 Debug - sanitized codUsuario:", sanitizedCodUsuario);

    const usuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    console.log("🔍 Debug - User found:", usuario ? "YES" : "NO");
    if (usuario) {
      console.log("🔍 Debug - User data:", {
        codUsuario: usuario.codUsuario,
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
        cuil: usuario.cuil,
      });
    }

    return usuario;
  } catch (error) {
    console.error("🔍 Debug - findById error:", error);
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding user:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al buscar usuario");
  }
};

export const findByIdWithCategory = async (codUsuario: string) => {
  try {
    const sanitizedCodUsuario = sanitizeInput(codUsuario);
    const usuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
      include: {
        categoria_vigente: {
          orderBy: { ultimaFechaInicio: "desc" },
          take: 1, // only most recent category
          include: {
            categorias: true, // Include category info
          },
        },
      },
    });

    assertEntityExists(usuario, "Usuario");
    const categoriaActual = usuario.categoria_vigente[0];
    const loyaltyProgress = await buildLoyaltyProgress(
      sanitizedCodUsuario,
      categoriaActual,
    );
    return {
      ...usuario,
      categoriaActual: categoriaActual
        ? {
            codCategoria: categoriaActual.codCategoria,
            nombreCategoria: categoriaActual.categorias.nombreCategoria,
            descCategoria: categoriaActual.categorias.descCategoria,
            descuentoCorte: categoriaActual.categorias.descuentoCorte,
            descuentoProducto: categoriaActual.categorias.descuentoProducto,
            fechaInicio: categoriaActual.ultimaFechaInicio,
          }
        : null,
      loyaltyProgress,
      categoria_vigente: undefined, // Remove for cleaning the response
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding user with category:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al buscar usuario con categoría");
  }
};

export const findByBranchId = async (codSucursal: string) => {
  try {
    // Sanitize and validate
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    const usuarios = await prisma.usuarios.findMany({
      where: { codSucursal: sanitizedCodSucursal, activo: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    return usuarios;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding users by branch ID:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al buscar usuarios por sucursal");
  }
};

export const findBySchedule = async (
  codSucursal: string,
  fechaTurno: string,
  horaDesde: string,
) => {
  try {
    const sanitizedCodSucursal = sanitizeInput(codSucursal);
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);
    const sanitizedHoraDesde = sanitizeInput(horaDesde);

    const fechaTurnoDate = new Date(sanitizedFechaTurno);

    const todosBarberos = await prisma.usuarios.findMany({
      where: {
        codSucursal: sanitizedCodSucursal,
        activo: true,
      },
      include: {
        turnos_turnos_codBarberoTousuarios: {
          where: {
            estado: "Programado",
            fechaTurno: fechaTurnoDate,
          },
        },
      },
    });

    const barberos = todosBarberos.filter((barbero) => {
      const tieneTurnoEnHora = barbero.turnos_turnos_codBarberoTousuarios.some(
        (turno) => {
          const turnoHora = turno.horaDesde.toISOString().substring(11, 16);
          return turnoHora === sanitizedHoraDesde;
        },
      );

      return !tieneTurnoEnHora;
    });

    return barberos;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    console.error(
      "Error finding available barbers:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al buscar barberos disponibles");
  }
};

const UpdateUserSchema = UserBaseSchemaExport.omit({ contraseña: true }).extend(
  {
    contraseña: UserBaseSchemaExport.shape.contraseña.optional(),
  },
);
interface UpdateUserParams {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  contraseña?: string;
  cuil?: string;
  codSucursal?: string;
}

export const update = async (codUsuario: string, params: UpdateUserParams) => {
  try {
    console.log("🔍 Debug - Raw codUsuario received:", codUsuario);
    console.log("🔍 Debug - Raw codUsuario type:", typeof codUsuario);

    // Sanitize data
    const sanitizedData = {
      codUsuario: sanitizeInput(codUsuario),
      dni: sanitizeInput(params.dni),
      nombre: sanitizeInput(params.nombre),
      apellido: sanitizeInput(params.apellido),
      telefono: sanitizeInput(params.telefono),
      email: sanitizeInput(params.email),
      contraseña: params.contraseña
        ? sanitizeInput(params.contraseña)
        : undefined,
      cuil: params.cuil ? sanitizeInput(params.cuil) : undefined,
      codSucursal: params.codSucursal
        ? sanitizeInput(params.codSucursal)
        : undefined,
    };

    // Normalize CUIL: accept either formatted "XX-XXXXXXXX-X" or 11 digits
    if (sanitizedData.cuil) {
      const digits = sanitizedData.cuil.replace(/\D/g, "");
      if (/^\d{11}$/.test(digits)) {
        // format as XX-XXXXXXXX-X
        sanitizedData.cuil = `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
      }
    }

    const validatedData = parseValidatedInput(UpdateUserSchema, {
      dni: sanitizedData.dni,
      nombre: sanitizedData.nombre,
      apellido: sanitizedData.apellido,
      telefono: sanitizedData.telefono,
      email: sanitizedData.email,
      contraseña: sanitizedData.contraseña,
      cuil: sanitizedData.cuil,
      codSucursal: sanitizedData.codSucursal,
    });

    console.log(
      "🔍 Debug - Looking for user with codUsuario:",
      sanitizedData.codUsuario,
    );

    // Verify that the user exists
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedData.codUsuario },
    });

    console.log(
      "🔍 Debug - Query result:",
      existingUsuario ? "FOUND" : "NOT FOUND",
    );

    if (existingUsuario) {
      console.log("🔍 Debug - Found user data:", {
        codUsuario: existingUsuario.codUsuario,
        dni: existingUsuario.dni,
        nombre: existingUsuario.nombre,
        email: existingUsuario.email,
      });
    }

    assertEntityExists(existingUsuario, "Usuario");

    if (
      existingUsuario.cuil &&
      existingUsuario.cuil !== "1" &&
      validatedData.codSucursal &&
      validatedData.codSucursal !== existingUsuario.codSucursal
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingCount = await prisma.turno.count({
        where: {
          codBarbero: sanitizedData.codUsuario,
          estado: "Programado",
          fechaTurno: {
            gte: today,
          },
        },
      });

      try {
        assertNoPendingAppointments(
          pendingCount,
          "No se puede cambiar de sucursal. Tiene turnos pendientes",
        );
      } catch (error) {
        if (error instanceof PendingAppointmentsError) {
          throw new DatabaseError(error.message);
        }
        throw error;
      }
    }
    // prepare the required data for the update
    const updateData: Prisma.usuariosUncheckedUpdateInput = {
      //! Criminal
      dni: validatedData.dni,
      nombre: validatedData.nombre,
      apellido: validatedData.apellido,
      telefono: validatedData.telefono,
      email: validatedData.email,
      codSucursal: validatedData.codSucursal,
    };

    // only encrypt and update password if a new one is provided
    if (validatedData.contraseña) {
      const hashedPassword = await hashPassword(validatedData.contraseña);
      updateData.contrase_a = hashedPassword;
    }

    // only update CUIL if it is provided
    if (validatedData.cuil) {
      updateData.cuil = validatedData.cuil.replace(/[-\s]/g, "");
    }

    // update user
    const updatedUsuario = await prisma.usuarios.update({
      where: { codUsuario: sanitizedData.codUsuario },
      data: updateData,
    });

    console.log("Usuario updated successfully");
    return updatedUsuario;
  } catch (error) {
    console.error(
      "Error updating user:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // handle errors of DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("El nuevo email ya existe en el sistema");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Usuario no encontrado");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar usuario");
  }
};

export const destroy = async (codUsuario: string) => {
  try {
    // Sanitize and validate
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // Verify that the user exists
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    assertEntityExists(existingUsuario, "Usuario");

    if (existingUsuario.cuil && existingUsuario.cuil !== "1") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingCount = await prisma.turno.count({
        where: {
          codBarbero: sanitizedCodUsuario,
          estado: "Programado",
          fechaTurno: {
            gte: today,
          },
        },
      });

      try {
        assertNoPendingAppointments(
          pendingCount,
          "No se puede dar de baja al barbero. Tiene turnos pendientes",
        );
      } catch (error) {
        if (error instanceof PendingAppointmentsError) {
          throw new DatabaseError(error.message);
        }
        throw error;
      }
    }

    //Soft delete of the user.
    const updatedUsuario = await prisma.usuarios.update({
      where: { codUsuario: sanitizedCodUsuario },
      data: { activo: false },
    });

    console.log("Usuario deactivated successfully");
    return updatedUsuario;
  } catch (error) {
    console.error(
      "Error deleting user:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // handle errors of DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Usuario no encontrado");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: el usuario tiene turnos asociados",
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al dar de baja usuario");
  }
};

export const deactivate = async (codUsuario: string) => {
  return destroy(codUsuario);
};

export const reactivate = async (codUsuario: string) => {
  try {
    // Sanitize and validate
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // Verify that the user exists
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    assertEntityExists(existingUsuario, "Usuario");

    // Verify that it is a barber (has CUIL and is not admin)
    if (!existingUsuario.cuil || existingUsuario.cuil === "1") {
      throw new DatabaseError("Solo se pueden reactivar barberos");
    }

    // Verify that the user is inactive
    if (existingUsuario.activo) {
      throw new DatabaseError("El usuario ya está activo");
    }

    // Reactivate the barber
    const reactivatedUsuario = await prisma.usuarios.update({
      where: { codUsuario: sanitizedCodUsuario },
      data: { activo: true },
    });

    console.log("Usuario reactivated successfully");
    return reactivatedUsuario;
  } catch (error) {
    console.error(
      "Error reactivating user:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // handle errors of DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Usuario no encontrado");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al reactivar usuario");
  }
};

// Function to validate login of the user
export const validateLogin = async (email: string, contraseña: string) => {
  try {
    // Sanitize inputs
    const sanitizedData = {
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    // validate with zod
    const validatedData = parseValidatedInput(LoginSchema, sanitizedData);

    console.log("Validating user login for email:", validatedData.email);

    // find user only by email (NOT by contraseña)
    const usuario = await prisma.usuarios.findFirst({
      where: {
        email: validatedData.email,
        activo: true,
      },
    });

    if (!usuario) {
      console.log("Login failed: No user found with provided email");
      throw new DatabaseError("Email o contraseña incorrectos");
    }

    // verify contraseña using bcrypt
    const isPasswordValid = await comparePassword(
      validatedData.contraseña,
      usuario.contrase_a,
    );

    if (!isPasswordValid) {
      console.log("Login failed: Invalid password");
      throw new DatabaseError("Email o contraseña incorrectos");
    }

    if (!usuario.emailVerificado) {
      throw new DatabaseError("Email no verificado", "EMAIL_NOT_VERIFIED");
    }

    console.log("User login validated successfully for user:", {
      codUsuario: usuario.codUsuario,
      email: usuario.email,
      cuil: usuario.cuil,
      userType:
        usuario.cuil === "1" ? "admin" : usuario.cuil ? "barber" : "client",
    });

    // verify if the user is a client and has category "Vetado"
    const esCliente = !usuario.cuil || usuario.cuil === null;

    if (esCliente) {
      const categoriaVigente = await prisma.categoria_vigente.findFirst({
        where: { codCliente: usuario.codUsuario },
        include: { categorias: true },
        orderBy: { ultimaFechaInicio: "desc" },
      });

      if (categoriaVigente?.categorias.nombreCategoria === "Vetado") {
        console.log("Login denied: User is vetoed");
        throw new DatabaseError(
          "Usuario vetado. No puede acceder al sistema. Contacte al administrador.",
        );
      }
    }

    // return user without password for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrase_a, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  } catch (error) {
    console.error(
      "Error validating login:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al validar credenciales");
  }
};

const buildTokenExpiry = (minutes: number) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
};

const clearVerificationTokensForUser = async (codUsuario: string) => {
  await prisma.email_verification_tokens.deleteMany({
    where: {
      userId: codUsuario,
      consumedAt: null,
    },
  });
};

const clearResetTokensForUser = async (codUsuario: string) => {
  await prisma.password_reset_tokens.deleteMany({
    where: {
      userId: codUsuario,
      consumedAt: null,
    },
  });
};

export const createEmailVerificationTokenByUserId = async (codUsuario: string) => {
  const sanitizedUserId = sanitizeInput(codUsuario);
  const user = await prisma.usuarios.findUnique({
    where: { codUsuario: sanitizedUserId },
    select: {
      codUsuario: true,
      nombre: true,
      email: true,
      activo: true,
      emailVerificado: true,
    },
  });

  if (!user || !user.activo || user.emailVerificado) {
    return null;
  }

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = buildTokenExpiry(EMAIL_VERIFICATION_TOKEN_TTL_MINUTES);

  await clearVerificationTokensForUser(user.codUsuario);
  await prisma.email_verification_tokens.create({
    data: {
      userId: user.codUsuario,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token: rawToken,
    email: user.email,
    name: user.nombre,
  };
};

export const requestEmailVerificationForEmail = async (email: string) => {
  const sanitizedEmail = sanitizeInput(email);
  const user = await prisma.usuarios.findFirst({
    where: { email: sanitizedEmail, activo: true },
    select: {
      codUsuario: true,
      emailVerificado: true,
    },
  });

  if (!user || user.emailVerificado) {
    return null;
  }

  return createEmailVerificationTokenByUserId(user.codUsuario);
};

export const verifyEmailByToken = async (token: string) => {
  const tokenHash = hashToken(sanitizeInput(token));
  const now = new Date();

  const verificationToken = await prisma.email_verification_tokens.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      usuarios: {
        select: {
          codUsuario: true,
          activo: true,
        },
      },
    },
  });

  if (!verificationToken || !verificationToken.usuarios.activo) {
    throw new DatabaseError("Token inválido o expirado");
  }

  await prisma.$transaction([
    prisma.usuarios.update({
      where: { codUsuario: verificationToken.userId },
      data: { emailVerificado: true },
    }),
    prisma.email_verification_tokens.update({
      where: { id: verificationToken.id },
      data: { consumedAt: now },
    }),
  ]);
};

export const createPasswordResetTokenByEmail = async (email: string) => {
  const sanitizedEmail = sanitizeInput(email);
  const user = await prisma.usuarios.findFirst({
    where: {
      email: sanitizedEmail,
      activo: true,
      emailVerificado: true,
    },
    select: {
      codUsuario: true,
      nombre: true,
      email: true,
    },
  });

  if (!user) {
    return null;
  }

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = buildTokenExpiry(PASSWORD_RESET_TOKEN_TTL_MINUTES);

  await clearResetTokensForUser(user.codUsuario);
  await prisma.password_reset_tokens.create({
    data: {
      userId: user.codUsuario,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token: rawToken,
    email: user.email,
    name: user.nombre,
  };
};

export const resetPasswordByToken = async (
  token: string,
  nuevaContraseña: string,
) => {
  const tokenHash = hashToken(sanitizeInput(token));
  const now = new Date();

  const resetToken = await prisma.password_reset_tokens.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: now },
    },
  });

  if (!resetToken) {
    throw new DatabaseError("Token inválido o expirado");
  }

  const validatedPassword = UserBaseSchemaExport.shape.contraseña.parse(
    sanitizeInput(nuevaContraseña),
  );
  const hashedPassword = await hashPassword(validatedPassword);

  await prisma.$transaction([
    prisma.usuarios.update({
      where: { codUsuario: resetToken.userId },
      data: { contrase_a: hashedPassword },
    }),
    prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { consumedAt: now },
    }),
  ]);
};

// ========================
// Refresh Token Management
// ========================

const REFRESH_TOKEN_TTL_DAYS = parseInt(
  process.env.REFRESH_TOKEN_TTL_DAYS || "7",
  10,
);

export const createRefreshToken = async (
  codUsuario: string,
): Promise<{ rawToken: string; expiresAt: Date }> => {
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

  await prisma.refresh_tokens.create({
    data: {
      userId: codUsuario,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
};

export const validateRefreshToken = async (
  rawToken: string,
): Promise<{ codUsuario: string } | null> => {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const row = await prisma.refresh_tokens.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { userId: true },
  });

  return row ? { codUsuario: row.userId } : null;
};

export const revokeRefreshTokens = async (codUsuario: string): Promise<void> => {
  await prisma.refresh_tokens.updateMany({
    where: {
      userId: codUsuario,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const cleanupRefreshTokens = async (): Promise<void> => {
  const now = new Date();
  await prisma.refresh_tokens.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
    },
  });
};
