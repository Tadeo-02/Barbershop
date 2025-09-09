import * as controller from "./users.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
});
