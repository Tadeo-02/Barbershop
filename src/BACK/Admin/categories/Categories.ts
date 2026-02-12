import { prisma, DatabaseError, sanitizeInput } from "../../base/Base";
import { z } from "zod";

const CATEGORY_RANK = ["Vetado", "Inicial", "Medium", "Premium"] as const;
type CategoryDirection = "promote" | "demote";
type DeleteCategoryAction = "promote_all" | "demote_all" | "per_client";

const CategoriaSchema = z.object({
  nombreCategoria: z
    .string()
    .min(2, "Nombre de categoría debe tener al menos 2 caracteres")
    .max(50, "Nombre de categoría no puede tener más de 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Nombre solo puede contener letras"),
  descCategoria: z
    .string()
    .min(10, "Descripción debe tener al menos 10 caracteres")
    .max(250, "Descripción no puede tener más de 250 caracteres"),
  descuentoCorte: z
    .number()
    .min(0, "Descuento de corte debe ser mayor o igual a 0")
    .max(100, "Descuento de corte no puede ser mayor a 100%"),
  descuentoProducto: z
    .number()
    .min(0, "Descuento de producto debe ser mayor o igual a 0")
    .max(100, "Descuento de producto no puede ser mayor a 100%"),
});

// funciones backend para Categorías
export const store = async (
  nombreCategoria: string,
  descCategoria: string,
  descuentoCorte: number,
  descuentoProducto: number
) => {
  try {
    // sanitizar de inputs
    const sanitizedData = {
      nombreCategoria: sanitizeInput(nombreCategoria),
      descCategoria: sanitizeInput(descCategoria),
      descuentoCorte: Number(descuentoCorte),
      descuentoProducto: Number(descuentoProducto),
    };

    // validacion con zod
    const validatedData = CategoriaSchema.parse(sanitizedData);

    console.log("Creating categoria");

    // crear categoría usando el modelo correcto de Prisma
    const categoria = await prisma.categoria.create({
      data: {
        nombreCategoria: validatedData.nombreCategoria,
        descCategoria: validatedData.descCategoria,
        descuentoCorte: validatedData.descuentoCorte,
        descuentoProducto: validatedData.descuentoProducto,
      },
    });

    console.log("Categoria created successfully");
    return categoria;
  } catch (error) {
    console.error(
      "Error creating categoria:",
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
        throw new DatabaseError("Ya existe una categoría con ese nombre");
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    console.log("Fetching all categorias with Prisma");

    const categorias = await prisma.categoria.findMany({
      orderBy: { nombreCategoria: "asc" },
    });

    console.log(`Retrieved ${categorias.length} categorias`);
    return categorias;
  } catch (error) {
    console.error(
      "Error fetching categorias:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al obtener lista de categorías");
  }
};

export const findById = async (codCategoria: string) => {
  try {
    // sanitizar y validar ID
    const sanitizedCodCategoria = sanitizeInput(codCategoria);

    const categoria = await prisma.categoria.findUnique({
      where: { codCategoria: sanitizedCodCategoria },
    });

    return categoria;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding categoria:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar categoría");
  }
};

export const update = async (
  codCategoria: string,
  nombreCategoria: string,
  descCategoria: string,
  descuentoCorte: number,
  descuentoProducto: number
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codCategoria: sanitizeInput(codCategoria),
      nombreCategoria: sanitizeInput(nombreCategoria),
      descCategoria: sanitizeInput(descCategoria),
      descuentoCorte: Number(descuentoCorte),
      descuentoProducto: Number(descuentoProducto),
    };

    // validar (menos codCategoria)
    const validatedData = CategoriaSchema.parse({
      nombreCategoria: sanitizedData.nombreCategoria,
      descCategoria: sanitizedData.descCategoria,
      descuentoCorte: sanitizedData.descuentoCorte,
      descuentoProducto: sanitizedData.descuentoProducto,
    });

    // verificar que la categoría existe
    const existingCategoria = await prisma.categoria.findUnique({
      where: { codCategoria: sanitizedData.codCategoria },
    });

    if (!existingCategoria) {
      throw new DatabaseError("Categoría no encontrada");
    }

    // actualizar categoría
    const updatedCategoria = await prisma.categoria.update({ 
      where: { codCategoria: sanitizedData.codCategoria },
      data: {
        nombreCategoria: validatedData.nombreCategoria,
        descCategoria: validatedData.descCategoria,
        descuentoCorte: validatedData.descuentoCorte,
        descuentoProducto: validatedData.descuentoProducto,
      },
    });

    console.log("Categoria updated successfully");
    return updatedCategoria;
  } catch (error) {
    console.error(
      "Error updating categoria:",
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
        throw new DatabaseError("Ya existe una categoría con ese nombre");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Categoría no encontrada");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar categoría");
  }
};

