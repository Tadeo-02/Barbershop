import * as controller from "./branches.controller";
import { createRouter } from "../../base/base.router";

export default createRouter(controller, {
  create: "/create", //? estas rutas se pueden generalizar, salvo el ID
  idParam: "codSucursal",
  updatePath: "/update",
});
