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
import { authenticateToken } from "../../middleware/auth";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codCorte",
  updatePath: "/update",
  middleware: {
    read: [authenticateToken, userLimiter],
    create: [authenticateToken, userModificationLimiter, strictDeduplication],
    update: [authenticateToken, userModificationLimiter, standardDeduplication],
    delete: [authenticateToken, userModificationLimiter, standardDeduplication],
  },
});

export default router;
