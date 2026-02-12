import { z } from "zod";

export const HaircutSchema = z.object({
  nombre: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(50, "Nombre no puede tener más de 50 caracteres"),
    valorBase: z
    .number()
    .min(0, "Valor base debe ser al menos 0")
});


