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

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codCorte",
  updatePath: "/update",
  middleware: {
    read: [userLimiter],
    create: [userModificationLimiter, strictDeduplication],
    update: [userModificationLimiter, standardDeduplication],
    delete: [userModificationLimiter, standardDeduplication],
  },
});

export default router;
