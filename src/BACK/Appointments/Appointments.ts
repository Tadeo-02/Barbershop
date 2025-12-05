import { prisma, DatabaseError, sanitizeInput } from "../base/Base"; // importamos todo desde Base
import { z } from "zod";

// schema de validación con Zod (más robusto que las funciones manuales)
const AppointmentsSchema = z.object({
  codTurno: z.string().uuid("ID de turno inválido").optional(),
  codCorte: z.string().min(1, "Código de corte es requerido").optional(),
  codCliente: z.string().min(1, "Código de cliente es requerido"),
  codBarbero: z.string().min(1, "Código de barbero es requerido"),
  precioTurno: z
    .string()
    .min(1, "Precio es requerido")
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Precio inválido. Formato numérico con hasta 2 decimales"
    )
    .optional(),
  metodoPago: z
    .string()
    .min(1, "Método de pago es requerido")
    .max(50, "Método de pago no puede tener más de 50 caracteres")
    .optional(),
  fechaCancelacion: z
    .string()
    .min(1, "Fecha es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD")
    .optional(),
  fechaTurno: z
    .string()
    .min(1, "Fecha de turno es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD"),
  horaDesde: z
    .string()
    .min(1, "Hora desde es requerida")
    .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM"),
  horaHasta: z
    .string()
    .min(1, "Hora hasta es requerida")
    .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM"),
  estado: z
    .string()
    .min(1, "Estado es requerido")
    .max(50, "Estado no puede tener más de 50 caracteres"),
});

// Umbrales configurables (pueden ser sobreescritos por env vars durante pruebas)
const INITIAL_TO_MEDIUM_DAYS = parseInt(
  process.env.INITIAL_TO_MEDIUM_DAYS || "30",
  10
);
const INITIAL_TO_MEDIUM_COUNT = parseInt(
  process.env.INITIAL_TO_MEDIUM_COUNT || "5",
  10
);

// funciones backend
export const store = async (
  codCliente: string,
  codBarbero: string,
  fechaTurno: string,
  horaDesde: string,
  horaHasta: string,
  estado: string
) => {
  try {
    // sanitizar inputs
    const sanitizedData = {
      codCliente: sanitizeInput(codCliente),
      codBarbero: sanitizeInput(codBarbero),
      fechaTurno: sanitizeInput(fechaTurno),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: sanitizeInput(horaHasta),
      estado: sanitizeInput(estado),
    };

    // validación con zod - omitir codTurno y codEstado para creación
    const validatedData = AppointmentsSchema.omit({
      codTurno: true,
    }).parse(sanitizedData);
    console.log("Creating turno");

    // convertir strings a Date objects para Prisma
    const fechaDate = new Date(sanitizedData.fechaTurno);
    const horaDesdeDate = new Date(
      `1970-01-01T${sanitizedData.horaDesde}:00.000Z`
    );
    const horaHastaDate = new Date(
      `1970-01-01T${sanitizedData.horaHasta}:00.000Z`
    );

    // crear turno
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

    console.log("Turno created successfully");
    return [turno];
  } catch (error) {
    console.error(
      "Error creating turno:",
      error instanceof Error ? error.message : "Unknown error"
    );
    //manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    console.log("Fetching all turnos with Prisma");

    const turnos = await prisma.turno.findMany({
      orderBy: { fechaTurno: "desc" },
    });

    console.log(`Retrieved ${turnos.length} turnos`);
    console.log(turnos);
    return turnos;
  } catch (error) {
    console.error(
      "Error fetching turnos:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al obtener lista de turnos");
  }
};

export const findById = async (codTurno: string) => {
  try {
    //sanitizar y validar
    const sanitizedCodTurno = sanitizeInput(codTurno);

    const turno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    return turno;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding turno:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar turno");
  }
};

export const findByUserId = async (codUsuario: string) => {
  try {
    //sanitizar y validar
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // Buscar turnos donde el usuario es cliente o barbero
    const turnos = await prisma.turno.findMany({
      where: {
        OR: [
          { codCliente: sanitizedCodUsuario },
          { codBarbero: sanitizedCodUsuario },
        ],
      },
      orderBy: [{ fechaTurno: "desc" }, { horaDesde: "desc" }],
    });

    console.log(
      `Found ${turnos.length} turnos for user ${sanitizedCodUsuario}`
    );

    return turnos;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding turno:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar turno");
  }
};

export const findByAvailableDate = async (
  fechaTurno: string,
  codSucursal: string
) => {
  try {
    //sanitizar y validar
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

    const horasDisponibles = [];
    for (let hora = 8; hora <= 19.5; hora += 0.5) {
      // Convertir la hora del bucle a formato de tiempo
      const horaString = `${Math.floor(hora).toString().padStart(2, "0")}:${(
        (hora % 1) *
        60
      )
        .toString()
        .padStart(2, "0")}`;

      for (const barbero of barberos) {
        // Verificar si existe un turno para este barbero en esta hora específica
        const turnoExistente = turnos.find((t) => {
          // Usar toISOString() para obtener la hora correcta sin conversiones de zona horaria
          const turnoHoraCorrecta = t.horaDesde.toISOString().substring(11, 16);

          return (
            t.codBarbero === barbero.codUsuario &&
            turnoHoraCorrecta === horaString
          );
        });

        if (!turnoExistente) {
          horasDisponibles.push({
            // barbero: barbero.codUsuario,
            // fecha: fechaTurno,
            hora: horaString,
          });
          break; // Salir del bucle de barberos una vez que se encuentra disponibilidad
        }
      }
    }

    return horasDisponibles;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding appointments:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar turnos");
  }
};

