/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Categories";
import { BaseController } from "../base/base.controller";

class CategoriesController extends BaseController<any> {
  protected model = model;
  protected entityName = "categories";
  protected idFieldName = "codCategoria";
}

const categoriesController = new CategoriesController();
console.log(
  "🔍 Categories controller store:",
  typeof categoriesController.store
);
console.log("🔍 Categories model:", typeof model.store);
export const { create, store, index, show, edit, update, destroy } = categoriesController;