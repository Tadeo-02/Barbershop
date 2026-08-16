// branches/branches.router.ts
import * as controller from "./branches.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";
import {
  userModificationLimiter,
  userLimiter,
  publicReadLimiter,
} from "../../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../../middleware/deduplication";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/roleMiddleware";

const router: Router = Router();

// GET /all — only admin sees inactive branches
router.get(
  "/all",
  authMiddleware,
  requireRole("admin"),
  userLimiter,
  controller.indexAll,
);

// PATCH deactivate/reactivate — only admin
router.patch(
  "/:codSucursal/deactivate",
  authMiddleware,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  controller.deactivate,
);

router.patch(
  "/:codSucursal/reactivate",
  authMiddleware,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  controller.reactivate,
);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codSucursal",
  updatePath: "/update",
  middleware: {
    // GET / and /:id — public, anyone can see active branches
    read: [publicReadLimiter],

    // POST / — only admin creates branches
    create: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      strictDeduplication,
    ],

    // PUT /:id — only admin edits
    update: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],

    // DELETE /:id — only admin deletes
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
