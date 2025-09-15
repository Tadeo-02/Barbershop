import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import { z } from "zod";

// Schema de validación específico para usuarios normales (sin CUIL)
const UserSchema = z.object({
  dni: z
    .string()
    .min(1, "DNI es requerido")
    .regex(/^\d{8}$/, "DNI inválido. Debe tener 8 dígitos"),
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

// Función para crear usuario normal (sin CUIL)
export const store = async (
  dni: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string
) => {
  try {
    // Sanitizar inputs
    const sanitizedData = {
      dni: sanitizeInput(dni),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    // Validación con zod
    const validatedData = UserSchema.parse(sanitizedData);

    console.log("Creating user");

    // Crear usuario (mapeando contraseña -> contrase_a, sin CUIL)
    const usuario = await prisma.usuarios.create({
      data: {
        dni: validatedData.dni,
        cuil: null, // Los usuarios normales no tienen CUIL
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
        email: validatedData.email,
        contrase_a: validatedData.contraseña,
      },
    });

    console.log("Usuario created successfully");
    return usuario;
  } catch (error) {
    console.error(
      "Error creating user:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // Manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("El DNI o email ya existe en el sistema");
      }
    }

    throw new DatabaseError("Error interno del servidor");
  }
};

export const findAll = async () => {
  try {
    console.log("Fetching all users with Prisma");

    // Solo usuarios sin CUIL (usuarios normales, no barberos)
    const usuarios = await prisma.usuarios.findMany({
      where: { cuil: null },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    console.log(`Retrieved ${usuarios.length} usuarios`);
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
    // Sanitizar y validar
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
      "Error finding user:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar usuario");
  }
};

export const update = async (
  codUsuario: string,
  dni: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string
) => {
  try {
    // Sanitizar datos
    const sanitizedData = {
      codUsuario: sanitizeInput(codUsuario),
      dni: sanitizeInput(dni),
      nombre: sanitizeInput(nombre),
      apellido: sanitizeInput(apellido),
      telefono: sanitizeInput(telefono),
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    const validatedData = UserSchema.parse({
      dni: sanitizedData.dni,
      nombre: sanitizedData.nombre,
      apellido: sanitizedData.apellido,
      telefono: sanitizedData.telefono,
      email: sanitizedData.email,
      contraseña: sanitizedData.contraseña,
    });

    // Verificar que el usuario existe
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedData.codUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

    // Actualizar usuario
    const updatedUsuario = await prisma.usuarios.update({
      where: { codUsuario: sanitizedData.codUsuario },
      data: {
        dni: validatedData.dni,
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
      "Error updating user:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    // Manejar errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        throw new DatabaseError("El nuevo DNI o email ya existe en el sistema");
      }

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Usuario no encontrado");
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al actualizar usuario");
  }
};

export const destroy = async (codUsuario: string) => {
  try {
    // Sanitizar y validar
    const sanitizedCodUsuario = sanitizeInput(codUsuario);

    // Verificar que el usuario existe
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedCodUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }

    // Eliminar usuario
    const deletedUsuario = await prisma.usuarios.delete({
      where: { codUsuario: sanitizedCodUsuario },
    });

    console.log("Usuario deleted successfully");
    return deletedUsuario;
  } catch (error) {
    console.error(
      "Error deleting user:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de DB
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2025") {
        throw new DatabaseError("Usuario no encontrado");
      }

      if (prismaError.code === "P2003") {
        throw new DatabaseError(
          "No se puede eliminar: el usuario tiene turnos asociados"
        );
      }
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al eliminar usuario");
  }
};
