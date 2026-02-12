/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Branches";
import type { Request, Response } from "express";
import { BaseController } from "../../base/base.controller"; // improtamos al base controller
// creamos el modelo de controlador de sucursales
class BranchesController extends BaseController<any> {
  protected model: typeof model = model;
  protected entityName = "sucursales";
  protected idFieldName = "codSucursal";

  indexAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const entities = await this.model.findAllIncludingInactive();
      res.status(200).json(entities);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  reactivate = async (req: Request, res: Response): Promise<void> => {
    const id = req.params[this.idFieldName];
    try {
      const result = await this.model.reactivate(id);
      res.status(200).json({
        message: `${this.entityName} reactivado correctamente`,
        [this.entityName]: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
//creamos la instancia del controlador de sucursales
const branchesController = new BranchesController();
console.log(
  "Branches controller store:",
  typeof branchesController.store
);
console.log("Branches model:", typeof model.store);
export const { create, store, index, show, edit, update, destroy } = branchesController;
export const deactivate = branchesController.destroy.bind(branchesController);
export const { indexAll, reactivate } = branchesController;