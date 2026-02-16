import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import { z } from "zod";
import { hashPassword, comparePassword } from "../users/bcrypt";
import { UserSchema, UserBaseSchemaExport } from "../Schemas/usersSchema";

// Función para crear usuario normal (sin CUIL)
export const store = async (
  dni: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string,
  cuil?: string,
  codSucursal?: string,
  preguntaSeguridad?: string,
  respuestaSeguridad?: string,
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
      cuil: cuil ? sanitizeInput(cuil) : undefined, // sanitizo si existe
      preguntaSeguridad: preguntaSeguridad
        ? sanitizeInput(preguntaSeguridad)
        : undefined,
      respuestaSeguridad: respuestaSeguridad
        ? sanitizeInput(respuestaSeguridad)
        : undefined,
    };

    // Validación con zod
    const validatedData = UserSchema.parse(sanitizedData);

    console.log("Validated user data keys:", {
      preguntaSeguridad: !!validatedData.preguntaSeguridad,
      respuestaSeguridad: !!validatedData.respuestaSeguridad,
    });

    console.log("Creating user");

    // encriptar contraseña luego de sanitizada
    const hashedPassword = await hashPassword(validatedData.contraseña);
    // encriptar respuesta de seguridad si se proporciona
    let hashedRespuestaSeguridad: string | null = null;
    if (validatedData.respuestaSeguridad) {
      hashedRespuestaSeguridad = await hashPassword(
        validatedData.respuestaSeguridad,
      );
    }
    let cuilValue = null;
    if (validatedData.cuil) {
      // Limpiar CUIL para almacenamiento
      cuilValue = validatedData.cuil.replace(/[-\s]/g, "");
    }
    // Crear usuario (mapeando contraseña -> contrase_a, sin transacción para evitar errores de transacción en dev)
    const usuario = await prisma.usuarios.create({
      // cast a any because prisma client types may need regeneration after schema change
      data: {
        dni: validatedData.dni,
        cuil: cuilValue, // Los usuarios normales no tienen CUIL !
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
        email: validatedData.email,
        contrase_a: hashedPassword,
        codSucursal: codSucursal || null,
        preguntaSeguridad:
          validatedData.preguntaSeguridad || preguntaSeguridad || null,
        respuestaSeguridad: hashedRespuestaSeguridad || null,
      } as any,
    });

    // Solo crear categoría vigente para clientes (sin CUIL)
    if (!cuilValue) {
      // Buscar categoría inicial
      const categoriaInicial = await prisma.categoria.findFirst({
        where: { nombreCategoria: "Inicial" },
      });

      if (!categoriaInicial) {
        throw new DatabaseError(
          "Categoría inicial no encontrada en el sistema",
        );
      }

      // Crear categoría vigente inicial para el cliente
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

    // Manejo de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // Manejo de errores de DB (Prisma)
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
          // DNI y CUIL pueden estar duplicados, solo validamos email
        }

        // Si el error no es de email, lo ignoramos (permite DNI/CUIL duplicados)
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
  //indico que tipo de usuario quiero mostrar
  try {
    console.log(`Fetching all ${userType} with Prisma`);

    let whereCondition = {};
    switch (userType) {
      case "client":
        whereCondition = { cuil: null, activo: true }; // Solo usuarios sin CUIL (clientes)
        break;
      case "barber":
        // Mostrar todos los barberos (activos e inactivos) para que el admin pueda verlos
        whereCondition = {
          AND: [{ cuil: { not: null } }, { cuil: { not: "1" } }],
          // NO filtramos por activo para mostrar también los barberos dados de baja
        };
        break;
      default:
        whereCondition = { activo: true }; // Todos los usuarios activos
    }

    // Solo usuarios sin CUIL (usuarios normales, no barberos)
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
          take: 1, // Solo la más reciente
          include: {
            categorias: true, // Incluir datos de la categoría
          },
        },
      },
    });

    if (!usuario) {
      throw new DatabaseError("Usuario no encontrado");
    }
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
      categoria_vigente: undefined, // Remover para limpiar la respuesta
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
    // Sanitizar y validar
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

    // Sanitizar datos
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

    const validatedData = UpdateUserSchema.parse({
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

    // Verificar que el usuario existe
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

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

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

      if (pendingCount > 0) {
        throw new DatabaseError(
          "No se puede cambiar de sucursal. Tiene turnos pendientes",
        );
      }
    }
    // preparo los datos obligatorios para la actualizacion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      //! Criminal
      dni: validatedData.dni,
      nombre: validatedData.nombre,
      apellido: validatedData.apellido,
      telefono: validatedData.telefono,
      email: validatedData.email,
      codSucursal: validatedData.codSucursal,
    };

    // Solo encriptar y actualizar contraseña si se proporciona una nueva
    if (validatedData.contraseña) {
      const hashedPassword = await hashPassword(validatedData.contraseña);
      updateData.contrase_a = hashedPassword;
    }

    // Solo actualizar CUIL si se proporciona
    if (validatedData.cuil) {
      updateData.cuil = validatedData.cuil.replace(/[-\s]/g, "");
    }

    // Actualizar usuario
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

    // Manejo de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // Manejar errores de DB
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
    // Sanitizar y validar
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // Verificar que el usuario existe
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

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

      if (pendingCount > 0) {
        throw new DatabaseError(
          "No se puede dar de baja al barbero. Tiene turnos pendientes",
        );
      }
    }

    // Baja lógica del usuario
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

    // Manejo de errores de DB
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
    // Sanitizar y validar
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // Verificar que el usuario existe
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

    // Verificar que es un barbero (tiene CUIL y no es admin)
    if (!existingUsuario.cuil || existingUsuario.cuil === "1") {
      throw new DatabaseError("Solo se pueden reactivar barberos");
    }

    // Verificar que el usuario está inactivo
    if (existingUsuario.activo) {
      throw new DatabaseError("El usuario ya está activo");
    }

    // Reactivar el barbero
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

    // Manejo de errores de DB
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

