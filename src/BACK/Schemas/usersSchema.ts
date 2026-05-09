import { z } from "zod";
import { CategorySchema } from "./categoriesSchema";

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)/;
export const PASSWORD_PATTERN = `(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\W).{${PASSWORD_MIN_LENGTH},${PASSWORD_MAX_LENGTH}}`;
export const PHONE_REGEX = /^\+?[\d\s()\-]{6,20}$/;
// Función para validar CUIL (acepta formato con guiones o 11 dígitos sin guiones)
const validateCUIL = (cuil: string, dni: string): boolean => {
  if (!cuil) return false;
  const digits = String(cuil).replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits)) return false;
  // Extraer los 8 dígitos centrales que corresponden al DNI
  const dniFromCuil = digits.slice(2, 10);
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
      PHONE_REGEX,
      "Teléfono inválido. Usa números, espacios, paréntesis, guiones y +",
    ),
  email: z.string().email("Email inválido"),

  contraseña: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    )
    .max(
      PASSWORD_MAX_LENGTH,
      `Contraseña no puede tener más de ${PASSWORD_MAX_LENGTH} caracteres`,
    )
    .regex(
      PASSWORD_REGEX,
      "La contraseña debe incluir minúsculas, mayúsculas, números y símbolos",
    ),

  cuil: z.string().optional(),
  codSucursal: z.string().optional(),
  // Opciones para recuperación de contraseña
  preguntaSeguridad: z.string().optional(),
  respuestaSeguridad: z.string().optional(),
});

// Full schema with refinements for validation
export const UserSchema = UserBaseSchema.refine(
  (data) => {
    if (data.cuil) {
      const digits = String(data.cuil).replace(/\D/g, "");
      return /^\d{11}$/.test(digits);
    }
    return true;
  },
  {
    message: "CUIL inválido. Formato requerido: XX-XXXXXXXX-X o 11 dígitos",
    path: ["cuil"],
  },
).refine(
  (data) => {
    if (data.cuil) {
      return validateCUIL(String(data.cuil), data.dni);
    }
    return true;
  },
  {
    message: "El DNI en el CUIL no coincide con el DNI proporcionado",
    path: ["cuil"],
  },
);

const UserUpdateBaseSchema = UserBaseSchema.extend({
  contraseña: z.string().optional(),
  preguntaSeguridad: z.string().optional(),
  respuestaSeguridad: z.string().optional(),
});

export const UserUpdateSchema = UserUpdateBaseSchema.refine(
  (data) => {
    if (data.cuil) {
      const digits = String(data.cuil).replace(/\D/g, "");
      return /^\d{11}$/.test(digits);
    }
    return true;
  },
  {
    message: "CUIL inválido. Formato requerido: XX-XXXXXXXX-X o 11 dígitos",
    path: ["cuil"],
  },
).refine(
  (data) => {
    if (data.cuil) {
      return validateCUIL(String(data.cuil), data.dni);
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
// MySQL stores booleans as 0/1, so we accept both formats
export const BarberResponseSchema = z
  .object({
    codUsuario: z.string(),
    dni: z.string(),
    nombre: z.string(),
    apellido: z.string(),
    telefono: z.string(),
    email: z.string(),
    cuil: z.string().nullable(),
    codSucursal: z.string().nullable().optional(),
    preguntaSeguridad: z.string().optional().nullable(),
    respuestaSeguridad: z.string().optional().nullable(),
    activo: z.union([z.boolean(), z.number()]).transform((val) => Boolean(val)),
  })
  .passthrough(); // Allow extra fields from database

export type BarberResponse = z.infer<typeof BarberResponseSchema>;

const CategorySummarySchema = CategorySchema.pick({
  codCategoria: true,
  nombreCategoria: true,
  descCategoria: true,
  descuentoCorte: true,
  descuentoProducto: true,
}).extend({
  fechaInicio: z.union([z.string(), z.date()]).optional(),
});

const LoyaltyProgressSchema = z.object({}).passthrough();

export const UserResponseSchema = UserBaseSchemaExport.omit({
  contraseña: true,
  preguntaSeguridad: true,
  respuestaSeguridad: true,
}).extend({
  codUsuario: z.string(),
  cuil: z.string().nullable().optional(),
  codSucursal: z.string().nullable().optional(),
  activo: z
    .union([z.boolean(), z.number()])
    .optional()
    .transform((val) => Boolean(val)),
  categoriaActual: CategorySummarySchema.nullable().optional(),
  loyaltyProgress: LoyaltyProgressSchema.nullable().optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  contraseña: z.string().min(1, "Contraseña es requerida"),
});
