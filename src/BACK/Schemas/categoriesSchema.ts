
import { z } from "zod";


export const CategorySchema = z.object({
  // El ID lo genera la base de datos; lo aceptamos como string opcional
  codCategoria: z.string(),

  nombreCategoria: z
    .string()
    .min(2, "Nombre debe tener al menos 2 caracteres")
    .max(50, "Nombre no puede tener más de 50 caracteres"),

  descCategoria: z
    .string()
    .min(10, "Descripción debe tener al menos 10 caracteres")
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

