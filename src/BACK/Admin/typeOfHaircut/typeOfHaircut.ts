import { prisma, DatabaseError, sanitizeInput } from "../../base/Base"; // importamos todo desde Base
import { z } from "zod";
import { assertEntityExists } from "../../lib/entityChecks";
import { parseValidatedInput } from "../../lib/zodHelpers";

const TypeOfHaircutSchema = z.object({
  nombreCorte: z
    .string()
    .min(1, "Nombre de corte es requerido")
    .max(100, "Nombre de corte no puede tener más de 100 caracteres"),
  valorBase: z
    .string()
    .min(1, "Precio es requerido")
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Precio inválido. Formato numérico con hasta 2 decimales",
    ),
});

// funciones backend
export const store = async (nombreCorte: string, valorBase: string) => {
  try {
    // sanitizar inputs
    const sanitizedData = {
      nombreCorte: sanitizeInput(nombreCorte),
      valorBase: sanitizeInput(valorBase),
    };

    // validación con zod
    const validatedData = parseValidatedInput(TypeOfHaircutSchema, sanitizedData);

    console.log("Creating tipo de corte");

    // crear tipo de corte
    const tipoCorte = await prisma.tipos_corte.create({
      data: {
        nombreCorte: validatedData.nombreCorte,
        valorBase: parseFloat(validatedData.valorBase),
      },
    });

    console.log("Tipo de corte created successfully");
    return tipoCorte;
  } catch (error) {
    console.error(
      "Error creating tipo de corte:",
      error instanceof Error ? error.message : "Unknown error",
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
    console.log("Fetching all types of haircuts with Prisma");

    const tipoCorte = await prisma.tipos_corte.findMany({
      orderBy: [{ nombreCorte: "asc" }],
    });

    console.log(`Retrieved ${tipoCorte.length} tipos de corte`);
    console.log(tipoCorte);
    return tipoCorte;
  } catch (error) {
    console.error(
      "Error fetching tipos de corte:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al obtener lista de tipos de corte");
  }
};

export const findById = async (codTipoCorte: string) => {
  try {
    //sanitizar y validar
    const sanitizedCodTipoCorte = sanitizeInput(codTipoCorte);

    const tipoCorte = await prisma.tipos_corte.findUnique({
      where: { codCorte: sanitizedCodTipoCorte },
    });

    return tipoCorte;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding tipo de corte:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new DatabaseError("Error al buscar tipo de corte");
  }
};

export const update = async (
  codCorte: string,
  nombreCorte: string,
  valorBase: string,
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codCorte: sanitizeInput(codCorte),
      nombreCorte: sanitizeInput(nombreCorte),
      valorBase: sanitizeInput(valorBase),
    };

    const validatedData = parseValidatedInput(TypeOfHaircutSchema, {
      nombreCorte: sanitizedData.nombreCorte,
      valorBase: sanitizedData.valorBase,
    });

    // Usar el codCorte sanitizado (no validado por Zod)
    const existingTipoCorte = await prisma.tipos_corte.findUnique({
      where: { codCorte: sanitizedData.codCorte },
    });

    assertEntityExists(existingTipoCorte, "Tipo de corte");

    // update tipo de corte usando codCorte sanitizado
    const updatedTipoCorte = await prisma.tipos_corte.update({
      where: { codCorte: sanitizedData.codCorte },
      data: {
        nombreCorte: validatedData.nombreCorte,
        valorBase: parseFloat(validatedData.valorBase),
      },
    });

    console.log("Tipo de corte updated successfully");
    return updatedTipoCorte;
  } catch (error) {
    console.error(
      "Error updating tipo de corte:",
      error instanceof Error ? error.message : "Unknown error",
    );

    // manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar tipo de corte");
  }
};

export const destroy = async (codCorte: string) => {
  try {
    // sanitizar y validar
    const sanitizedCodCorte = sanitizeInput(codCorte);

    // verificar que el tipo de corte existe
    const existingTipoCorte = await prisma.tipos_corte.findUnique({
      where: { codCorte: sanitizedCodCorte },
    });

    assertEntityExists(existingTipoCorte, "Tipo de corte");

    // delete tipo de corte
    const deletedTipoCorte = await prisma.tipos_corte.delete({
      where: { codCorte: sanitizedCodCorte },
    });

    console.log("Tipo de corte deleted successfully");
    return deletedTipoCorte;
  } catch (error) {
    console.error(
      "Error deleting tipo de corte:",
      error instanceof Error ? error.message : "Unknown error",
    );

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar tipo de corte");
  }
};
