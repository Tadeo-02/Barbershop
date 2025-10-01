import { prisma, DatabaseError, sanitizeInput } from "../base/Base"; // importamos todo desde Base
import { z } from "zod";

// Tipo para los turnos con barbero incluido
type TurnoWithBarbero = {
  horaDesde: Date;
  codBarbero: string;
  barbero: {
    codUsuario: string;
    codSucursal: string;
  };
};

// schema de validación con Zod (más robusto que las funciones manuales)
const AppointmentsSchema = z.object({
  // codTurno: z
  //   .string().uuid("ID de barbero inválido"),
  codCorte: z.string().min(1, "Código de corte es requerido").optional(),
  codHorario: z.string().min(1, "Código de horario es requerido"),
  codCliente: z.string().min(1, "Código de cliente es requerido"),
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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD")
    .optional(),
  horaDesde: z
    .string()
    .min(1, "Hora desde es requerida")
    .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM")
    .optional(),
  horaHasta: z
    .string()
    .min(1, "Hora hasta es requerida")
    .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM")
    .optional(),
});

// funciones backend
export const store = async (
  codHorario: string,
  codCliente: string,
  fechaTurno: string,
  horaDesde: string,
  horaHasta: string
) => {
  try {
    // sanitizar inputs
    const sanitizedData = {
      codHorario: sanitizeInput(codHorario),
      codCliente: sanitizeInput(codCliente),
      fechaTurno: sanitizeInput(fechaTurno),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: sanitizeInput(horaHasta),
    };

    // validación con zod
    const validatedData = AppointmentsSchema.parse(sanitizedData);
    console.log("Creating turno");

    // convertir strings a Date objects para Prisma
    const horaDesdeDate = new Date(
      `1970-01-01T${validatedData.horaDesde}:00.000Z`
    );
    const horaHastaDate = new Date(
      `1970-01-01T${validatedData.horaHasta}:00.000Z`
    );
    const fechaDate = new Date(validatedData.fecha);

    // crear turno
    const turno = await prisma.turno.create({
      data: {
        codHorario: validatedData.codHorario,
        codCliente: validatedData.codCliente,
        fechaTurno: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
      },
    });

    console.log("Turno created successfully");
    return turno;
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
    //manejo de errores db
    //! modificar para turnos
    // if (error && typeof error === "object" && "code" in error) {
    //   const prismaError = error as { code: string; message: string };

    //   if (prismaError.code === "P2002") {
    //     throw new DatabaseError("El CUIL ya existe en el sistema");
    //   }
    // }

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

export const findByClientId = async (codCliente: string) => {
  try {
    //sanitizar y validar
    const sanitizedCodCliente = sanitizeInput(codCliente);

    const turno = await prisma.turno.findUnique({
      where: { codCliente: sanitizedCodCliente },
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

export const findByAvailableDate = async (
  fechaTurno: string,
  codSucursal: string
) => {
  try {
    //sanitizar y validar
    const sanitizedFechaTurno = sanitizeInput(fechaTurno);
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    const turnos = await prisma.turno.findMany({
      select: {
        horaDesde: true,
        codBarbero: true,
      },
      where: {
        fechaTurno: new Date(sanitizedFechaTurno),
        barbero: {
          codSucursal: sanitizedCodSucursal,
        },
      },
      include: {
        barbero: {
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

    const barberos = await prisma.usuario.findMany({
      where: { codSucursal: sanitizedCodSucursal },
    });

    const horasDisponibles = [];
    for (let hora = 8; hora <= 20; hora += 0.5) {
      // Convertir la hora del bucle a formato de tiempo
      const horaString = `${Math.floor(hora).toString().padStart(2, "0")}:${(
        (hora % 1) *
        60
      )
        .toString()
        .padStart(2, "0")}`;

      for (const barbero of barberos) {
        // Verificar si existe un turno para este barbero en esta hora específica
        const turnoExistente = turnos.find(
          (t: TurnoWithBarbero) =>
            t.codBarbero === barbero.codUsuario &&
            t.horaDesde.toTimeString().substring(0, 5) === horaString
        );

        if (turnoExistente) {
          // El barbero ya tiene un turno a esta hora
          continue;
        } else {
          // El barbero está disponible a esta hora
          horasDisponibles.push({
            hora: horaString,
            barbero: barbero.codUsuario,
          });
        }
      }
    }

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

    const horasDisponibles = [];
    for (let hora = 8; hora <= 20; hora += 0.5) {
      // Convertir la hora del bucle a formato de tiempo
      const horaString = `${Math.floor(hora).toString().padStart(2, "0")}:${(
        (hora % 1) *
        60
      )
        .toString()
        .padStart(2, "0")}`;

      // Verificar si existe un turno para este barbero en esta hora específica
      const turnoExistente = turnos.find(
        (t: TurnoWithBarbero) =>
          t.codBarbero === codBarbero &&
          t.horaDesde.toTimeString().substring(0, 5) === horaString
      );

      if (turnoExistente) {
        // El barbero ya tiene un turno a esta hora
        continue;
      } else {
        // El barbero está disponible a esta hora
        horasDisponibles.push({
          hora: horaString,
        });
      }
    }

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

export const update = async (
  codTurno: string,
  codCorte: string,
  codHorario: string,
  codCliente: string,
  precioTurno: string,
  metodoPago: string,
  fechaCancelacion: string,
  fechaTurno: string,
  horaDesde: string,
  horaHasta: string
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codTurno: sanitizeInput(codTurno),
      codCorte: sanitizeInput(codCorte),
      codHorario: sanitizeInput(codHorario),
      codCliente: sanitizeInput(codCliente),
      precioTurno: sanitizeInput(precioTurno),
      metodoPago: sanitizeInput(metodoPago),
      fechaCancelacion: sanitizeInput(fechaCancelacion),
      fechaTurno: sanitizeInput(fechaTurno),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: sanitizeInput(horaHasta),
    };

    const validatedData = AppointmentsSchema.parse({
      codTurno: sanitizedData.codTurno,
      codCorte: sanitizedData.codCorte,
      codHorario: sanitizedData.codHorario,
      codCliente: sanitizedData.codCliente,
      precioTurno: sanitizedData.precioTurno,
      metodoPago: sanitizedData.metodoPago,
      fechaCancelacion: sanitizedData.fechaCancelacion,
    });

    // Usar el codTurno sanitizado (no validado por Zod)
    const existingTurno = await prisma.turno.findUnique({
      where: { codTurno: sanitizedData.codTurno },
    });

    if (!existingTurno) {
      throw new DatabaseError("Turno no encontrado");
    }

    // convertir strings a tipos correctos para Prisma
    const horaDesdeDate = new Date(
      `1970-01-01T${validatedData.horaDesde}:00.000Z`
    );
    const horaHastaDate = new Date(
      `1970-01-01T${validatedData.horaHasta}:00.000Z`
    );
    const fechaDate = new Date(validatedData.fecha);

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
        codHorario: validatedData.codHorario,
        codCliente: validatedData.codCliente,
        precioTurno: precio,
        metodoPago: validatedData.metodoPago,
        fechaCancelacion: fechaCancelacionDate,
        fechaTurno: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
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
