import { prisma, DatabaseError, sanitizeInput } from "../base/Base"; // importamos todo desde Base
import { z } from "zod";
import { AppointmentSchema } from "../Schemas/appointmentsSchema";
import { billAppointment } from "../billing/Billing";
import { getDiscountCycle, applyDiscountIfEligible } from "../lib/discount";
import { assertEntityExists } from "../lib/entityChecks";
import { parseValidatedInput } from "../lib/zodHelpers";
import logger from "../lib/logger";

// Configurable thresholds (can be overridden by environment variables during testing)
const INITIAL_TO_MEDIUM_DAYS = parseInt(
  process.env.INITIAL_TO_MEDIUM_DAYS || "30",
  10,
);
const INITIAL_TO_MEDIUM_COUNT = parseInt(
  process.env.INITIAL_TO_MEDIUM_COUNT || "5",
  10,
);

type BillingErrorInfo = {
  message: string;
  code?: string;
  afipCode?: string;
  fullMessage: string;
};

const DEFAULT_BILLING_ERROR = "Error desconocido de ARCA";

const extractBillingErrorInfo = (error: unknown): BillingErrorInfo => {
  let message = DEFAULT_BILLING_ERROR;

  if (error instanceof Error && error.message.trim().length > 0) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    const rawMessage = (error as { message?: unknown }).message;
    if (typeof rawMessage === "string" && rawMessage.trim().length > 0) {
      message = rawMessage;
    }
  }

  let code: string | undefined;
  if (error instanceof DatabaseError && error.code) {
    code = error.code;
  } else if (error && typeof error === "object" && "code" in error) {
    const rawCode = (error as { code?: unknown }).code;
    if (typeof rawCode === "string" && rawCode.trim().length > 0) {
      code = rawCode;
    } else if (typeof rawCode === "number") {
      code = String(rawCode);
    }
  }

  const afipMatch = message.match(/\((\d{3,6})\)/);
  const afipCode = afipMatch ? afipMatch[1] : undefined;

  const labels: string[] = [];
  if (code) labels.push(`code=${code}`);
  if (afipCode) labels.push(`afip=${afipCode}`);
  const fullMessage =
    labels.length > 0 ? `[${labels.join(" ")}] ${message}` : message;

  return { message, code, afipCode, fullMessage };
};

// Helper function to generate available time slots.
// It now also takes into account barber blocks (`bloqueos`) and treats
// blocks as appointments (blocked times are not displayed).

const generateAvailableTimeSlots = (
  turnos: Array<{ codBarbero: string; horaDesde: Date }>,
  barberoId?: string,
  barberos?: Array<{ codUsuario: string }>,
  fecha?: string,
  bloqueos?: Array<{
    codBarbero: string;
    fechaHoraDesde: Date;
    fechaHoraHasta: Date;
  }>,
): Array<{ hora: string }> => {
  const horasDisponibles: Array<{ hora: string }> = [];
  const isSaturday = fecha ? new Date(fecha).getUTCDay() === 6 : false;

  for (let hora = 8; hora <= 19.5; hora += 0.5) {
    if (isSaturday && hora >= 13) break;

    const horaString = `${Math.floor(hora)
      .toString()
      .padStart(2, "0")}:${((hora % 1) * 60).toString().padStart(2, "0")}`;

    // Create candidate date/time in ISO UTC format to compare with blocks.
    const candidateIso = fecha ? `${fecha}T${horaString}:00.000Z` : null;
    const candidateDate = candidateIso ? new Date(candidateIso) : null;

    const isBlockedForBarber = (bId: string) => {
      if (!bloqueos || !candidateDate) return false;
      return bloqueos.some((b) => {
        if (b.codBarbero !== bId) return false;
        const from = new Date(b.fechaHoraDesde).getTime();
        const to = new Date(b.fechaHoraHasta).getTime();
        const cand = candidateDate.getTime();
        return cand >= from && cand < to;
      });
    };

    if (barberoId) {
      // Case: search for availability for a specific barber.
      const turnoExistente = turnos.find((t) => {
        const turnoHoraCorrecta = t.horaDesde.toISOString().substring(11, 16);
        return t.codBarbero === barberoId && turnoHoraCorrecta === horaString;
      });

      const bloqueado = isBlockedForBarber(barberoId);

      if (!turnoExistente && !bloqueado) {
        horasDisponibles.push({ hora: horaString });
      }
    } else if (barberos) {
      // Case: search for time slots where at least one barber in the branch is free
      for (const barbero of barberos) {
        const turnoExistente = turnos.find((t) => {
          const turnoHoraCorrecta = t.horaDesde.toISOString().substring(11, 16);
          return (
            t.codBarbero === barbero.codUsuario &&
            turnoHoraCorrecta === horaString
          );
        });

        const bloqueado = isBlockedForBarber(barbero.codUsuario);

        if (!turnoExistente && !bloqueado) {
          horasDisponibles.push({ hora: horaString });
          break; // Once we find a barber available for that time, display the time.

        }
      }
    }
  }

  return horasDisponibles;
};

