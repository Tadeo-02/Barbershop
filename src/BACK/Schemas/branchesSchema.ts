import { z } from "zod";

export const BranchSchema = z.object({
  nombre: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(100, "Nombre no puede tener más de 100 caracteres"),
  calle: z
    .string()
    .min(2, "Calle debe tener al menos 2 caracteres")
    .max(100, "Calle no puede tener más de 100 caracteres"),
  altura: z
    .number()
    .min(1, "Altura debe ser mayor a 0")
    .max(10000, "Altura no puede ser mayor a 10000"),
});

// Schema para respuestas de la API que incluye el ID auto-generado
// MySQL devuelve activo como 0 o 1, por eso se acepta ambos tipos y se transforma a booleano
export const BranchWithIdSchema = BranchSchema.extend({
  codSucursal: z.string(),
  activo: z.union([z.boolean(), z.number()]).transform((val) => Boolean(val)),
});
