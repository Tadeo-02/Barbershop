import { z } from "zod";

export const CategorySchema = z.object({
  nombre: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(50, "Nombre no puede tener más de 50 caracteres"),
  descripcion: z
    .string()
    .min(2, "Descripción debe tener al menos 2 caracteres")
    .max(250, "Descripción no puede tener más de 250 caracteres"),
  descuentoCorte: z
    .number()
    .min(0, "Descuento en cortes debe ser al menos 0")
    .max(100, "Descuento en cortes no puede ser mayor a 100"),
  descuentoProducto: z
    .number()
    .min(0, "Descuento en productos debe ser al menos 0")
    .max(100, "Descuento en productos no puede ser mayor a 100"),
});