//  backend functions
export const store = async (
  codCliente: string,
  codBarbero: string,
  fechaTurno: string,
  horaDesde: string,
  horaHasta: string | undefined,
  estado: string,
) => {
  try {
    // sanitize inputs
    const sanitizedData = {
      codCliente: sanitizeInput(codCliente),
      codBarbero: sanitizeInput(codBarbero),
      fechaTurno: sanitizeInput(fechaTurno),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: horaHasta ? sanitizeInput(horaHasta) : "",
      estado: sanitizeInput(estado),
    };

    // Auto-calculate horaHasta (+30 min) when not provided
    if (!sanitizedData.horaHasta) {
      const [h, m] = sanitizedData.horaDesde.split(":").map(Number);
      const totalMin = h * 60 + m + 30;
      const newH = Math.floor(totalMin / 60);
      const newM = totalMin % 60;
      sanitizedData.horaHasta = `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
    }

    // validate with zod - omit codTurno for creation
    const validatedData = parseValidatedInput(
      AppointmentSchema.omit({ codTurno: true }),
      sanitizedData,
    );
    logger.info("Creating turno");

    // convert strings to Date objects for Prisma
    const fechaDate = new Date(`${sanitizedData.fechaTurno}T00:00:00.000Z`);
    const horaDesdeDate = new Date(
      `1970-01-01T${sanitizedData.horaDesde}:00.000Z`,
    );

    const horaHastaDate = new Date(
      `1970-01-01T${sanitizedData.horaHasta}:00.000Z`,
    );

    const startOfDay = new Date(fechaDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingTurnos = await prisma.turno.findMany({
      where: {
        codCliente: validatedData.codCliente,
        fechaCancelacion: null,
        fechaTurno: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        horaDesde: true,
      },
    });

    const hasSameTime = existingTurnos.some((turno) => {
      const hours = turno.horaDesde.getUTCHours().toString().padStart(2, "0");
      const minutes = turno.horaDesde
        .getUTCMinutes()
        .toString()
        .padStart(2, "0");
      return `${hours}:${minutes}` === sanitizedData.horaDesde;
    });

    if (hasSameTime) {
      throw new DatabaseError(
        "Ya tienes un turno reservado en ese horario para ese día",
      );
    }

    // create appointment
    const turno = await prisma.turno.create({
      data: {
        codCliente: validatedData.codCliente,
        codBarbero: validatedData.codBarbero,
        fechaTurno: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
        estado: validatedData.estado,
      },
    });

    logger.info("Turno created successfully");
    return [turno];
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error creating turno",
    );
    //handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    if (error instanceof DatabaseError) {
      throw error;
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
        throw new DatabaseError(
          "Ya existe un turno con los mismos datos. Por favor, verifique la información.",
        );
      }

      // P2003: Foreign key constraint violation
      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "El usuario, barbero o sucursal especificado no existe",
        );
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    logger.info("Fetching all turnos");

    const turnos = await prisma.turno.findMany({
      orderBy: { fechaTurno: "desc" },
    });

    logger.info({ count: turnos.length }, "Retrieved turnos");
    logger.debug({ turnos }, "Turnos data");
    return turnos;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error fetching turnos",
    );
    throw new DatabaseError("Error al obtener lista de turnos");
  }
};

export const findById = async (codTurno: string) => {
  try {
    //sanitize and validate
    const sanitizedCodTurno = sanitizeInput(codTurno);

    const turno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    return turno;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding turno",
    );
    throw new DatabaseError("Error al buscar turno");
  }
};

export const findNextByUserId = async (codUsuario: string) => {
  try {
    const sanitizedCodUsuario = sanitizeInput(codUsuario);
    const now = new Date();

    const turno = await prisma.turno.findFirst({
      where: {
        AND: [
          {
            OR: [
              { codCliente: sanitizedCodUsuario },
              { codBarbero: sanitizedCodUsuario },
            ],
          },
          { estado: "Programado" },
          {
            OR: [
              { fechaTurno: { gt: now } },
              {
                fechaTurno: { equals: now },
                horaDesde: { gte: now },
              },
            ],
          },
        ],
      },
      include: {
        usuarios_turnos_codBarberoTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            codSucursal: true,
            sucursales: {
              select: {
                codSucursal: true,
                nombre: true,
                calle: true,
                altura: true,
              },
            },
          },
        },
        usuarios_turnos_codClienteTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
          },
        },
        tipos_corte: {
          select: {
            codCorte: true,
            nombreCorte: true,
            valorBase: true,
          },
        },
      },
      orderBy: [{ fechaTurno: "asc" }, { horaDesde: "asc" }],
    });

    logger.info("Found next turno for user");

    return turno ?? null;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding next turno",
    );
    throw new DatabaseError("Error al buscar próximo turno");
  }
};

export const findByUserId = async (codUsuario: string) => {
  try {
    //sanitize and validate
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // find appointments where the user is a client or a barber
    const turnos = await prisma.turno.findMany({
      where: {
        OR: [
          { codCliente: sanitizedCodUsuario },
          { codBarbero: sanitizedCodUsuario },
        ],
      },
      include: {
        usuarios_turnos_codBarberoTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            codSucursal: true,
            sucursales: {
              select: {
                codSucursal: true,
                nombre: true,
                calle: true,
                altura: true,
              },
            },
          },
        },
        usuarios_turnos_codClienteTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
          },
        },
        tipos_corte: {
          select: {
            codCorte: true,
            nombreCorte: true,
            valorBase: true,
          },
        },
      },
      orderBy: [{ fechaTurno: "desc" }, { horaDesde: "desc" }],
    });

    logger.info({ count: turnos.length }, "Found turnos for user");

    return turnos;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding turno",
    );
    throw new DatabaseError("Error al buscar turno");
  }
};

export const findByAvailableDate = async (
  fechaTurno: string,
  codSucursal: string,
) => {
  try {
    //sanitize and validate
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    const turnos = await prisma.turno.findMany({
      where: {
        fechaTurno: new Date(sanitizedFechaTurno),
        usuarios_turnos_codBarberoTousuarios: {
          codSucursal: sanitizedCodSucursal,
        },
        estado: "Programado",
      },
      include: {
        usuarios_turnos_codBarberoTousuarios: {
          select: {
            codUsuario: true,
            codSucursal: true,
          },
        },
      },
      orderBy: {
        horaDesde: "asc",
      },
    });

    const barberos = await prisma.usuarios.findMany({
      where: { codSucursal: sanitizedCodSucursal },
    });

    // Also search for barber blocks at that branch for the date.
    const fechaDate = new Date(sanitizedFechaTurno);
    const startOfDay = new Date(fechaDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const barberoIds = barberos.map((b) => b.codUsuario);
    const bloqueos = await prisma.bloqueos_barbero.findMany({
      where: {
        codBarbero: { in: barberoIds },
        fechaHoraDesde: { lte: endOfDay },
        fechaHoraHasta: { gte: startOfDay },
      },
    });

    // Use helper (with blocks considered))
    const horasDisponibles = generateAvailableTimeSlots(
      turnos,
      undefined,
      barberos,
      sanitizedFechaTurno,
      bloqueos,
    );

    return horasDisponibles;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding appointments",
    );
    throw new DatabaseError("Error al buscar turnos");
  }
};

export const findByBarberId = async (
  codBarbero: string,
  fechaTurno: string,
) => {
  try {
    //sanitizar y validar
    const sanitizedCodBarbero = sanitizeInput(codBarbero);
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);

    const turnos = await prisma.turno.findMany({
      where: {
        codBarbero: sanitizedCodBarbero,
        fechaTurno: new Date(sanitizedFechaTurno),
        estado: "Programado",
      },
    });

    logger.info({ count: turnos.length }, "Found existing appointments for barber");

    // Find the barber's blocks for that date and pass them to the helper.
    const fechaDate = new Date(sanitizedFechaTurno);
    const startOfDay = new Date(fechaDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bloqueos = await prisma.bloqueos_barbero.findMany({
      where: {
        codBarbero: sanitizedCodBarbero,
        fechaHoraDesde: { lte: endOfDay },
        fechaHoraHasta: { gte: startOfDay },
      },
    });

    // Use helper (with blocks considered)
    const horasDisponibles = generateAvailableTimeSlots(
      turnos,
      sanitizedCodBarbero,
      undefined,
      sanitizedFechaTurno,
      bloqueos,
    );

    logger.info({ count: horasDisponibles.length }, "Found available slots for barber");
    return horasDisponibles;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding turnos",
    );
    throw new DatabaseError("Error al buscar turnos");
  }
};

export const findByBranchId = async (codSucursal: string) => {
  try {
    //sanitize and validate
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    // Equivalent to the SQL query with a temporary table
    // Find scheduled appointments where the barber belongs to the specified branch.
    const turnos = await prisma.turno.findMany({
      where: {
        estado: "Programado",
        usuarios_turnos_codBarberoTousuarios: {
          codSucursal: sanitizedCodSucursal,
        },
      },
      include: {
        usuarios_turnos_codBarberoTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
            codSucursal: true,
          },
        },
        usuarios_turnos_codClienteTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
          },
        },
      },
      orderBy: [{ fechaTurno: "asc" }, { horaDesde: "asc" }],
    });

    logger.info({ count: turnos.length }, "Found scheduled appointments for branch");
    return turnos;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding sucursal",
    );
    throw new DatabaseError("Error al buscar sucursal");
  }
};

export const findPendingByBarberId = async (codBarbero: string) => {
  try {
    // sanitize and validate
    const sanitizedCodBarbero = sanitizeInput(codBarbero);


    // Find scheduled (active) appointments where the barber is the specified one
    // and the appointment date is equal to or later than today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingAppointments = await prisma.turno.findMany({
      where: {
        codBarbero: sanitizedCodBarbero,
        estado: "Programado",
        fechaTurno: {
          gte: today,
        },
      },
      include: {
        usuarios_turnos_codClienteTousuarios: {
          select: {
            codUsuario: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: [{ fechaTurno: "asc" }, { horaDesde: "asc" }],
    });

    logger.info({ count: pendingAppointments.length }, "Found pending appointments for barber");
    return pendingAppointments;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding pending appointments",
    );
    throw new DatabaseError("Error al buscar turnos pendientes del barbero");
  }
};

export const findPendingByBranchId = async (codSucursal: string) => {
  try {
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    const barberos = await prisma.usuarios.findMany({
      where: { codSucursal: sanitizedCodSucursal },
      select: { codUsuario: true },
    });

    const barberoIds = barberos.map((barbero) => barbero.codUsuario);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingAppointments = await prisma.turno.findMany({
      where: {
        codBarbero: {
          in: barberoIds,
        },
        estado: "Programado",
        fechaTurno: {
          gte: today,
        },
      },
      orderBy: [{ fechaTurno: "asc" }, { horaDesde: "asc" }],
    });

    logger.info({ count: pendingAppointments.length }, "Found pending appointments for branch");
    return pendingAppointments;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding pending appointments by branch",
    );
    throw new DatabaseError("Error al buscar turnos pendientes de la sucursal");
  }
};

export const update = async (
  codTurno: string,
  codCorte: string,
  codCliente: string,
  precioTurno: string,
  metodoPago: string,
  fechaCancelacion: string,
  fechaTurno: string,
  horaDesde: string,
  horaHasta: string,
  estado: string,
) => {
  try {
    // sanitize data
    const sanitizedData = {
      codTurno: sanitizeInput(codTurno),
      codCorte: sanitizeInput(codCorte),
      codCliente: sanitizeInput(codCliente),
      precioTurno: sanitizeInput(precioTurno),
      metodoPago: sanitizeInput(metodoPago),
      fechaCancelacion: sanitizeInput(fechaCancelacion),
      fechaTurno: sanitizeInput(fechaTurno),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: sanitizeInput(horaHasta),
      estado: sanitizeInput(estado),
    };

    const validatedData = parseValidatedInput(
      AppointmentSchema.omit({ codBarbero: true }),
      {
        codTurno: sanitizedData.codTurno,
        codCorte: sanitizedData.codCorte,
        codCliente: sanitizedData.codCliente,
        precioTurno: sanitizedData.precioTurno,
        metodoPago: sanitizedData.metodoPago,
        fechaCancelacion: sanitizedData.fechaCancelacion,
        fechaTurno: sanitizedData.fechaTurno,
        horaDesde: sanitizedData.horaDesde,
        horaHasta: sanitizedData.horaHasta,
        estado: sanitizedData.estado,
      },
    );

    // Use the sanitized codTurno (not validated by Zod)
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedData.codTurno },
    });

    assertEntityExists(existingTurno, "Turno");

    // convert strings to correct types for Prisma
    const fechaDate = new Date(sanitizedData.fechaTurno); // Use sanitized data
    const horaDesdeDate = new Date(
      `1970-01-01T${sanitizedData.horaDesde}:00.000Z`,
    );
    const horaHastaDate = new Date(
      `1970-01-01T${sanitizedData.horaHasta}:00.000Z`,
    );

    const fechaCancelacionDate = validatedData.fechaCancelacion
      ? new Date(validatedData.fechaCancelacion)
      : null;
    const estadoFinal = fechaCancelacionDate
      ? "Cancelado"
      : validatedData.estado;
    const precio = validatedData.precioTurno
      ? parseFloat(validatedData.precioTurno)
      : null;

    // update appointment using sanitized codTurno
    const updatedTurno = await prisma.turno.update({
      where: { codTurno: sanitizedData.codTurno },
      data: {
        codCorte: validatedData.codCorte,
        codCliente: validatedData.codCliente,
        precioTurno: precio,
        metodoPago: validatedData.metodoPago,
        fechaCancelacion: fechaCancelacionDate,
        fechaTurno: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
        estado: estadoFinal,
      },
    });

    logger.info("Turno updated successfully");
    return updatedTurno;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error updating turno",
    );

    // handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar turno");
  }
};

export const updateAppointment = async (
  codTurno: string,
  fechaTurno: string,
  horaDesde: string,
  horaHasta?: string,
) => {
  try {
    // sanitize and validate
    const sanitizedCodTurno = sanitizeInput(codTurno);
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);
    const sanitizedHoraDesde = sanitizeInput(horaDesde);
    let sanitizedHoraHasta = horaHasta ? sanitizeInput(horaHasta) : "";

    // Auto-calculate horaHasta (+30 min) when not provided
    if (!sanitizedHoraHasta) {
      const [h, m] = sanitizedHoraDesde.split(":").map(Number);
      const totalMin = h * 60 + m + 30;
      const newH = Math.floor(totalMin / 60);
      const newM = totalMin % 60;
      sanitizedHoraHasta = `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
    }

    // convert strings to Date objects for Prisma
    const fechaDate = new Date(sanitizedFechaTurno);
    const horaDesdeDate = new Date(`1970-01-01T${sanitizedHoraDesde}:00.000Z`);

    const horaHastaDate = new Date(`1970-01-01T${sanitizedHoraHasta}:00.000Z`);

    logger.debug({ codTurno: sanitizedCodTurno }, "Searching turno to update");

    // find existing appointment
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    assertEntityExists(existingTurno, "Turno");

    logger.debug("Turno found, updating...");

    // update appointment
    const updatedTurno = await prisma.turno.update({
      where: { codTurno: sanitizedCodTurno },
      data: {
        fechaTurno: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
      },
    });

    logger.info("Turno updated successfully");
    return updatedTurno;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error updating turno",
    );
    logger.error({ error }, "Full error details");

    // handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // handle errors of DB
    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar turno");
  }
};

