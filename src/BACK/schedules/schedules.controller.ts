/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Schedules";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
// creamos la clase schedulesController para enviar y manejar el base
class SchedulesController extends BaseController<any> {
  protected model = model;
  protected entityName = "schedules";
  protected idFieldName = "codHorario";
}

const schedulesController = new SchedulesController();

export const { create, store, index, show, edit, update, destroy } =
  schedulesController;
