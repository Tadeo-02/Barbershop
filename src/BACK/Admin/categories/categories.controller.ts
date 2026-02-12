/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Categories";
import { BaseController } from "../../base/base.controller"; // improtamos al base controller
import type { Request, Response } from "express";
// creamos el modelo de controlador de categorias
class CategoriesController extends BaseController<any> {
  protected model = model;
  protected entityName = "categories";
  protected idFieldName = "codCategoria";

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
      res.status(200).json({
        success: true,
        data: result,
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
        perClient
      );

      res.status(200).json({
        message: "Categoría eliminada correctamente",
        categoria: result.categoria,
        reassignedCount: result.reassignedCount,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
//creamos la instancia del controlador de categorias
const categoriesController = new CategoriesController();
console.log(
  "Categories controller store:",
  typeof categoriesController.store
);
console.log("Categories model:", typeof model.store);
export const { create, store, index, show, edit, update, destroy, listClients } = categoriesController;
