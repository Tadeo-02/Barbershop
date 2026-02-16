import * as controller from "./typeOfHaircut.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";
import { modificationLimiter } from "../../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../../middleware/deduplication";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codCorte",
  updatePath: "/update",
  middleware: {
    create: [modificationLimiter, strictDeduplication],
    update: [modificationLimiter, standardDeduplication],
    delete: [modificationLimiter, standardDeduplication],
  },
});

export default router;
