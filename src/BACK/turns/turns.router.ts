import * as controller from "./turns.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
});
