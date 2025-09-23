/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Branches";
import { BaseController } from "../../base/base.controller"; // improtamos al base controller
// creamos el modelo de controlador de sucursales
class BranchesController extends BaseController<any> {
  protected model = model;
  protected entityName = "sucursales";
  protected idFieldName = "codSucursal";
}
//creamos la instancia del controlador de sucursales
const branchesController = new BranchesController();
console.log(
  "Branches controller store:",
  typeof branchesController.store
);
console.log("Branches model:", typeof model.store);
export const { create, store, index, show, edit, update, destroy } = branchesController;