export const checkoutAppointment = async (
  codTurno: string,
  codCorte: string,
  precioTurno: number,
  metodoPago?: string,
) => {
  try {
    // sanitize and validate
    const sanitizedCodTurno = sanitizeInput(codTurno);
    const sanitizedCodCorte = sanitizeInput(codCorte);
    logger.debug({ codTurno: sanitizedCodTurno }, "Searching turno for checkout");

    // find appointment and verify it's in "Programado" state
    const turnoExistente = await prisma.turno.findFirst({
      where: {
        codTurno: sanitizedCodTurno,
        estado: "Programado",
      },
    });

    if (!turnoExistente) {
      logger.info("Turno not found or not in Programado state");
      throw new DatabaseError(
        "Turno no encontrado o no está en estado Programado",
      );
    }

    // Validate that the appointment is for today
    const now = new Date();
    const fechaTurno = new Date(turnoExistente.fechaTurno);

    const todayUTC = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const appointmentDateUTC = fechaTurno.toISOString().substring(0, 10);

    if (appointmentDateUTC > todayUTC) {
      logger.info("Turno date does not match today");
      throw new DatabaseError("Solo se pueden cobrar turnos del día de hoy");
    }

    // Combine date of the appointment with the start time to get the exact start moment
    const horaDesde = turnoExistente.horaDesde;
    const [hours, minutes] = horaDesde
      .toISOString()
      .substring(11, 16)
      .split(":");
    fechaTurno.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (fechaTurno > now) {
      logger.info("Turno has not started yet");
      throw new DatabaseError(
        "No se puede cobrar un turno que aún no ha comenzado",
      );
    }

    const { turnoUpdated } = await prisma.$transaction(async (tx) => {
      const codCliente = turnoExistente.codCliente;

      const latestCv = await tx.categoria_vigente.findFirst({
        where: { codCliente },
        orderBy: { ultimaFechaInicio: "desc" },
        include: { categorias: true },
      });

      const latestCategory = latestCv?.categorias ?? null;

      // Calculate the discount from the latest active category.      // Updated rule:
      let precioFinal = precioTurno;

      if (latestCv && latestCategory) {
        const cobradoCount = await tx.turno.count({
          where: {
            codCliente,
            estado: "Cobrado",
            fechaTurno: latestCv.ultimaFechaInicio
              ? { gt: latestCv.ultimaFechaInicio }
              : undefined,
          },
        });

        const categoriaNombre = latestCategory.nombreCategoria || null;
        const cycle = getDiscountCycle(categoriaNombre);

        const { precioFinal: appliedPrice, applied } = applyDiscountIfEligible(
          precioTurno,
          latestCategory.descuentoCorte,
          cobradoCount,
          cycle,
        );

        if (applied) {
          precioFinal = appliedPrice;
          logger.info("Applying discount");
        }
      }

      // Update the appointment with the calculated price
      const turnoUpdated = await tx.turno.update({
        where: { codTurno: sanitizedCodTurno },
        data: {
          codCorte: sanitizedCodCorte,
          precioTurno: precioFinal,
          metodoPago: metodoPago || null,
          estado: "Cobrado",
        },
      });

      if (!latestCv) {
        logger.warn("No categoria_vigente found for client");
        return { turnoUpdated };
      }

      const currentCategoria = latestCategory;
      const nombreCategoria = currentCategoria?.nombreCategoria || null;
      const ultimaFechaInicio = latestCv.ultimaFechaInicio;

      const cobradoCount = await tx.turno.count({
        where: {
          codCliente,
          estado: "Cobrado",
          fechaTurno: ultimaFechaInicio ? { gt: ultimaFechaInicio } : undefined,
        },
      });

      const now = new Date();

      if (nombreCategoria === "Inicial") {
        // check N days and N cuts for Initial -> Medium promotion
        const threshold = new Date(ultimaFechaInicio);
        threshold.setDate(threshold.getDate() + INITIAL_TO_MEDIUM_DAYS);
        if (now >= threshold && cobradoCount >= INITIAL_TO_MEDIUM_COUNT) {
          const mediumCat = await tx.categoria.findFirst({
            where: { nombreCategoria: "Medium" },
          });
          if (mediumCat) {
            await tx.categoria_vigente.create({
              data: {
                codCategoria: mediumCat.codCategoria,
                codCliente,
                ultimaFechaInicio: new Date(),
              },
            });
            logger.info("Client promoted to Medium");
          } else {
            logger.warn("Category 'Medium' not found");
          }
        }
      } else if (nombreCategoria === "Medium") {
        const threshold = new Date(ultimaFechaInicio);
        threshold.setFullYear(threshold.getFullYear() + 3);
        if (now >= threshold && cobradoCount >= 25) {
          const premiumCat = await tx.categoria.findFirst({
            where: { nombreCategoria: "Premium" },
          });
          if (premiumCat) {
            await tx.categoria_vigente.create({
              data: {
                codCategoria: premiumCat.codCategoria,
                codCliente,
                ultimaFechaInicio: new Date(),
              },
            });
            logger.info("Client promoted to Premium");
          } else {
            logger.warn("Category 'Premium' not found");
          }
        }
      }
      return { turnoUpdated };
    });

    logger.info("Turno charged successfully");

    // try automatic billing via ARCA (doesnt block if it fails)
    let facturacion = null;
    let facturacionError: string | null = null;
    let facturacionErrorCode: string | null = null;
    let facturacionErrorAfipCode: string | null = null;
    try {
      facturacion = await billAppointment(sanitizedCodTurno);
      logger.info("ARCA invoice generated automatically");
    } catch (billingError: unknown) {
      const errorInfo = extractBillingErrorInfo(billingError);
      facturacionError = errorInfo.fullMessage;
      facturacionErrorCode = errorInfo.code ?? null;
      facturacionErrorAfipCode = errorInfo.afipCode ?? null;
      logger.warn("Could not generate ARCA invoice automatically");
    }

    return {
      ...turnoExistente,
      facturacion,
      facturacionError,
      facturacionErrorCode,
      facturacionErrorAfipCode,
    };
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error charging turno",
    );
    logger.error({ error }, "Full error details");

    // handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // handle DB errors
    if (error instanceof DatabaseError) {
      throw error;
    }

    // handle specific Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      logger.debug({ prismaCode: prismaError.code }, "Prisma error code");

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Turno no encontrado");
      }
    }

    throw new DatabaseError("Error al cobrar turno");
  }
};

