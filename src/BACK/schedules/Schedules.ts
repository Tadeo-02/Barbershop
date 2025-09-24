import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import { z } from "zod";

const ScheduleSchema = z.object({
  // codHorario: z.string().min(1, "Código de horario es requerido"),
  codBarbero: z.string().min(1, "Código de barbero es requerido"),
  fecha: z
    .string()
    .min(1, "Fecha es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD"),
  horaDesde: z
    .string()
    .min(1, "Hora desde es requerida")
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora desde inválida. Formato HH:MM"),
  horaHasta: z
    .string()
    .min(1, "Hora hasta es requerida")
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora hasta inválida. Formato HH:MM"),
  estado: z
    .string()
    .min(1, "Estado es requerido")
    .max(10, "Estado no puede tener más de 10 caracteres"),
});

// funciones backend para horarios
export const store = async (
  codBarbero: string,
  fecha: string,
  horaDesde: string,
  horaHasta: string,
  estado: string
) => {
  try {
    // sanitizar de inputs
    const sanitizedData = {
      codBarbero: sanitizeInput(codBarbero),
      fecha: sanitizeInput(fecha),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: sanitizeInput(horaHasta),
      estado: sanitizeInput(estado),
    };

    // validacion con zod
    const validatedData = ScheduleSchema.parse(sanitizedData);

    console.log("Creating schedule");

    // convertir strings a Date objects para Prisma
    const horaDesdeDate = new Date(
      `1970-01-01T${validatedData.horaDesde}:00.000Z`
    );
    const horaHastaDate = new Date(
      `1970-01-01T${validatedData.horaHasta}:00.000Z`
    );
    const fechaDate = new Date(validatedData.fecha);

    // crear horario usando el modelo correcto de Prisma
    const horario = await prisma.horarios.create({
      data: {
        codBarbero: validatedData.codBarbero,
        fecha: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
        estado: validatedData.estado,
      },
    });

    console.log("Schedule created successfully");
    return horario;
  } catch (error) {
    console.error(
      "Error creating schedule:",
      error instanceof Error ? error.message : "Unknown error"
    );

    //  de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    //  errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("Ya existe ese horario");
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    console.log("Fetching all schedules with Prisma");

    const horarios = await prisma.horarios.findMany({
      orderBy: { fecha: "desc" },
    });

    console.log(`Retrieved ${horarios.length} schedules`);
    return horarios;
  } catch (error) {
    console.error(
      "Error fetching schedules:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al obtener lista de horarios");
  }
};

export const findById = async (codHorario: string) => {
  try {
    // sanitizar y validar ID
    const sanitizedCodHorario = sanitizeInput(codHorario);

    const horario = await prisma.horarios.findUnique({
      where: { codHorario: sanitizedCodHorario },
    });

    return horario;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding schedule:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar horario");
  }
};

export const update = async (
  codHorario: string,
  codBarbero: string,
  fecha: string,
  horaDesde: string,
  horaHasta: string,
  estado: string
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codHorario: sanitizeInput(codHorario),
      codBarbero: sanitizeInput(codBarbero),
      fecha: sanitizeInput(fecha),
      horaDesde: sanitizeInput(horaDesde),
      horaHasta: sanitizeInput(horaHasta),
      estado: sanitizeInput(estado),
    };

    // validar datos
    const validatedData = ScheduleSchema.parse(sanitizedData);

    // verificar que el horario existe
    const existingHorario = await prisma.horarios.findUnique({
      where: { codHorario: sanitizedData.codHorario },
    });

    if (!existingHorario) {
      throw new DatabaseError("Horario no encontrado");
    }

    // convertir strings a tipos correctos para Prisma
    const horaDesdeDate = new Date(
      `1970-01-01T${validatedData.horaDesde}:00.000Z`
    );
    const horaHastaDate = new Date(
      `1970-01-01T${validatedData.horaHasta}:00.000Z`
    );
    const fechaDate = new Date(validatedData.fecha);

    // actualizar horario
    const updatedHorario = await prisma.horarios.update({
      where: { codHorario: sanitizedData.codHorario },
      data: {
        codBarbero: validatedData.codBarbero,
        fecha: fechaDate,
        horaDesde: horaDesdeDate,
        horaHasta: horaHastaDate,
        estado: validatedData.estado,
      },
    });

    console.log("Schedule updated successfully");
    return updatedHorario;
  } catch (error) {
    console.error(
      "Error updating schedule:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }
    // Manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("Ya existe ese horario");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Horario no encontrado");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar horario");
  }
};

export const destroy = async (codHorario: string) => {
  try {
    // sanitizar y validar
    const sanitizedCodHorario = sanitizeInput(codHorario);

    // verificar que el horario existe
    const existingHorario = await prisma.horarios.findUnique({
      where: { codHorario: sanitizedCodHorario },
    });

    if (!existingHorario) {
      throw new DatabaseError("Horario no encontrado");
    }

    // eliminar horario
    const deletedHorario = await prisma.horarios.delete({
      where: { codHorario: sanitizedCodHorario },
    });

    console.log("Horario deleted successfully");
    return deletedHorario;
  } catch (error) {
    console.error(
      "Error deleting horario:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Horario no encontrado");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: el horario está ocupado"
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar horario");
  }
};
