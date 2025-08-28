import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// inicializar Prisma Client
const prisma = new PrismaClient();

// schema de validación con Zod (más robusto que las funciones manuales)
const BarberoSchema = z.object({
  cuil: z
    .string()
    .min(1, "CUIL es requerido")
    .regex(
      /^\d{2}-?\d{8}-?\d{1}$/,
      "CUIL inválido. Debe tener formato XX-XXXXXXXX-X"
    ),
  nombre: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(50, "Nombre no puede tener más de 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Nombre solo puede contener letras"),
  apellido: z
    .string()
    .min(2, "Apellido debe tener al menos 2 caracteres")
    .max(50, "Apellido no puede tener más de 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Apellido solo puede contener letras"),
  telefono: z
    .string()
    .regex(
      /^(\+?54\s?)?(\(?\d{2,4}\)?\s?)?\d{4}-?\d{4}$/,
      "Teléfono inválido. Formato esperado: +54 11 1234-5678"
    ),
});

const BarberoUpdateSchema = BarberoSchema.extend({
  cuilViejo: z
    .string()
    .min(1, "CUIL anterior es requerido")
    .regex(/^\d{2}-?\d{8}-?\d{1}$/, "CUIL anterior inválido"),
});

//  manejo de errores personalizados
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// función para sanitizar datos
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'";&]/g, "");
};

// funciones backend
export const store = async (
  cuil: string,
  nombre: string,
  apellido: string,
  telefono: string
) => {
  try {
    // Sanitizar datos
    const sanitizedData = {
      cuil: sanitizeInput(cuil),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
    };

    // Validación con Zod
    const validatedData = BarberoSchema.parse(sanitizedData);

    console.log("Creating barbero");

    // Crear barbero
    const barbero = await prisma.barbero.create({
      data: validatedData,
    });

    console.log("Barbero created successfully");
    return barbero;
  } catch (error) {
    console.error(
      "Error creating barbero:",
      error instanceof Error ? error.message : "Unknown error"
    );
    //manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }
    //manejo de errores db
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("El CUIL ya existe en el sistema");
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    console.log("Fetching all barberos with Prisma");

    const barberos = await prisma.barbero.findMany({
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    console.log(`Retrieved ${barberos.length} barberos`);
    return barberos;
  } catch (error) {
    console.error(
      "Error fetching barberos:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al obtener lista de barberos");
  }
};

export const findById = async (cuil: string) => {
  try {
    // sanitizar y validar
    const sanitizedCuil = sanitizeInput(cuil);

    if (!sanitizedCuil) {
      throw new DatabaseError("CUIL es requerido");
    }

    if (!/^\d{2}-?\d{8}-?\d{1}$/.test(sanitizedCuil.replace(/-/g, ""))) {
      throw new DatabaseError("Formato de CUIL inválido");
    }

    const barbero = await prisma.barbero.findUnique({
      where: { cuil: sanitizedCuil },
    });

    return barbero;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding barbero:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar barbero");
  }
};

export const update = async (
  cuilViejo: string,
  nuevoCuil: string,
  nombre: string,
  apellido: string,
  telefono: string
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      cuilViejo: sanitizeInput(cuilViejo),
      cuil: sanitizeInput(nuevoCuil),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
    };

    // validaciones
    //zod
    const validatedData = BarberoUpdateSchema.parse(sanitizedData);
    //existe barbero
    const existingBarbero = await prisma.barbero.findUnique({
      where: { cuil: validatedData.cuilViejo },
    });

    if (!existingBarbero) {
      throw new DatabaseError("Barbero no encontrado");
    }

    // update barbero
    const updatedBarbero = await prisma.barbero.update({
      where: { cuil: validatedData.cuilViejo },
      data: {
        cuil: validatedData.cuil,
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
      },
    });

    console.log("Barbero updated successfully");
    return updatedBarbero;
  } catch (error) {
    console.error(
      "Error updating barbero:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // Manejar errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("El nuevo CUIL ya existe en el sistema");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Barbero no encontrado");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar barbero");
  }
};

export const destroy = async (cuil: string) => {
  try {
    // sanitizar y validar
    const sanitizedCuil = sanitizeInput(cuil);

    if (!sanitizedCuil) {
      throw new DatabaseError("CUIL es requerido");
    }

    if (!/^\d{2}-?\d{8}-?\d{1}$/.test(sanitizedCuil.replace(/-/g, ""))) {
      throw new DatabaseError("CUIL inválido");
    }

    // verificar que el barbero existe
    const existingBarbero = await prisma.barbero.findUnique({
      where: { cuil: sanitizedCuil },
    });

    if (!existingBarbero) {
      throw new DatabaseError("Barbero no encontrado");
    }

    // delete barbero
    const deletedBarbero = await prisma.barbero.delete({
      where: { cuil: sanitizedCuil },
    });

    console.log("Barbero deleted successfully");
    return deletedBarbero;
  } catch (error) {
    console.error(
      "Error deleting barbero:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Barbero no encontrado");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: el barbero tiene turnos asociados"
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar barbero");
  }
};

// función para cerrar la conexión de Prisma
export const disconnect = async () => {
  await prisma.$disconnect();
};