export const destroy = async (codCategoria: string) => {
  try {
    // sanitizar y validar
    const sanitizedCodCategoria = sanitizeInput(codCategoria);

    // verificar que la categoría existe
    const existingCategoria = await prisma.categoria.findUnique({
      where: { codCategoria: sanitizedCodCategoria },
    });

    if (!existingCategoria) {
      throw new DatabaseError("Categoría no encontrada");
    }

    // eliminar categoría
    const deletedCategoria = await prisma.categoria.delete({
      where: { codCategoria: sanitizedCodCategoria },
    });

    console.log("Categoria deleted successfully");
    return deletedCategoria;
  } catch (error) {
    console.error(
      "Error deleting categoria:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Categoría no encontrada");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: la categoría está siendo utilizada"
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar categoría");
  }
};

const getCategoryIndex = (nombreCategoria: string) => {
  const normalized = nombreCategoria.trim().toLowerCase();
  return CATEGORY_RANK.findIndex(
    (name) => name.toLowerCase() === normalized
  );
};

const getAdjacentCategoryName = (
  nombreCategoria: string,
  direction: CategoryDirection
) => {
  const currentIndex = getCategoryIndex(nombreCategoria);
  if (currentIndex === -1) {
    return null;
  }

  const targetIndex = direction === "promote"
    ? currentIndex + 1
    : currentIndex - 1;

  return CATEGORY_RANK[targetIndex] || null;
};

const getCurrentClientsByCategory = async (codCategoria: string) => {
  const currentEntries = await prisma.categoria_vigente.findMany({
    orderBy: { ultimaFechaInicio: "desc" },
    distinct: ["codCliente"],
    include: {
      usuarios: {
        select: {
          codUsuario: true,
          dni: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
        },
      },
      categorias: {
        select: {
          codCategoria: true,
          nombreCategoria: true,
        },
      },
    },
  });

  return currentEntries.filter(
    (entry) => entry.codCategoria === codCategoria
  );
};

export const listClientsForCategory = async (codCategoria: string) => {
  try {
    const sanitizedCodCategoria = sanitizeInput(codCategoria);
    const categoria = await prisma.categoria.findUnique({
      where: { codCategoria: sanitizedCodCategoria },
      select: { codCategoria: true, nombreCategoria: true },
    });

    if (!categoria) {
      throw new DatabaseError("Categoría no encontrada");
    }

    const currentClients = await getCurrentClientsByCategory(
      sanitizedCodCategoria
    );
    const clientIds = currentClients.map((entry) => entry.codCliente);

    const totalsMap = new Map<string, number>();
    const canceledMap = new Map<string, number>();

    if (clientIds.length > 0) {
      const totals = await prisma.turno.groupBy({
        by: ["codCliente"],
        _count: { _all: true },
        where: { codCliente: { in: clientIds } },
      });

      const canceled = await prisma.turno.groupBy({
        by: ["codCliente"],
        _count: { _all: true },
        where: {
          codCliente: { in: clientIds },
          estado: "Cancelado",
        },
      });

      totals.forEach((row) =>
        totalsMap.set(row.codCliente, row._count._all)
      );
      canceled.forEach((row) =>
        canceledMap.set(row.codCliente, row._count._all)
      );
    }

    const clientes = currentClients.map((entry) => ({
      codCliente: entry.codCliente,
      dni: entry.usuarios?.dni || "",
      nombre: entry.usuarios?.nombre || "",
      apellido: entry.usuarios?.apellido || "",
      email: entry.usuarios?.email || null,
      telefono: entry.usuarios?.telefono || null,
      stats: {
        total: totalsMap.get(entry.codCliente) || 0,
        cancelados: canceledMap.get(entry.codCliente) || 0,
      },
    }));

    return { categoria, clientes };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error listing clients for category:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al obtener clientes de la categoría");
  }
};

