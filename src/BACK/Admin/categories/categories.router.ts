import * as controller from "./categories.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codCategoria",
  updatePath: "/update",
});

export default router;
