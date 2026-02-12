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

  contraseña: z
    .string()
    .min(10, "Contraseña debe tener al menos 10 caracteres")
    .max(128, "Contraseña no puede tener más de 128 caracteres")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)/, "La contraseña debe incluir minúsculas, mayúsculas, números y símbolos"),

  cuil: z.string().optional(),
  codSucursal: z.string().optional(),
  // Opciones para recuperación de contraseña
  preguntaSeguridad: z.string().optional(),
  respuestaSeguridad: z.string().optional(),
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



export const UserBaseSchemaExport = UserBaseSchema;

// Schema específico para barberos (derivado del base). Exportarlo para que
// el frontend pueda reutilizar la misma validación y tipos.
export const BarberSchema = UserBaseSchema.extend({
  codUsuario: z.string(),
  codSucursal: z.string().optional(),
});

export type Barber = z.infer<typeof BarberSchema>;

// Schema used for backend -> frontend responses (no password required)
export const BarberResponseSchema = UserBaseSchema.omit({ contraseña: true }).extend({
  // Make telefono optional in responses (DB may store different formats)
  telefono: z.string().optional(),
  codUsuario: z.string(),
  codSucursal: z.string().optional(),
});

export type BarberResponse = z.infer<typeof BarberResponseSchema>;
