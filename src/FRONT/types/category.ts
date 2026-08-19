import { z } from "zod";
import { CategoryResponseSchema } from "../../BACK/Schemas/categoriesSchema";

export type Category = z.infer<typeof CategoryResponseSchema>;

export interface CategorySummary {
  codCategoria: string;
  nombreCategoria: string;
  descCategoria: string;
  descuentoCorte: number;
  descuentoProducto: number;
  fechaInicio?: string | Date;
}
