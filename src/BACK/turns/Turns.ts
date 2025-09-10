import { prisma, DatabaseError, sanitizeInput } from "../base/Base"; // importamos todo desde Base
import { z } from "zod";

// schema de validación con Zod (más robusto que las funciones manuales)
const TurnsSchema = z.object({
  // codTurno: z
  //   .string().uuid("ID de barbero inválido"),
  codCorte: z.string().min(1, "Código de corte es requerido").optional(),
  codBarbero: z.string().min(1, "Código de barbero es requerido"),
  codCliente: z.string().min(1, "Código de cliente es requerido"),
  // horaDesdeTurno y horaHastaTurno como strings con formato HH:MM
  horaDesdeTurno: z
    .string()
    .min(1, "Hora desde es requerida")
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora desde inválida. Formato HH:MM"),
  horaHastaTurno: z
    .string()
    .min(1, "Hora hasta es requerida")
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora hasta inválida. Formato HH:MM"),
  fechaTurno: z
    .string()
    .min(1, "Fecha es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD"),
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
});

// funciones backend
export const store = async (
  codBarbero: string,
  codCliente: string,
  horaDesdeTurno: string,
  horaHastaTurno: string,
  fechaTurno: string
) => {
  try {
    // sanitizar inputs
    const sanitizedData = {
      codBarbero: sanitizeInput(codBarbero),
      codCliente: sanitizeInput(codCliente),
      horaDesdeTurno: sanitizeInput(horaDesdeTurno),
      horaHastaTurno: sanitizeInput(horaHastaTurno),
      fechaTurno: sanitizeInput(fechaTurno),
    };

    // validación con zod
    const validatedData = TurnsSchema.parse(sanitizedData);

    console.log("Creating turno");

    // convertir strings a Date objects para Prisma
    const horaDesde = new Date(
      `1970-01-01T${validatedData.horaDesdeTurno}:00.000Z`
    );
    const horaHasta = new Date(
      `1970-01-01T${validatedData.horaHastaTurno}:00.000Z`
    );
    const fecha = new Date(validatedData.fechaTurno);

    // crear turno
    const turno = await prisma.turno.create({
      data: {
        codBarbero: validatedData.codBarbero,
        codCliente: validatedData.codCliente,
        horaDesdeTurno: horaDesde,
        horaHastaTurno: horaHasta,
        fechaTurno: fecha,
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
      orderBy: [{ fechaTurno: "asc" }, { horaDesdeTurno: "asc" }],
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

export const update = async (
  codTurno: string,
  codCorte: string,
  codBarbero: string,
  codCliente: string,
  horaDesdeTurno: string,
  horaHastaTurno: string,
  fechaTurno: string,
  precioTurno: string,
  metodoPago: string,
  fechaCancelacion: string
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codTurno: sanitizeInput(codTurno),
      codCorte: sanitizeInput(codCorte),
      codBarbero: sanitizeInput(codBarbero),
      codCliente: sanitizeInput(codCliente),
      horaDesdeTurno: sanitizeInput(horaDesdeTurno),
      horaHastaTurno: sanitizeInput(horaHastaTurno),
      fechaTurno: sanitizeInput(fechaTurno),
      precioTurno: sanitizeInput(precioTurno),
      metodoPago: sanitizeInput(metodoPago),
      fechaCancelacion: sanitizeInput(fechaCancelacion),
    };

    const validatedData = TurnsSchema.parse({
      codTurno: sanitizedData.codTurno,
      codCorte: sanitizedData.codCorte,
      codBarbero: sanitizedData.codBarbero,
      codCliente: sanitizedData.codCliente,
      horaDesdeTurno: sanitizedData.horaDesdeTurno,
      horaHastaTurno: sanitizedData.horaHastaTurno,
      fechaTurno: sanitizedData.fechaTurno,
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
    const horaDesde = new Date(
      `1970-01-01T${validatedData.horaDesdeTurno}:00.000Z`
    );
    const horaHasta = new Date(
      `1970-01-01T${validatedData.horaHastaTurno}:00.000Z`
    );
    const fecha = new Date(validatedData.fechaTurno);
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
        codBarbero: validatedData.codBarbero,
        codCliente: validatedData.codCliente,
        horaDesdeTurno: horaDesde,
        horaHastaTurno: horaHasta,
        fechaTurno: fecha,
        precioTurno: precio,
        metodoPago: validatedData.metodoPago,
        fechaCancelacion: fechaCancelacionDate,
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
