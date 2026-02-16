import * as controller from "./branches.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";
import { modificationLimiter } from "../../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../../middleware/deduplication";

const router: Router = Router();

router.get("/all", controller.indexAll);

// Apply security to state changes (deactivate/reactivate)
router.patch(
  "/:codSucursal/deactivate",
  modificationLimiter,
  standardDeduplication,
  controller.deactivate,
);
router.patch(
  "/:codSucursal/reactivate",
  modificationLimiter,
  standardDeduplication,
  controller.reactivate,
);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codSucursal",
  updatePath: "/update",
  middleware: {
    create: [modificationLimiter, strictDeduplication],
    update: [modificationLimiter, standardDeduplication],
    delete: [modificationLimiter, standardDeduplication],
  },
});

router.use(baseRouter);

export default router;
