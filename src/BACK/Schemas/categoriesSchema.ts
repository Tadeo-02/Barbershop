
import { z } from "zod";

export const CategorySchema = z.object({
  codCategoria: z.string(),
  nombreCategoria: z
    .string()
    .min(2, "Nombre de categoría debe tener al menos 2 caracteres")
    .max(50, "Nombre de categoría no puede tener más de 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Nombre solo puede contener letras"),
  descCategoria: z
    .string()
    .min(10, "Descripción debe tener al menos 10 caracteres")
    .max(250, "Descripción no puede tener más de 250 caracteres"),
  descuentoCorte: z
    .number()
    .min(0, "Descuento de corte debe ser mayor o igual a 0")
    .max(100, "Descuento de corte no puede ser mayor a 100%"),
  descuentoProducto: z
    .number()
    .min(0, "Descuento de producto debe ser mayor o igual a 0")
    .max(100, "Descuento de producto no puede ser mayor a 100%"),
});

