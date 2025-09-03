import * as controller from "./categories.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create", //? estas rutas se pueden generalizar, salvo el ID
  idParam: "codCategoria",
  updatePath: "/update",
});
