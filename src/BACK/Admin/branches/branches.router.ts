import * as controller from "./branches.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";
import {
  userModificationLimiter,
  userLimiter,
} from "../../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../../middleware/deduplication";
import { authenticateToken } from "../../middleware/auth";
const router: Router = Router();

// Read operations - standard user limiting
router.get("/all", authenticateToken, userLimiter, controller.indexAll);

// Apply security to state changes (deactivate/reactivate)
// Uses user-based rate limiting for authenticated admin operations
router.patch(
  "/:codSucursal/deactivate",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.deactivate,
);
router.patch(
  "/:codSucursal/reactivate",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.reactivate,
);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codSucursal",
  updatePath: "/update",
  middleware: {
    read: [authenticateToken, userLimiter],
    create: [authenticateToken, userModificationLimiter, strictDeduplication],
    update: [authenticateToken, userModificationLimiter, standardDeduplication],
    delete: [authenticateToken, userModificationLimiter, standardDeduplication],
  },
});

router.use(baseRouter);

export default router;