export const findByBarberId = async (
  codBarbero: string,
  fechaTurno: string
) => {
  try {
    //sanitizar y validar
    const sanitizedCodBarbero = sanitizeInput(codBarbero);
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);

    const turnos = await prisma.turno.findMany({
      where: {
        codBarbero: sanitizedCodBarbero,
        fechaTurno: new Date(sanitizedFechaTurno),
      },
    });

    console.log(
      `Found ${turnos.length} existing appointments for barber ${sanitizedCodBarbero} on ${sanitizedFechaTurno}`
    );

    const horasDisponibles = [];
    for (let hora = 8; hora <= 19.5; hora += 0.5) {
      // Convertir la hora del bucle a formato de tiempo
      const horaString = `${Math.floor(hora).toString().padStart(2, "0")}:${(
        (hora % 1) *
        60
      )
        .toString()
        .padStart(2, "0")}`;

      // Verificar si existe un turno para este barbero en esta hora específica
      const turnoExistente = turnos.find((t) => {
        const turnoHoraCorrecta = t.horaDesde.toISOString().substring(11, 16);

        return (
          t.codBarbero === sanitizedCodBarbero &&
          turnoHoraCorrecta === horaString
        );
      });

      if (!turnoExistente) {
        horasDisponibles.push({
          hora: horaString,
        });
      }
    }

    console.log(`Found ${horasDisponibles.length} available slots for barber`);
    return horasDisponibles;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding turnos:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar turnos");
  }
};

export const findByBranchId = async (codSucursal: string) => {
  try {
    //sanitizar y validar
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    // Equivalente a la consulta SQL con tabla temporal
    // Buscar turnos programados donde el barbero pertenece a la sucursal especificada
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

    console.log(
      `Found ${turnos.length} scheduled appointments for branch ${sanitizedCodSucursal}`
    );
    return turnos;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding sucursal:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar sucursal");
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
  estado: string
) => {
  try {
    // sanitizar datos
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

    const validatedData = AppointmentsSchema.parse({
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
    });

    // Usar el codTurno sanitizado (no validado por Zod)
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedData.codTurno },
    });

    if (!existingTurno) {
      throw new DatabaseError("Turno no encontrado");
    }

    // convertir strings a tipos correctos para Prisma
    const fechaDate = new Date(sanitizedData.fechaTurno); // Usar sanitized data
    const horaDesdeDate = new Date(
      `1970-01-01T${sanitizedData.horaDesde}:00.000Z`
    );
    const horaHastaDate = new Date(
      `1970-01-01T${sanitizedData.horaHasta}:00.000Z`
    );

    const fechaCancelacionDate = validatedData.fechaCancelacion
      ? new Date(validatedData.fechaCancelacion)
      : null;
    const precio = validatedData.precioTurno
      ? parseFloat(validatedData.precioTurno)
      : null;

    // update turno usando codTurno sanitizado
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
        estado: validatedData.estado,
      },
    });

    console.log("Turno updated successfully");
    return updatedTurno;
  } catch (error) {
    console.error(
      "Error updating turno:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // manejar errores de DB
    //! Adaptar para turnos
    // if (error && typeof error === "object" && "code" in error) {
    //   const prismaError = error as { code: string };

    //   if (prismaError.code === "P2002") {
    //     throw new DatabaseError("El nuevo CUIL ya existe en el sistema");
    //   }

    //   if (prismaError.code === "P2025") {
    //     throw new DatabaseError("Turno no encontrado");
    //   }
    // }

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
  horaHasta: string
) => {
  try {
    // sanitizar y validar
    const sanitizedCodTurno = sanitizeInput(codTurno);
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);
    const sanitizedHoraDesde = sanitizeInput(horaDesde);
    const sanitizedHoraHasta = sanitizeInput(horaHasta);

    // convertir strings a Date objects para Prisma
    const fechaDate = new Date(sanitizedFechaTurno);
    const horaDesdeDate = new Date(`1970-01-01T${sanitizedHoraDesde}:00.000Z`);
    const horaHastaDate = new Date(`1970-01-01T${sanitizedHoraHasta}:00.000Z`);

    console.log("🔍 Buscando turno para actualizar:", sanitizedCodTurno);

    // Buscar el turno existente
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    if (!existingTurno) {
      console.log("Turno no encontrado");
      throw new DatabaseError("Turno no encontrado");
    }

    console.log("Turno encontrado, actualizando...");

    // Actualizar el turno
    const updatedTurno = await prisma.turno.update({
      where: { codTurno: sanitizedCodTurno },
      data: {
        fechaTurno: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
      },
    });

    console.log("Turno actualizado exitosamente");
    return updatedTurno;
  } catch (error) {
    console.error(
      "Error actualizando turno:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("Error completo:", error);

    // manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // manejar errores de DB
    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar turno");
  }
};

export const checkoutAppointment = async (
  codTurno: string,
  codCorte: string,
  precioTurno: number
) => {
  try {
    // sanitizar y validar
    const sanitizedCodTurno = sanitizeInput(codTurno);
    const sanitizedCodCorte = sanitizeInput(codCorte);
    console.log("🔍 Buscando turno para checkout:", sanitizedCodTurno);

    // Primero verificar que el turno existe
    const turnoExistente = await prisma.turno.update({
      where: { codTurno: sanitizedCodTurno },
      data: {
        codCorte: sanitizedCodCorte,
        precioTurno: precioTurno,
        estado: "Cobrado",
      },
    });

    await prisma.$transaction(async (tx) => {
      const codCliente = turnoExistente.codCliente;

      const latestCv = await tx.categoria_vigente.findFirst({
        where: { codCliente },
        orderBy: { ultimaFechaInicio: "desc" },
      });

      if (!latestCv) {
        console.warn(
          `No categoria_vigente encontrada para cliente ${codCliente}`
        );
        return;
      }

      const currentCategoria = await tx.categoria.findUnique({
        where: { codCategoria: latestCv.codCategoria },
      });
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
        // Comprobar N días y N cortes (configurables) para promoción Inicial -> Medium
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
            console.log(`Cliente ${codCliente} promovido a Medium`);
          } else {
            console.warn(
              "Categoría 'Medium' no encontrada en la tabla categorias"
            );
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
            console.log(`Cliente ${codCliente} promovido a Premium`);
          } else {
            console.warn(
              "Categoría 'Premium' no encontrada en la tabla categorias"
            );
          }
        }
      }
    });

    console.log("Turno cobrado exitosamente", {
      codTurno: sanitizedCodTurno,
      codCliente: turnoExistente.codCliente,
    });

    return turnoExistente;
  } catch (error) {
    console.error(
      "Error cobrando turno:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("Error completo:", error);

    // manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // manejar errores de DB
    if (error instanceof DatabaseError) {
      throw error;
    }

    // Manejar errores específicos de Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      console.error("Prisma error code:", prismaError.code);

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Turno no encontrado");
      }
    }

    throw new DatabaseError("Error al cobrar turno");
  }
};