export const destroyWithClientReassignment = async (
  codCategoria: string,
  action?: DeleteCategoryAction,
  perClient?: Array<{ codCliente: string; decision: CategoryDirection }>
) => {
  try {
    const sanitizedCodCategoria = sanitizeInput(codCategoria);
    const categoria = await prisma.categoria.findUnique({
      where: { codCategoria: sanitizedCodCategoria },
    });

    if (!categoria) {
      throw new DatabaseError("Categoría no encontrada");
    }

    const currentClients = await getCurrentClientsByCategory(
      sanitizedCodCategoria
    );

    if (currentClients.length > 0 && !action) {
      throw new DatabaseError(
        "Se requiere una acción para reasignar los clientes"
      );
    }

    const now = new Date();
    const reassignmentData: Array<{
      codCategoria: string;
      codCliente: string;
      ultimaFechaInicio: Date;
    }> = [];

    if (currentClients.length > 0 && action) {
      const decisionsMap = new Map<string, CategoryDirection>();

      if (action === "promote_all" || action === "demote_all") {
        const decision: CategoryDirection =
          action === "promote_all" ? "promote" : "demote";
        currentClients.forEach((entry) => {
          decisionsMap.set(entry.codCliente, decision);
        });
      } else if (action === "per_client") {
        if (!perClient || perClient.length === 0) {
          throw new DatabaseError(
            "Se requieren decisiones por cliente para continuar"
          );
        }

        perClient.forEach((decision) => {
          decisionsMap.set(decision.codCliente, decision.decision);
        });
      }

      const missingDecisions = currentClients.filter(
        (entry) => !decisionsMap.has(entry.codCliente)
      );

      if (missingDecisions.length > 0) {
        throw new DatabaseError(
          "Faltan decisiones para algunos clientes"
        );
      }

      const targetNames = new Set<string>();
      const clientTargets = new Map<string, string>();

      currentClients.forEach((entry) => {
        const decision = decisionsMap.get(entry.codCliente);
        if (!decision) return;

        const targetName = getAdjacentCategoryName(
          categoria.nombreCategoria,
          decision
        );

        if (!targetName) {
          throw new DatabaseError(
            `No se puede ${
              decision === "promote" ? "subir" : "bajar"
            } la categoría ${categoria.nombreCategoria}`
          );
        }

        targetNames.add(targetName);
        clientTargets.set(entry.codCliente, targetName);
      });

      const targetCategories = await prisma.categoria.findMany({
        where: { nombreCategoria: { in: Array.from(targetNames) } },
        select: { codCategoria: true, nombreCategoria: true },
      });

      const targetMap = new Map(
        targetCategories.map((cat) => [cat.nombreCategoria, cat.codCategoria])
      );

      for (const [codCliente, targetName] of clientTargets.entries()) {
        const targetId = targetMap.get(targetName);
        if (!targetId) {
          throw new DatabaseError(
            `No se encontro la categoria destino ${targetName}`
          );
        }

        reassignmentData.push({
          codCategoria: targetId,
          codCliente,
          ultimaFechaInicio: now,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (reassignmentData.length > 0) {
        await tx.categoria_vigente.createMany({ data: reassignmentData });
      }

      await tx.categoria_vigente.deleteMany({
        where: { codCategoria: sanitizedCodCategoria },
      });

      const deletedCategoria = await tx.categoria.delete({
        where: { codCategoria: sanitizedCodCategoria },
      });

      return deletedCategoria;
    });

    return {
      categoria: result,
      reassignedCount: reassignmentData.length,
    };
  } catch (error) {
    console.error(
      "Error deleting categoria with reassignment:",
      error instanceof Error ? error.message : "Unknown error"
    );

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar categoría");
  }
};
