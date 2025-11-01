import { prisma, DatabaseError, sanitizeInput } from "../../base/Base";
import { z } from "zod";

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
