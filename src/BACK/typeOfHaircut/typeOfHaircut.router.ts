import * as controller from "./typeOfHaircut.controller";
import { createRouter } from "../base/base.router";

export default createRouter(controller, {
  create: "/create",
  idParam: "codCorte",
  updatePath: "/update",
});
