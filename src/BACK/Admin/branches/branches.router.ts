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
import { csrfProtection } from "../../middleware/csrf";
import { requireRole } from "../../middleware/roleMiddleware";
import { validateRequest } from "../../middleware/zodValidation";
import { z } from "zod";

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
  csrfProtection,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  controller.deactivate,
);

router.patch(
  "/:codSucursal/reactivate",
  authMiddleware,
  csrfProtection,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  controller.reactivate,
);

const rentabilityQuerySchema = z.object({
  month: z.string().regex(/^\d+$/, "month must be a numeric string"),
  year: z.string().regex(/^\d+$/, "year must be a numeric string"),
});

router.get(
  "/rentability",
  authMiddleware,
  requireRole("admin"),
  userLimiter,
  validateRequest({ query: rentabilityQuerySchema }),
  controller.getRevenueByBranch,
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
      csrfProtection,
      requireRole("admin"),
      userModificationLimiter,
      strictDeduplication,
    ],

    // PUT /:id — only admin edits
    update: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],

    // DELETE /:id — only admin deletes
    delete: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],
  },
});

router.use(baseRouter);
export default router;
