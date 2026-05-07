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

export const CategoryResponseSchema = CategorySchema.pick({
  codCategoria: true,
  nombreCategoria: true,
  descCategoria: true,
  descuentoCorte: true,
  descuentoProducto: true,
});

const CategoryClientBaseSchema = z.object({
  codCliente: z.string(),
  dni: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  stats: z.object({
    total: z.number(),
    cancelados: z.number(),
  }),
});

export const CategoryClientSchema = CategoryClientBaseSchema.pick({
  codCliente: true,
  dni: true,
  nombre: true,
  apellido: true,
  email: true,
  telefono: true,
  stats: true,
});

export const CategoryClientsResponseSchema = z.object({
  categoria: CategorySchema.pick({
    codCategoria: true,
    nombreCategoria: true,
  }),
  clientes: z.array(CategoryClientSchema),
});
