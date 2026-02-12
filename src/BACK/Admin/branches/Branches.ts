import { prisma, DatabaseError, sanitizeInput } from "../../base/Base";
import { z } from "zod";
import {BranchSchema} from "../../Schemas/branchesSchema";

// const BranchSchema = z.object({
//   nombre: z
//     .string()
//     .min(2, "Nombre debe tener al menos 2 caracteres")
//     .max(100, "Nombre no puede tener más de 100 caracteres"),
//   calle: z
//     .string()
//     .min(2, "Calle debe tener al menos 2 caracteres")
//     .max(100, "Calle no puede tener más de 100 caracteres"),
//   altura: z
//     .number()
//     .min(1, "Altura debe ser mayor a 0")
//     .max(10000, "Altura no puede ser mayor a 10000"),
// });

// funciones backend para Sucursales
export const store = async (nombre: string, calle: string, altura: number) => {
  try {
    // sanitizar de inputs
    const sanitizedData = {
      nombre: sanitizeInput(nombre),
      calle: sanitizeInput(calle),
      altura: Number(altura),
    };
    const validateData = BranchSchema.parse(sanitizedData);
    console.log("Creating branch");
    // crear branch usando el modelo correcto de Prisma
    const branch = await prisma.sucursales.create({
      data: {
        nombre: validateData.nombre,
        calle: validateData.calle,
        altura: validateData.altura,
      },
    });
    console.log("Branch created successfully");
    return branch;
  } catch (error) {
    console.error(
      "Error creating branch:",
      error instanceof Error ? error.message : "Unknown error",
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
    console.log(`Retrieved ${branches.length} branches`);
    return branches;
  } catch (error) {
    console.error(
      "Error fetching branches:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAllIncludingInactive = async () => {
  try {
    const branches = await prisma.sucursales.findMany({
      orderBy: { codSucursal: "asc" },
    });
    console.log(`Retrieved ${branches.length} branches (all)`);
    return branches;
  } catch (error) {
    console.error(
      "Error fetching branches (all):",
      error instanceof Error ? error.message : "Unknown error",
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
    console.error(
      "Error fetching branch:",
      error instanceof Error ? error.message : "Unknown error",
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
    const validateData = BranchSchema.parse({
      nombre: sanitizedData.nombre,
      calle: sanitizedData.calle,
      altura: sanitizedData.altura,
    });
    const existingBranch = await prisma.sucursales.findUnique({
      where: { codSucursal: sanitizedData.codSucursal },
    });
    if (!existingBranch) {
      throw new DatabaseError("No existe una sucursal con ese código");
    }
    const branch = await prisma.sucursales.update({
      where: { codSucursal: sanitizedData.codSucursal },
      data: {
        nombre: validateData.nombre,
        calle: validateData.calle,
        altura: validateData.altura,
      },
    });
    console.log("Branch updated successfully");
    return branch;
  } catch (error) {
    console.error(
      "Error updating branch:",
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
    if (!existingBranch) {
      throw new DatabaseError("No existe una sucursal con ese código");
    }

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

    if (pendingCount > 0) {
      throw new DatabaseError(
        `No se puede desactivar: hay ${pendingCount} turno(s) pendiente(s)`
      );
    }

    const deletedBranch = await prisma.sucursales.update({
      where: { codSucursal: sanitizedCodSucursal },
      data: { activo: 0 },
    });
    console.log("Branch deactivated successfully");
    return deletedBranch;
  } catch (error) {
    console.error(
      "Error deleting branch:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // manejo de errores de DB
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
    console.log("Branch reactivated successfully");
    return reactivatedBranch;
  } catch (error) {
    console.error(
      "Error reactivating branch:",
      error instanceof Error ? error.message : "Unknown error",
    );

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
