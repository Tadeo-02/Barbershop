/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Users";
import { BaseController } from "../base/base.controller";

// Crear la clase UsersController para manejar usuarios normales
class UsersController extends BaseController<any> {
  protected model = model;
  protected entityName = "usuario";
  protected idFieldName = "codUsuario";
}

const usersController = new UsersController();

export const { create, store, index, show, edit, update, destroy } =
  usersController;
