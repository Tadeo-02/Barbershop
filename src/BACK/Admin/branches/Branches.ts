import { prisma, DatabaseError, sanitizeInput } from "../../base/Base";
import logger from "../../lib/logger";
import { z } from "zod";
import { BranchSchema } from "../../Schemas/branchesSchema";
import {
  assertNoPendingAppointments,
  PendingAppointmentsError,
} from "../../lib/barberBusinessRules";
import { assertEntityExists } from "../../lib/entityChecks";
import { parseValidatedInput } from "../../lib/zodHelpers";

// backend functions
export const store = async (nombre: string, calle: string, altura: number) => {
  try {
    // sanitize inputs
    const sanitizedData = {
      nombre: sanitizeInput(nombre),
      calle: sanitizeInput(calle),
      altura: Number(altura),
    };
    const validateData = parseValidatedInput(BranchSchema, sanitizedData);
    logger.info("Creating branch");
    // create branch using the correct Prisma model
    const branch = await prisma.sucursales.create({
      data: {
        nombre: validateData.nombre,
        calle: validateData.calle,
        altura: validateData.altura,
      },
    });
    logger.info("Branch created successfully");
    return branch;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error creating branch",
    );
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };
      if (prismaError.code === "P2002") {
        throw new DatabaseError("Ya existe una Sucursal con ese nombre");
      }
    }
    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    const branches = await prisma.sucursales.findMany({
      where: { activo: 1 },
      orderBy: { codSucursal: "asc" },
    });
    logger.info({ count: branches.length }, "Retrieved branches");
    return branches;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error fetching branches",
    );
    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAllIncludingInactive = async () => {
  try {
    const branches = await prisma.sucursales.findMany({
      orderBy: { codSucursal: "asc" },
    });
    logger.info({ count: branches.length }, "Retrieved branches (all)");
    return branches;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error fetching branches (all)",
    );
    throw new DatabaseError("Error interno del servidor");
  }
};

export const findById = async (codSucursal: string) => {
  try {
    const sanitizedCodSucursal = sanitizeInput(codSucursal);
    const branch = await prisma.sucursales.findUnique({
      where: { codSucursal: sanitizedCodSucursal },
    });
    return branch;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error fetching branch",
    );
    throw new DatabaseError("Error al buscar sucursal");
  }
};

export const update = async (
  codSucursal: string,
  nombre: string,
  calle: string,
  altura: number,
) => {
  try {
    const sanitizedData = {
      codSucursal: sanitizeInput(codSucursal),
      nombre: sanitizeInput(nombre),
      calle: sanitizeInput(calle),
      altura: Number(altura),
    };
    const validateData = parseValidatedInput(BranchSchema, {
      nombre: sanitizedData.nombre,
      calle: sanitizedData.calle,
      altura: sanitizedData.altura,
    });
    const existingBranch = await prisma.sucursales.findUnique({
      where: { codSucursal: sanitizedData.codSucursal },
    });
    assertEntityExists(existingBranch, "Sucursal");
    const branch = await prisma.sucursales.update({
      where: { codSucursal: sanitizedData.codSucursal },
      data: {
        nombre: validateData.nombre,
        calle: validateData.calle,
        altura: validateData.altura,
      },
    });
    logger.info("Branch updated successfully");
    return branch;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error updating branch",
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
        throw new DatabaseError("Ya existe una sucursal con ese nombre");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Sucursal no encontrada");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar sucursal");
  }
};

export const destroy = async (codSucursal: string) => {
  try {
    const sanitizedCodSucursal = sanitizeInput(codSucursal);
    const existingBranch = await prisma.sucursales.findUnique({
      where: { codSucursal: sanitizedCodSucursal },
    });
    assertEntityExists(existingBranch, "Sucursal");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const barberos = await prisma.usuarios.findMany({
      where: { codSucursal: sanitizedCodSucursal },
      select: { codUsuario: true },
    });

    const barberoIds = barberos.map((barbero) => barbero.codUsuario);

    const pendingCount = await prisma.turno.count({
      where: {
        estado: "Programado",
        fechaTurno: {
          gte: today,
        },
        codBarbero: {
          in: barberoIds,
        },
      },
    });

    try {
      assertNoPendingAppointments(
        pendingCount,
        `No se puede desactivar: hay ${pendingCount} turno(s) pendiente(s)`,
      );
    } catch (error) {
      if (error instanceof PendingAppointmentsError) {
        throw new DatabaseError(error.message);
      }
      throw error;
    }

    const deletedBranch = await prisma.sucursales.update({
      where: { codSucursal: sanitizedCodSucursal },
      data: { activo: 0 },
    });
    logger.info("Branch deactivated successfully");
    return deletedBranch;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error deleting branch",
    );

    // handle errors of DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Sucursal no encontrada");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: la sucursal está siendo utilizada",
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar sucursal");
  }
};

export const deactivate = async (codSucursal: string) => {
  return destroy(codSucursal);
};

export const reactivate = async (codSucursal: string) => {
  try {
    const sanitizedCodSucursal = sanitizeInput(codSucursal);
    const existingBranch = await prisma.sucursales.findUnique({
      where: { codSucursal: sanitizedCodSucursal },
    });
    if (!existingBranch) {
      throw new DatabaseError("No existe una sucursal con ese codigo");
    }
    const reactivatedBranch = await prisma.sucursales.update({
      where: { codSucursal: sanitizedCodSucursal },
      data: { activo: 1 },
    });
    logger.info("Branch reactivated successfully");
    return reactivatedBranch;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error reactivating branch",
    );

    // handle errors of DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Sucursal no encontrada");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al reactivar sucursal");
  }
};

export const getRevenueByBranch = async (month: number, year: number) => {
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const turnos = await prisma.turno.findMany({
      where: {
        estado: "Cobrado",
        precioTurno: { not: null },
        fechaTurno: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        precioTurno: true,
        codBarbero: true,
      },
    });

    const barberoIds = [...new Set(turnos.map((t) => t.codBarbero))];
    const barberos = await prisma.usuarios.findMany({
      where: { codUsuario: { in: barberoIds } },
      select: { codUsuario: true, codSucursal: true },
    });

    const barberoToSucursal = new Map(
      barberos.map((b) => [b.codUsuario, b.codSucursal]),
    );

    const sucursalIds = [
      ...new Set(
        barberos.map((b) => b.codSucursal).filter(Boolean),
      ),
    ] as string[];
    const sucursales = await prisma.sucursales.findMany({
      where: { codSucursal: { in: sucursalIds } },
      select: { codSucursal: true, nombre: true },
    });

    const revenueMap = new Map<string, number>();
    for (const s of sucursales) {
      revenueMap.set(s.codSucursal, 0);
    }

    for (const t of turnos) {
      const codSucursal = barberoToSucursal.get(t.codBarbero);
      if (!codSucursal) continue;
      const precio = t.precioTurno ? Number(t.precioTurno) : 0;
      const prev = revenueMap.get(codSucursal) || 0;
      revenueMap.set(codSucursal, prev + (isNaN(precio) ? 0 : precio));
    }

    return Array.from(revenueMap.entries()).map(([codSucursal, total]) => {
      const sucursal = sucursales.find((s) => s.codSucursal === codSucursal);
      return {
        codSucursal,
        nombre: sucursal?.nombre || codSucursal,
        totalRevenue: total,
      };
    });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error calculating rentability",
    );
    throw new DatabaseError("Error al calcular rentabilidad");
  }
};
