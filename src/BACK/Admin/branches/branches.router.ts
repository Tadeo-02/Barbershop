import * as controller from "./branches.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codSucursal",
  updatePath: "/update",
});

export default router;
