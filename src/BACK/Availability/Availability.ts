import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import { z } from "zod";
import { AvailabilitySchema } from "../Schemas/availabilitySchema";

// funciones backend para Categorías
export const store = async (
  codBarbero: string,
  fechaHoraDesde: string,
  fechaHoraHasta: string,
  motivo: string,
) => {
  try {
    // sanitizar de inputs
    const sanitizedData = {
      codBarbero: sanitizeInput(codBarbero),
      fechaHoraDesde: sanitizeInput(fechaHoraDesde),
      fechaHoraHasta: sanitizeInput(fechaHoraHasta),
      motivo: sanitizeInput(motivo),
    };

    // validacion con zod
    const validatedData = AvailabilitySchema.omit({
      codBloqueo: true,
    }).parse(sanitizedData);

    console.log("Creating barber unavailability");

    // convertir strings a DateTime objects para Prisma (forzar UTC para evitar shift horario)
    const fechaDesde = new Date(
      validatedData.fechaHoraDesde.replace(" ", "T") + ".000Z",
    );
    const fechaHasta = new Date(
      validatedData.fechaHoraHasta.replace(" ", "T") + ".000Z",
    );

    const existingUnavailability = await prisma.bloqueos_barbero.findMany({
      where: {
        codBarbero: validatedData.codBarbero,
        fechaHoraDesde: { lte: fechaHasta },
        fechaHoraHasta: { gte: fechaDesde },
      },
    });

    if (existingUnavailability.length > 0) {
      throw new DatabaseError(
        "Ya existe un bloqueo en ese horario para ese barbero",
      );
    }

    // crear bloqueo usando el modelo correcto de Prisma
    const bloqueo = await prisma.bloqueos_barbero.create({
      data: {
        codBarbero: validatedData.codBarbero,
        fechaHoraDesde: fechaDesde,
        fechaHoraHasta: fechaHasta,
        motivo: validatedData.motivo,
      },
    });

    console.log("Barber unavailability created successfully");
    return bloqueo;
  } catch (error) {
    console.error(
      "Error creating barber unavailability:",
      error instanceof Error ? error.message : "Unknown error",
    );

    //  de errores de validación
    if (error instanceof DatabaseError) {
      throw error;
    }

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    //  errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("Ya existe un bloqueo en ese horario");
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    console.log("Fetching all unavailabilities with Prisma");

    const unavailabilities = await prisma.bloqueos_barbero.findMany({
      orderBy: { fechaHoraDesde: "asc" },
    });

    console.log(`Retrieved ${unavailabilities.length} unavailabilities`);
    return unavailabilities;
  } catch (error) {
    console.error(
      "Error fetching unavailabilities:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al obtener lista de bloqueos");
  }
};

export const findById = async (codBloqueo: string) => {
  try {
    // sanitizar y validar ID
    const sanitizedCodBloqueo = sanitizeInput(codBloqueo);

    const bloqueo = await prisma.bloqueos_barbero.findUnique({
      where: { codBloqueo: sanitizedCodBloqueo },
    });

    return bloqueo;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding unavailability:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al buscar bloqueo");
  }
};

export const update = async (
  codBloqueo: string,
  codBarbero: string,
  fechaHoraDesde: string,
  fechaHoraHasta: string,
  motivo: string,
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codBloqueo: sanitizeInput(codBloqueo),
      codBarbero: sanitizeInput(codBarbero),
      fechaHoraDesde: sanitizeInput(fechaHoraDesde),
      fechaHoraHasta: sanitizeInput(fechaHoraHasta),
      motivo: sanitizeInput(motivo),
    };

    // validar (menos codBloqueo)
    const validatedData = AvailabilitySchema.omit({ codBloqueo: true }).parse({
      codBarbero: sanitizedData.codBarbero,
      fechaHoraDesde: sanitizedData.fechaHoraDesde,
      fechaHoraHasta: sanitizedData.fechaHoraHasta,
      motivo: sanitizedData.motivo,
    });

    // convertir strings a DateTime objects para Prisma (forzar UTC para evitar shift horario)
    const fechaDesde = new Date(
      validatedData.fechaHoraDesde.replace(" ", "T") + ".000Z",
    );
    const fechaHasta = new Date(
      validatedData.fechaHoraHasta.replace(" ", "T") + ".000Z",
    );

    // verificar que el bloqueo existe
    const existingBloqueo = await prisma.bloqueos_barbero.findUnique({
      where: { codBloqueo: sanitizedData.codBloqueo },
    });

    if (!existingBloqueo) {
      throw new DatabaseError("Bloqueo no encontrado");
    }

    // actualizar bloqueo
    const updatedBloqueo = await prisma.bloqueos_barbero.update({
      where: { codBloqueo: sanitizedData.codBloqueo },
      data: {
        codBarbero: validatedData.codBarbero,
        fechaHoraDesde: fechaDesde,
        fechaHoraHasta: fechaHasta,
        motivo: validatedData.motivo,
      },
    });

    console.log("Bloqueo updated successfully");
    return updatedBloqueo;
  } catch (error) {
    console.error(
      "Error updating bloqueo:",
      error instanceof Error ? error.message : "Unknown error",
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
        throw new DatabaseError("Ya existe un bloqueo con ese código");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Bloqueo no encontrado");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar bloqueo");
  }
};

export const destroy = async (codBloqueo: string) => {
  try {
    // sanitizar y validar
    const sanitizedCodBloqueo = sanitizeInput(codBloqueo);

    // verificar que el bloqueo existe
    const existingBloqueo = await prisma.bloqueos_barbero.findUnique({
      where: { codBloqueo: sanitizedCodBloqueo },
    });

    if (!existingBloqueo) {
      throw new DatabaseError("Bloqueo no encontrado");
    }

    // eliminar bloqueo
    const deletedBloqueo = await prisma.bloqueos_barbero.delete({
      where: { codBloqueo: sanitizedCodBloqueo },
    });

    console.log("Bloqueo deleted successfully");
    return deletedBloqueo;
  } catch (error) {
    console.error(
      "Error deleting bloqueo:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Bloqueo no encontrado");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: el bloqueo está siendo utilizado",
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar bloqueo");
  }
};
