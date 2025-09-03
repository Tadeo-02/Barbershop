/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Barbers";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
// creamos la clase barberController para enviar y manejar el base
class BarbersController extends BaseController<any> {
  protected model = model;
  protected entityName = "barbers";
  protected idFieldName = "codUsuario";
}

const barbersController = new BarbersController();

export const { create, store, index, show, edit, update, destroy } = barbersController;