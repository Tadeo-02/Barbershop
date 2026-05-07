import * as model from "./Categories";
import { BaseController } from "../../base/base.controller"; // improtamos al base controller
import type { Request, Response } from "express";
import {
  CategoryClientsResponseSchema,
  CategoryResponseSchema,
} from "../../Schemas/categoriesSchema";
import { sanitizeOutput } from "../../middleware/zodValidation";
// creamos el modelo de controlador de categorias
type CategoryEntity = NonNullable<Awaited<ReturnType<typeof model.findById>>>;
type CategoryCreateArgs = Parameters<typeof model.store>;
type CategoryUpdateArgs = Parameters<typeof model.update> extends [
  string,
  ...infer Rest
]
  ? Rest
  : never;

class CategoriesController extends BaseController<
  CategoryEntity,
  CategoryCreateArgs,
  CategoryUpdateArgs
> {
  protected model = model;
  protected entityName = "categories";
  protected idFieldName = "codCategoria";
  protected responseSchema = CategoryResponseSchema;

  listClients = async (req: Request, res: Response) => {
    const { codCategoria } = req.params;
    if (!codCategoria) {
      res.status(400).json({
        message: "codCategoria es requerido",
      });
      return;
    }
    try {
      const result = await model.listClientsForCategory(codCategoria);
      const safeResult = sanitizeOutput(CategoryClientsResponseSchema, result);
      res.status(200).json({
        success: true,
        data: safeResult,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  destroy = async (req: Request, res: Response) => {
    const { codCategoria } = req.params;
    const { action, perClient } = req.body || {};
    if (!codCategoria) {
      res.status(400).json({
        message: "codCategoria es requerido",
      });
      return;
    }

    try {
      const result = await model.destroyWithClientReassignment(
        codCategoria,
        action,
        perClient,
      );
      const safeCategoria = sanitizeOutput(
        CategoryResponseSchema,
        result.categoria,
      );

      res.status(200).json({
        message: "Categoría eliminada correctamente",
        categoria: safeCategoria,
        reassignedCount: result.reassignedCount,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
//creamos la instancia del controlador de categorias
const categoriesController = new CategoriesController();
console.log("Categories controller store:", typeof categoriesController.store);
console.log("Categories model:", typeof model.store);
export const {
  create,
  store,
  index,
  show,
  edit,
  update,
  destroy,
  listClients,
} = categoriesController;
