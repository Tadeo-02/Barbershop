/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Appointments";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
// creamos la clase barberController para enviar y manejar el base
class AppointmentsController extends BaseController<any> {
  protected model = model;
  protected entityName = "appointments";
  protected idFieldName = "codTurno";
}

const appointmentsController = new AppointmentsController();

export const { create, store, index, show, edit, update, destroy } = appointmentsController;