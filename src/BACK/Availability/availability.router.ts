import * as controller from "./availability.controller";
import createRouter from "../base/base.router";
import { Router } from "express";
import {
  userModificationLimiter,
  userLimiter,
} from "../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../middleware/deduplication";

const router: Router = Router();

// Apply strict deduplication and rate limiting to appointment creation to prevent double-booking
// Uses user-based rate limiting for authenticated users
router.post(
  "/",
  userModificationLimiter,
  strictDeduplication,
  controller.store,
);

// Create base router for other CRUD operations
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codBloqueo",
  updatePath: "/update",
  middleware: {
    read: [userLimiter],
    create: [userModificationLimiter, strictDeduplication],
    update: [userModificationLimiter, standardDeduplication],
    delete: [userModificationLimiter, standardDeduplication],
  },
});

// Merge base routes
router.use(baseRouter);