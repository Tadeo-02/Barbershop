import * as controller from "./schedules.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create", //? estas rutas se pueden generalizar, salvo el ID
  idParam: "codHorario",
  updatePath: "/update",
});