export const cancelAppointment = async (
  codTurno: string,
  fechaCancelacion: string
) => {
  try {
    // sanitizar y validar
    const sanitizedCodTurno = sanitizeInput(codTurno);
    const sanitizedFechaCancelacion = sanitizeInput(fechaCancelacion);

    const fechaDate = new Date(sanitizedFechaCancelacion);

    console.log("🔍 Buscando turno para cancelar:", sanitizedCodTurno);

    // Primero verificar que el turno existe
    const turnoExistente = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    if (!turnoExistente) {
      console.log("❌ Turno no encontrado");
      throw new DatabaseError("Turno no encontrado");
    }

    console.log("✅ Turno encontrado, actualizando estado...");

    // Actualizar el estado del turno
    const existingTurno = await prisma.turno.update({
      where: { codTurno: sanitizedCodTurno },
      data: { fechaCancelacion: fechaDate, estado: "Cancelado" },
    });

    console.log("✅ Turno cancelado exitosamente");
    return existingTurno;
  } catch (error) {
    console.error(
      "❌ Error canceling turno:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error("Error completo:", error);

    // manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // manejar errores de DB
    if (error instanceof DatabaseError) {
      throw error;
    }

    // Manejar errores específicos de Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      console.error("Prisma error code:", prismaError.code);

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Turno no encontrado");
      }
    }

    throw new DatabaseError("Error al cancelar turno");
  }
};

export const destroy = async (codTurno: string) => {
  try {
    // sanitizar y validar
    const sanitizedCodTurno = sanitizeInput(codTurno);

    // verificar que el turno existe
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedCodTurno },
    });

    if (!existingTurno) {
      throw new DatabaseError("Turno no encontrado");
    }

    // delete turno
    const deletedTurno = await prisma.turno.delete({
      where: { codTurno: sanitizedCodTurno },
    });

    console.log("Turno deleted successfully");
    return deletedTurno;
  } catch (error) {
    console.error(
      "Error deleting turno:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // manejo de errores de DB
    //! Adaptar para turnos
    // if (error && typeof error === "object" && "code" in error) {
    //   const prismaError = error as { code: string };

    //   if (prismaError.code === "P2025") {
    //     throw new DatabaseError("Turno no encontrado");
    //   }

    //   if (prismaError.code === "P2003") {
    //     throw new DatabaseError(
    //       "No se puede eliminar: el barbero tiene turnos asociados"
    //     );
    //   }
    // }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar turno");
  }
};
