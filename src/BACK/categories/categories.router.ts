import * as controller from "./categories.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create",
  idParam: "codCategoria",
  updatePath: "/update",
});
