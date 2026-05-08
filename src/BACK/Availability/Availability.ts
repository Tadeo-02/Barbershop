import { Prisma } from "@prisma/client";
import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import { z } from "zod";
import { AvailabilitySchema } from "../Schemas/availabilitySchema";

const ensureValidRange = (fechaDesde: Date, fechaHasta: Date) => {
  if (fechaDesde >= fechaHasta) {
    throw new DatabaseError("La fecha/hora Desde debe ser anterior a Hasta");
  }
};

const ensureNotPast = (fechaHasta: Date) => {
  if (fechaHasta.getTime() < Date.now()) {
    throw new DatabaseError("La fecha/hora Hasta no puede estar en el pasado");
  }
};

const ensureNotFinished = (fechaHasta: Date, actionLabel: string) => {
  if (fechaHasta.getTime() < Date.now()) {
    throw new DatabaseError(`No se puede ${actionLabel} un bloqueo finalizado`);
  }
};

const ensureNoOverlappingBloqueo = async (
  tx: Prisma.TransactionClient,
  codBarbero: string,
  fechaDesde: Date,
  fechaHasta: Date,
  excludeCodBloqueo?: string,
) => {
  const where: Prisma.bloqueos_barberoWhereInput = {
    codBarbero,
    fechaHoraDesde: { lte: fechaHasta },
    fechaHoraHasta: { gte: fechaDesde },
  };

  if (excludeCodBloqueo) {
    where.codBloqueo = { not: excludeCodBloqueo };
  }

  const existing = await tx.bloqueos_barbero.findFirst({ where });
  if (existing) {
    throw new DatabaseError(
      "Ya existe un bloqueo en ese horario para ese barbero",
    );
  }
};

const toTimeString = (time: Date) => {
  const hours = time.getUTCHours().toString().padStart(2, "0");
  const minutes = time.getUTCMinutes().toString().padStart(2, "0");
  const seconds = time.getUTCSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const cancelOverlappingTurnos = async (
  tx: Prisma.TransactionClient,
  codBarbero: string,
  fechaDesde: Date,
  fechaHasta: Date,
) => {
  const rangeStart = new Date(fechaDesde);
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(fechaHasta);
  rangeEnd.setUTCHours(23, 59, 59, 999);

  const turnos = await tx.turno.findMany({
    where: {
      codBarbero,
      estado: "Programado",
      fechaTurno: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: {
      codTurno: true,
      fechaTurno: true,
      horaDesde: true,
      horaHasta: true,
    },
  });

  const overlappingTurnos = turnos.filter((turno) => {
    const datePart = turno.fechaTurno.toISOString().split("T")[0];
    const start = new Date(`${datePart}T${toTimeString(turno.horaDesde)}.000Z`);
    const end = new Date(`${datePart}T${toTimeString(turno.horaHasta)}.000Z`);
    return start < fechaHasta && end > fechaDesde;
  });

  if (overlappingTurnos.length === 0) return;

  const canceledAt = new Date();
  await tx.turno.updateMany({
    where: {
      codTurno: {
        in: overlappingTurnos.map((turno) => turno.codTurno),
      },
    },
    data: {
      estado: "Cancelado",
      fechaCancelacion: canceledAt,
    },
  });
};

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

    ensureValidRange(fechaDesde, fechaHasta);
    ensureNotPast(fechaHasta);

    const bloqueo = await prisma.$transaction(async (tx) => {
      await ensureNoOverlappingBloqueo(
        tx,
        validatedData.codBarbero,
        fechaDesde,
        fechaHasta,
      );

      const createdBloqueo = await tx.bloqueos_barbero.create({
        data: {
          codBarbero: validatedData.codBarbero,
          fechaHoraDesde: fechaDesde,
          fechaHoraHasta: fechaHasta,
          motivo: validatedData.motivo,
        },
      });

      await cancelOverlappingTurnos(
        tx,
        validatedData.codBarbero,
        fechaDesde,
        fechaHasta,
      );

      return createdBloqueo;
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

    ensureValidRange(fechaDesde, fechaHasta);
    ensureNotPast(fechaHasta);

    const updatedBloqueo = await prisma.$transaction(async (tx) => {
      const existingBloqueo = await tx.bloqueos_barbero.findUnique({
        where: { codBloqueo: sanitizedData.codBloqueo },
      });

      if (!existingBloqueo) {
        throw new DatabaseError("Bloqueo no encontrado");
      }

      ensureNotFinished(existingBloqueo.fechaHoraHasta, "modificar");

      await ensureNoOverlappingBloqueo(
        tx,
        validatedData.codBarbero,
        fechaDesde,
        fechaHasta,
        sanitizedData.codBloqueo,
      );

      const updated = await tx.bloqueos_barbero.update({
        where: { codBloqueo: sanitizedData.codBloqueo },
        data: {
          codBarbero: validatedData.codBarbero,
          fechaHoraDesde: fechaDesde,
          fechaHoraHasta: fechaHasta,
          motivo: validatedData.motivo,
        },
      });

      await cancelOverlappingTurnos(
        tx,
        validatedData.codBarbero,
        fechaDesde,
        fechaHasta,
      );

      return updated;
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

    ensureNotFinished(existingBloqueo.fechaHoraHasta, "eliminar");

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