// Schema de validación para login
const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  contraseña: z.string().min(1, "Contraseña es requerida"),
});

// Función para validar login del usuario
export const validateLogin = async (email: string, contraseña: string) => {
  try {
    // Sanitizar inputs
    const sanitizedData = {
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    // Validación con zod
    const validatedData = LoginSchema.parse(sanitizedData);

    console.log("Validating user login for email:", validatedData.email);

    // Buscar usuario solo por email (NO por contraseña)
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

    // Verificar contraseña usando bcrypt
    const isPasswordValid = await comparePassword(
      validatedData.contraseña,
      usuario.contrase_a,
    );

    if (!isPasswordValid) {
      console.log("Login failed: Invalid password");
      throw new DatabaseError("Email o contraseña incorrectos");
    }

    console.log("User login validated successfully for user:", {
      codUsuario: usuario.codUsuario,
      email: usuario.email,
      cuil: usuario.cuil,
      userType:
        usuario.cuil === "1" ? "admin" : usuario.cuil ? "barber" : "client",
    });

    // Verificar si el usuario es cliente y tiene categoría "Vetado"
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

    // Retornar usuario sin contraseña por seguridad
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrase_a, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  } catch (error) {
    console.error(
      "Error validating login:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // Manejo de errores de validación
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

// Obtener pregunta de seguridad por email (sin revelar respuesta)
export const getSecurityQuestionByEmail = async (email: string) => {
  try {
    const sanitizedEmail = sanitizeInput(email);
    const usuario = (await prisma.usuarios.findFirst({
      where: { email: sanitizedEmail, activo: true },
      select: { preguntaSeguridad: true },
    })) as any;

    if (!usuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

    return usuario.preguntaSeguridad || null;
  } catch (error) {
    console.error("Error getting security question:", error);
    throw new DatabaseError("Error al obtener la pregunta de seguridad");
  }
};

const getUserAndValidateSecurityAnswer = async (
  email: string,
  respuesta: string,
) => {
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedRespuesta = sanitizeInput(respuesta);

  console.log("validateSecurityAnswer called for:", sanitizedEmail);

  const usuario = (await prisma.usuarios.findFirst({
    where: { email: sanitizedEmail, activo: true },
  })) as any;

  console.log(
    "User lookup result:",
    !!usuario,
    usuario ? { codUsuario: usuario.codUsuario, email: usuario.email } : null,
  );
  console.log(
    "Has stored respuestaSeguridad?",
    !!(usuario && usuario.respuestaSeguridad),
  );

  if (!usuario) {
    throw new DatabaseError("Usuario no encontrado");
  }

  if (!usuario.respuestaSeguridad) {
    throw new DatabaseError(
      "No hay respuesta de seguridad configurada para este usuario",
    );
  }

  // Comparar la respuesta (guardada hasheada)
  console.log(
    "Stored respuestaSeguridad length:",
    usuario.respuestaSeguridad ? usuario.respuestaSeguridad.length : 0,
  );
  const isAnswerValid = await comparePassword(
    sanitizedRespuesta,
    usuario.respuestaSeguridad,
  );

  if (!isAnswerValid) {
    throw new DatabaseError("Respuesta incorrecta");
  }

  return usuario;
};

// Verificar respuesta de seguridad (sin resetear contraseña)
export const verifySecurityAnswerOnly = async (
  email: string,
  respuesta: string,
) => {
  try {
    await getUserAndValidateSecurityAnswer(email, respuesta);
    return true;
  } catch (error) {
    console.error("Error verifying security answer:", error);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError("Error al verificar la respuesta");
  }
};

// Verificar respuesta de seguridad y actualizar contraseña si es correcta
export const verifySecurityAnswerAndReset = async (
  email: string,
  respuesta: string,
  nuevaContraseña: string,
) => {
  try {
    const sanitizedNueva = sanitizeInput(nuevaContraseña);

    const usuario = await getUserAndValidateSecurityAnswer(email, respuesta);

    // Hashear nueva contraseña y actualizar
    const hashedNewPassword = await hashPassword(sanitizedNueva);

    const updated = await prisma.usuarios.update({
      where: { codUsuario: usuario.codUsuario },
      // cast any to avoid generated types mismatch until client is regenerated
      data: { contrase_a: hashedNewPassword } as any,
    });

    return updated;
  } catch (error) {
    console.error(
      "Error verifying security answer or resetting password:",
      error,
    );
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(
      "Error al verificar la respuesta o actualizar la contraseña",
    );
  }
};

// Update security question and (hashed) answer for a user
export const updateSecurityQuestion = async (
  codUsuario: string,
  preguntaSeguridad: string,
  respuestaSeguridad: string,
) => {
  try {
    const sanitizedCod = sanitizeInput(codUsuario);
    const sanitizedPregunta = sanitizeInput(preguntaSeguridad);
    const sanitizedRespuesta = sanitizeInput(respuestaSeguridad);

    // Hashear la respuesta antes de guardar
    const hashedRespuesta = await hashPassword(sanitizedRespuesta);

    const updated = await prisma.usuarios.update({
      where: { codUsuario: sanitizedCod },
      data: {
        preguntaSeguridad: sanitizedPregunta,
        respuestaSeguridad: hashedRespuesta,
      } as any,
    });

    return updated;
  } catch (error) {
    console.error("Error updating security question in model:", error);
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError("Error al actualizar la pregunta de seguridad");
  }
};
