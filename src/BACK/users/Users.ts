import { prisma, DatabaseError, sanitizeInput } from "../base/Base";
import { z } from "zod";
import { hashPassword, comparePassword } from "../users/bcrypt";

// Función para validar CUIL
const validateCUIL = (cuil: string, dni: string): boolean => {
  // Verificar formato XX-XXXXXXXX-X
  const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!cuilRegex.test(cuil)) {
    return false;
  }

  // Extraer el DNI del CUIL (los 8 dígitos del medio)
  const dniFromCuil = cuil.substring(3, 11); // posición 3 a 10 (8 dígitos)

  // Verificar que el DNI del CUIL coincida con el DNI proporcionado
  return dniFromCuil === dni;
};

const UserSchema = z
  .object({
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
      .regex(
        /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        "Apellido solo puede contener letras"
      ),

    telefono: z
      .string()
      .regex(
        /^(\+?54\s?)?(\(?\d{2,4}\)?\s?)?\d{4}-?\d{4}$/,
        "Teléfono inválido. Formato esperado: +54 11 1234-5678"
      ),
    email: z.string().email("Email inválido"),

    contraseña: z
      .string()
      .min(6, "Contraseña debe tener al menos 6 caracteres"),

    cuil: z
      .string()
      .optional()
      .refine(
        (cuil) => {
          if (!cuil) return true;
          return /^\d{2}-\d{8}-\d{1}$/.test(cuil);
        },
        { message: "CUIL inválido. Formato requerido: XX-XXXXXXXX-X" }
      ),
  })
  .refine(
    (data) => {
      // Si hay CUIL, validar que el DNI coincida
      if (data.cuil) {
        return validateCUIL(data.cuil, data.dni);
      }
      return true;
    },
    {
      message: "El DNI en el CUIL no coincide con el DNI proporcionado",
      path: ["cuil"], // El error se asociará al campo cuil
    }
  );

// Función para crear usuario normal (sin CUIL)
export const store = async (
  dni: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string,
  cuil?: string
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
      cuil: cuil ? sanitizeInput(cuil) : undefined, // sanitizo si existe
    };

    // Validación con zod
    const validatedData = UserSchema.parse(sanitizedData);

    console.log("Creating user");

    // encriptar contraseña luego de sanitizada
    const hashedPassword = await hashPassword(validatedData.contraseña);
    let cuilValue = null;
    if (validatedData.cuil) {
      // Limpiar CUIL para almacenamiento
      cuilValue = validatedData.cuil.replace(/[-\s]/g, "");
    }

    // Crear usuario (mapeando contraseña -> contrase_a, sin CUIL)
    const usuario = await prisma.usuarios.create({
      data: {
        dni: validatedData.dni,
        cuil: cuilValue, // Los usuarios normales no tienen CUIL !
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        telefono: validatedData.telefono,
        email: validatedData.email,
        contrase_a: hashedPassword,
      },
    });

    const userType =
      cuilValue === "1" ? "admin" : cuilValue ? "barber" : "client";
    console.log(`${userType} created successfully`);
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
        throw new DatabaseError("El DNI, email o CUIL ya existe en el sistema");
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

export const findByBranchId = async (codSucursal: string) => {
  try {
    // Sanitizar y validar
    const sanitizedCodSucursal = sanitizeInput(codSucursal);

    const usuarios = await prisma.usuarios.findMany({
      where: { codSucursal: sanitizedCodSucursal },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });

    return usuarios;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    console.error(
      "Error finding users by branch ID:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new DatabaseError("Error al buscar usuarios por sucursal");
  }
};

export const update = async (
  codUsuario: string,
  dni: string,
  nombre: string,
  apellido: string,
  telefono: string,
  email: string,
  contraseña: string,
  cuil?: string
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
      cuil: cuil ? sanitizeInput(cuil) : undefined, // sanitizo si existe
    };

    const validatedData = UserSchema.parse({
      dni: sanitizedData.dni,
      nombre: sanitizedData.nombre,
      apellido: sanitizedData.apellido,
      telefono: sanitizedData.telefono,
      email: sanitizedData.email,
      contraseña: sanitizedData.contraseña,
      cuil: sanitizedData.cuil,
    });

    // Verificar que el usuario existe
    const existingUsuario = await prisma.usuarios.findUnique({
      where: { codUsuario: sanitizedData.codUsuario },
    });

    if (!existingUsuario) {
      throw new DatabaseError("Usuario no encontrado");
    }
    // encriptar nueva contraseña para el update
    const hashedPassword = await hashPassword(validatedData.contraseña);

    let cuilValue = null;
    if (validatedData.cuil) {
      // Limpiar CUIL para almacenamiento
      cuilValue = validatedData.cuil.replace(/[-\s]/g, "");
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
        contrase_a: hashedPassword,
        cuil: cuilValue, // si es barbero, se guarda el CUIL limpio
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
        throw new DatabaseError(
          "El nuevo DNI, CUIL o email ya existe en el sistema"
        );
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

// Schema de validación para login
const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  contraseña: z.string().min(1, "Contraseña es requerida"),
});

// Función para validar login del usuario
export const validateLogin = async (email: string, contraseña: string) => {
  try {
    // Sanitizar inputs
    const sanitizedData = {
      email: sanitizeInput(email),
      contraseña: sanitizeInput(contraseña),
    };

    // Validación con zod
    const validatedData = LoginSchema.parse(sanitizedData);

    console.log("Validating user login for email:", validatedData.email);

    // Buscar usuario solo por email (NO por contraseña)
    const usuario = await prisma.usuarios.findFirst({
      where: {
        email: validatedData.email,
      },
    });

    if (!usuario) {
      console.log("Login failed: No user found with provided email");
      throw new DatabaseError("Email o contraseña incorrectos");
    }

    // Verificar contraseña usando bcrypt
    const isPasswordValid = await comparePassword(
      validatedData.contraseña,
      usuario.contrase_a
    );

    if (!isPasswordValid) {
      console.log("Login failed: Invalid password");
      throw new DatabaseError("Email o contraseña incorrectos");
    }

    console.log("User login validated successfully for user:", {
      codUsuario: usuario.codUsuario,
      email: usuario.email,
      cuil: usuario.cuil,
      userType:
        usuario.cuil === "1" ? "admin" : usuario.cuil ? "barber" : "client",
    });

    // Retornar usuario sin contraseña por seguridad
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrase_a, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  } catch (error) {
    console.error(
      "Error validating login:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Manejo de errores de validación
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }

    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError("Error al validar credenciales");
  }
};
