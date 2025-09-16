/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Turns";
import { BaseController } from "../../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
// creamos la clase barberController para enviar y manejar el base
class TurnsController extends BaseController<any> {
  protected model = model;
  protected entityName = "turns";
  protected idFieldName = "codTurno";
}

const turnsController = new TurnsController();

export const { create, store, index, show, edit, update, destroy } = turnsController;