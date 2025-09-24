import * as controller from "./schedules.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create",
  idParam: "codHorario",
  updatePath: "/update",
});