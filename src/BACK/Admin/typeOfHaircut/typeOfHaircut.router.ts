import * as controller from "./typeOfHaircut.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codCorte",
  updatePath: "/update",
});

export default router;
