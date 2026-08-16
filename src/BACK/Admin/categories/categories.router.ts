import * as controller from "./categories.controller";
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
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/roleMiddleware";

const router: Router = Router();

// Specific routes must come before generic routes.
// Read operations - standard user limiting
router.get(
  "/:codCategoria/clients",
  authMiddleware,
  requireRole("admin"),
  userLimiter,
  controller.listClients,
);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codCategoria",
  updatePath: "/update",
  middleware: {
    read: [userLimiter],
    create: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      strictDeduplication,
    ],
    update: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],
    delete: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],
  },
});

router.use(baseRouter);

export default router;
