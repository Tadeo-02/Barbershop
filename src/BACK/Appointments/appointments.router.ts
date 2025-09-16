import * as controller from "./appointments.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
});
