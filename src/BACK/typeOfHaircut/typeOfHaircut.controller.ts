/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./typeOfHaircut";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
// creamos la clase barberController para enviar y manejar el base
class TypeOfHaircutController extends BaseController<any> {
  protected model = model;
  protected entityName = "typeOfHaircut";
  protected idFieldName = "codCorte";
}

const typeOfHaircutController = new TypeOfHaircutController();

export const { create, store, index, show, edit, update, destroy } =
  typeOfHaircutController;
