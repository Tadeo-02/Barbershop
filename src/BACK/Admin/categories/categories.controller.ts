/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Categories";
import { BaseController } from "../../base/base.controller"; // improtamos al base controller
// creamos el modelo de controlador de categorias
class CategoriesController extends BaseController<any> {
  protected model = model;
  protected entityName = "categories";
  protected idFieldName = "codCategoria";
}
//creamos la instancia del controlador de categorias
const categoriesController = new CategoriesController();
console.log(
  "Categories controller store:",
  typeof categoriesController.store
);
console.log("Categories model:", typeof model.store);
export const { create, store, index, show, edit, update, destroy } = categoriesController;