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

