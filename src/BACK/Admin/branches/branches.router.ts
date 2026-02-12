import * as controller from "./branches.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";

const router: Router = Router();

router.get("/all", controller.indexAll);
router.patch("/:codSucursal/deactivate", controller.deactivate);
router.patch("/:codSucursal/reactivate", controller.reactivate);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codSucursal",
  updatePath: "/update",
});

router.use(baseRouter);

export default router;
