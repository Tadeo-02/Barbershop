import * as controller from "./typeOfHaircut.controller";
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
import { csrfProtection } from "../../middleware/csrf";
import { requireRole } from "../../middleware/roleMiddleware";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codCorte",
  updatePath: "/update",
  middleware: {
    read: [userLimiter],
    create: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      userModificationLimiter,
      strictDeduplication,
    ],
    update: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],
    delete: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],
  },
});

export default router;
