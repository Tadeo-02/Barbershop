import { z } from "zod";
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

// Base schema without refinements (to allow .omit() in derived schemas)
const UserBaseSchema = z.object({
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
      "Teléfono inválido. Formato esperado: +54 11 1234-5678",
    ),
  email: z.string().email("Email inválido"),

  contraseña: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),

  cuil: z.string().optional(),
  codSucursal: z.string().optional(),
});

// Full schema with refinements for validation
export const UserSchema = UserBaseSchema.refine(
  (data) => {
    // Validate CUIL format if provided
    if (data.cuil && !/^\d{2}-\d{8}-\d{1}$/.test(data.cuil)) {
      return false;
    }
    return true;
  },
  {
    message: "CUIL inválido. Formato requerido: XX-XXXXXXXX-X",
    path: ["cuil"],
  },
).refine(
  (data) => {
    // Si hay CUIL, validar que el DNI coincida
    if (data.cuil) {
      return validateCUIL(data.cuil, data.dni);
    }
    return true;
  },
  {
    message: "El DNI en el CUIL no coincide con el DNI proporcionado",
    path: ["cuil"],
  },
);

// Export base schema for use in derived schemas (like update schemas)
export const UserBaseSchemaExport = UserBaseSchema;
