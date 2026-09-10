import { prisma, DatabaseError, sanitizeInput } from "../../base/Base"; // importamos todo desde Base
import logger from "../../lib/logger";
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

//  backend functions
export const store = async (nombreCorte: string, valorBase: string) => {
  try {
    // sanitize inputs
    const sanitizedData = {
      nombreCorte: sanitizeInput(nombreCorte),
      valorBase: sanitizeInput(valorBase),
    };

    // validate with zod
    const validatedData = parseValidatedInput(TypeOfHaircutSchema, sanitizedData);

    logger.info("Creating tipo de corte");

    // create haircut
    const tipoCorte = await prisma.tipos_corte.create({
      data: {
        nombreCorte: validatedData.nombreCorte,
        valorBase: parseFloat(validatedData.valorBase),
      },
    });

    logger.info("Tipo de corte created successfully");
    return tipoCorte;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error creating tipo de corte",
    );
    //handle errors of validation
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }
    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    logger.info("Fetching all types of haircuts");

    const tipoCorte = await prisma.tipos_corte.findMany({
      orderBy: [{ nombreCorte: "asc" }],
    });

    logger.info({ count: tipoCorte.length }, "Retrieved tipos de corte");
    return tipoCorte;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error fetching tipos de corte",
    );
    throw new DatabaseError("Error al obtener lista de tipos de corte");
  }
};

export const findById = async (codTipoCorte: string) => {
  try {
    //sanitize and validate
    const sanitizedCodTipoCorte = sanitizeInput(codTipoCorte);

    const tipoCorte = await prisma.tipos_corte.findUnique({
      where: { codCorte: sanitizedCodTipoCorte },
    });

    return tipoCorte;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error finding tipo de corte",
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
    // sanitize data
    const sanitizedData = {
      codCorte: sanitizeInput(codCorte),
      nombreCorte: sanitizeInput(nombreCorte),
      valorBase: sanitizeInput(valorBase),
    };

    const validatedData = parseValidatedInput(TypeOfHaircutSchema, {
      nombreCorte: sanitizedData.nombreCorte,
      valorBase: sanitizedData.valorBase,
    });

    // Use the sanitized codCorte (not validated by Zod)
    const existingTipoCorte = await prisma.tipos_corte.findUnique({
      where: { codCorte: sanitizedData.codCorte },
    });

    assertEntityExists(existingTipoCorte, "Tipo de corte");

    // update type of haircut using sanitized codCorte
    const updatedTipoCorte = await prisma.tipos_corte.update({
      where: { codCorte: sanitizedData.codCorte },
      data: {
        nombreCorte: validatedData.nombreCorte,
        valorBase: parseFloat(validatedData.valorBase),
      },
    });

    logger.info("Tipo de corte updated successfully");
    return updatedTipoCorte;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error updating tipo de corte",
    );

    // handle errors of validation
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
    // sanitize and validate
    const sanitizedCodCorte = sanitizeInput(codCorte);

    // verify the type of haircut exists before attempting to delete
    const existingTipoCorte = await prisma.tipos_corte.findUnique({
      where: { codCorte: sanitizedCodCorte },
    });

    assertEntityExists(existingTipoCorte, "Tipo de corte");

    // delete type of haircut
    const deletedTipoCorte = await prisma.tipos_corte.delete({
      where: { codCorte: sanitizedCodCorte },
    });

    logger.info("Tipo de corte deleted successfully");
    return deletedTipoCorte;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Error deleting tipo de corte",
    );

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar tipo de corte");
  }
};