export const cancelAppointment = async (codTurno: string) => {
  try {
    // sanitize and validate
    const sanitizedCodTurno = sanitizeInput(codTurno);

    // Calculate cancelation date in the server
    const fechaDate = new Date();

    logger.debug({ codTurno: sanitizedCodTurno }, "Searching turno to cancel");

    // first verify that the appointment exists
    const turnoExistente = await prisma.turno.findUnique({
      where: {
        codTurno: sanitizedCodTurno,
        estado: "Programado",
      },
    });

    if (!turnoExistente) {
      logger.info("Turno not found");
      throw new DatabaseError("Turno no encontrado");
    }

    logger.debug("Turno found, updating state...");

    // update the state of the appointment
    const existingTurno = await prisma.turno.update({
      where: { codTurno: sanitizedCodTurno },
      data: { fechaCancelacion: fechaDate, estado: "Cancelado" },
    });

    // Verify if the person canceling is a client (doesn't have codSucursal or cuil)
    const cliente = await prisma.usuarios.findUnique({
      where: { codUsuario: existingTurno.codCliente },
      select: { codSucursal: true, cuil: true },
    });

    const esCliente = cliente && !cliente.codSucursal && !cliente.cuil;

    // only aply logic of downgrade if it is a client and canceled the same day
    if (
      esCliente &&
      existingTurno.fechaCancelacion == existingTurno.fechaTurno
    ) {
      // Determine range of dates according to the current semester
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

      let startDate: Date;
      let endDate: Date;

      if (currentMonth >= 1 && currentMonth <= 6) {
        // first semester (january a june)
        startDate = new Date(currentYear, 0, 1); // 1 january
        endDate = new Date(currentYear, 5, 30, 23, 59, 59); // 30 june
      } else {
        // second semester (july a december)
        startDate = new Date(currentYear, 6, 1); // 1 july
        endDate = new Date(currentYear, 11, 31, 23, 59, 59); // 31 december
      }

      // count canceled appointments that were canceled on the same day as the appointment in the current semester
      const turnosCanceladosMismoDia = await prisma.turno.findMany({
        where: {
          codCliente: existingTurno.codCliente,
          estado: "Cancelado",
          fechaTurno: {
            gte: startDate,
            lte: endDate,
          },
          fechaCancelacion: {
            not: null,
          },
        },
        select: {
          fechaTurno: true,
          fechaCancelacion: true,
        },
      });

      const canceledSameDayCount = turnosCanceladosMismoDia.filter((turno) => {
        if (!turno.fechaCancelacion) return false;
        return (
          turno.fechaTurno.toISOString().split("T")[0] ===
          turno.fechaCancelacion.toISOString().split("T")[0]
        );
      }).length;

      logger.info("Client has same-day cancellations in semester");

      // If they have 3 or more cancellations on the same day, downgrade their category.
      if (canceledSameDayCount >= 3) {
        // get the current active category of the client
        const categoriaVigenteActual = await prisma.categoria_vigente.findFirst(
          {
            where: { codCliente: existingTurno.codCliente },
            include: { categorias: true },
            orderBy: { ultimaFechaInicio: "desc" },
          },
        );

        if (categoriaVigenteActual) {
          const categoriaActual =
            categoriaVigenteActual.categorias.nombreCategoria;
          let nuevaCategoriaNombre: string | null = null;

          // determine the new category according to the hierarchy
          if (categoriaActual === "Premium") {
            nuevaCategoriaNombre = "Medium";
          } else if (categoriaActual === "Medium") {
            nuevaCategoriaNombre = "Inicial";
          } else if (categoriaActual === "Inicial") {
            nuevaCategoriaNombre = "Vetado";
          }

          if (nuevaCategoriaNombre) {
            // search for the new category
            const nuevaCategoria = await prisma.categoria.findFirst({
              where: { nombreCategoria: nuevaCategoriaNombre },
            });

            if (nuevaCategoria) {
              // Create the record for the new active category
              await prisma.categoria_vigente.create({
                data: {
                  codCliente: existingTurno.codCliente,
                  codCategoria: nuevaCategoria.codCategoria,
                  ultimaFechaInicio: new Date(),
                },
              });

              logger.info("Client demoted category");
            }
          }
        }
      }
    }

    logger.info("Turno cancelled successfully");
    return existingTurno;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error cancelling turno",
    );
    logger.error({ error }, "Full error details");

    // handle  validation errors 
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // handle database errors
    if (error instanceof DatabaseError) {
      throw error;
    }

    // handle  specific Prisma errores
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      logger.debug({ prismaCode: prismaError.code }, "Prisma error code");

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Turno no encontrado");
      }
    }

    throw new DatabaseError("Error al cancelar turno");
  }
};

