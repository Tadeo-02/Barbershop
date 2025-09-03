import { prisma, DatabaseError, sanitizeInput } from "../base/Base"; // importamos todo desde Base
import { z } from "zod";

// schema de validación con Zod (más robusto que las funciones manuales)
const BarberoSchema = z.object({
  // codUsuario: z
  //   .string().uuid("ID de barbero inválido"),
  dni: z
    .string()
    .min(1, "DNI es requerido")
    .regex(/^\d{8}$/, "DNI inválido. Debe tener 8 dígitos"),
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
  email: z.string().email("Email inválido"),
  contraseña: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
});

// funciones backend
export const store = async (
  dni: string,
  cuil: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string
) => {
  try {
    // sanitizar inputs
    const sanitizedData = {
      dni: sanitizeInput(dni),
      cuil: sanitizeInput(cuil),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    // validación con zod
    const validatedData = BarberoSchema.parse(sanitizedData);

    console.log("Creating barbero");

    // crear usuario (mapeando contraseña -> contrase_a)
    const usuario = await prisma.usuarios.create({
      data: {
        dni: validatedData.dni,
        cuil: validatedData.cuil,
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
        email: sanitizedData.email,
        contrase_a: sanitizedData.contraseña,
      },
    });

    console.log("Usuario created successfully");
    return usuario;
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

    const usuarios = await prisma.usuarios.findMany({
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    console.log(`Retrieved ${usuarios.length} usuarios`);
    console.log(usuarios);
    return usuarios;
  } catch (error) {
    console.error(
      "Error fetching usuarios:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al obtener lista de usuarios");
  }
};

export const findById = async (codUsuario: string) => {
  try {
    //sanitizar y validar
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    const usuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    return usuario;
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
  codUsuario: string,
  dni: string,
  cuil: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string
) => {
  try {
    // sanitizar datos
    const sanitizedData = {
      codUsuario: sanitizeInput(codUsuario),
      dni: sanitizeInput(dni),
      cuil: sanitizeInput(cuil),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    const validatedData = BarberoSchema.parse({
      dni: sanitizedData.dni,
      cuil: sanitizedData.cuil,
      nombre: sanitizedData.nombre,
      apellido: sanitizedData.apellido,
      telefono: sanitizedData.telefono,
      email: sanitizedData.email,
      contraseña: sanitizedData.contraseña,
    });

    // Usar el codUsuario sanitizado (no validado por Zod)
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedData.codUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

    // update usuario usando codUsuario sanitizado
    const updatedUsuario = await prisma.usuarios.update({
      where: { codUsuario: sanitizedData.codUsuario },
      data: {
        dni: validatedData.dni,
        cuil: validatedData.cuil,
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
        email: validatedData.email,
        contrase_a: validatedData.contraseña,
      },
    });

    console.log("Usuario updated successfully");
    return updatedUsuario;
  } catch (error) {
    console.error(
      "Error updating barbero:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // manejo de errores de validacion
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // manejar errores de DB
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

export const destroy = async (codUsuario: string) => {
  try {
    // sanitizar y validar
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // verificar que el usuario existe
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

    // delete usuario
    const deletedUsuario = await prisma.usuarios.delete({
      where: { codUsuario: sanitizedCodUsuario },
    });

    console.log("Usuario deleted successfully");
    return deletedUsuario;
  } catch (error) {
    console.error(
      "Error deleting barbero:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // manejo de errores de DB
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