export const markAsNoShow = async (codTurno: string) => {
  try {
    // sanitize and validate
    const sanitizedCodTurno = sanitizeInput(codTurno);

    const turnoExistente = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    if (!turnoExistente) {
      logger.info("Turno not found");
      throw new DatabaseError("Turno no encontrado");
    }

    // Validate that the appointment is for today
    const now = new Date();
    const fechaTurno = new Date(turnoExistente.fechaTurno);

    const todayUTC = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const appointmentDateUTC = fechaTurno.toISOString().substring(0, 10);

    if (appointmentDateUTC !== todayUTC) {
      logger.info("Turno date does not match today");
      throw new DatabaseError(
        "Solo se pueden marcar como no asistido los turnos del día de hoy",
      );
    }

    // merge data of the appointment with the end time to get the exact moment of completion
    const horaHasta = turnoExistente.horaHasta;
    const [hours, minutes] = horaHasta
      .toISOString()
      .substring(11, 16)
      .split(":");
    fechaTurno.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (fechaTurno > now) {
      logger.info("Turno has not finished yet");
      throw new DatabaseError(
        "No se puede marcar como no asistido un turno que aún no ha finalizado",
      );
    }

    logger.debug("Turno found and validated, updating state...");

    // update the state of the appointment to "No asistido"
    const updatedTurno = await prisma.turno.update({
      where: { codTurno: sanitizedCodTurno },
      data: { estado: "No asistido" },
    });

    logger.info("Turno marked as No-show successfully");

    // Determine range of dates according to the current semester
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11

    let startDate: Date;
    let endDate: Date;

    if (currentMonth >= 1 && currentMonth <= 6) {
      // first semester (january to june)
      startDate = new Date(currentYear, 0, 1); // 1 january
      endDate = new Date(currentYear, 5, 30, 23, 59, 59); // 30 june
    } else {
      // second semester (july to december)
      startDate = new Date(currentYear, 6, 1); // 1 july
      endDate = new Date(currentYear, 11, 31, 23, 59, 59); // 31 december
    }

    // Count "No asistido" appointments for the client in the current semester
    const noShowCount = await prisma.turno.count({
      where: {
        codCliente: updatedTurno.codCliente,
        estado: "No asistido",
        fechaTurno: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    logger.info("Client has no-show count in semester");

    // If the customer has 3 or more "No-show" appointments in the semester, assign the "Vetado" category.

    if (noShowCount >= 3) {
      const categoriaVetado = await prisma.categoria.findFirst({
        where: { nombreCategoria: "Vetado" },
      });

      if (categoriaVetado) {
        await prisma.categoria_vigente.create({
          data: {
            codCliente: updatedTurno.codCliente,
            codCategoria: categoriaVetado.codCategoria,
            ultimaFechaInicio: new Date(),
          },
        });

        logger.info("Category 'Vetado' assigned to client");
      }
    }

    return updatedTurno;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error marking turno as no-show",
    );
    logger.error({ error }, "Full error details");

    // handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // handle DB errors
    if (error instanceof DatabaseError) {
      throw error;
    }

    // handle specific Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      logger.debug({ prismaCode: prismaError.code }, "Prisma error code");

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Turno no encontrado");
      }
    }

    throw new DatabaseError("Error al marcar turno como No asistido");
  }
};

export const destroy = async (codTurno: string) => {
  try {
    // sanitize and validate
    const sanitizedCodTurno = sanitizeInput(codTurno);

    // verify that the appointment exists
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    if (!existingTurno) {
      throw new DatabaseError("Turno no encontrado");
    }

    // delete appointment
    const deletedTurno = await prisma.turno.delete({
      where: { codTurno: sanitizedCodTurno },
    });

    logger.info("Turno deleted successfully");
    return deletedTurno;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error deleting turno",
    );

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar turno");
  }
};
