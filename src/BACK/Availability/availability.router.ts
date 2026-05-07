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
import { validateRequest } from "../middleware/zodValidation";
import { z } from "zod";
import { AvailabilitySchema } from "../Schemas/availabilitySchema";

const router: Router = Router();

const codBloqueoParamSchema = z.object({ codBloqueo: z.string().min(1) });
const optionalCodBloqueoSchema = z.object({
  codBloqueo: z.string().optional(),
});

// Apply strict deduplication and rate limiting to appointment creation to prevent double-booking
// Uses user-based rate limiting for authenticated users
router.post(
  "/",
  userModificationLimiter,
  strictDeduplication,
  validateRequest({ body: AvailabilitySchema.omit({ codBloqueo: true }) }),
  controller.store,
);

// Create base router for other CRUD operations
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codBloqueo",
  updatePath: "/update",
  middleware: {
    read: [userLimiter, validateRequest({ params: optionalCodBloqueoSchema })],
    create: [
      userModificationLimiter,
      strictDeduplication,
      validateRequest({ body: AvailabilitySchema.omit({ codBloqueo: true }) }),
    ],
    update: [
      userModificationLimiter,
      standardDeduplication,
      validateRequest({
        params: codBloqueoParamSchema,
        body: AvailabilitySchema.omit({ codBloqueo: true }),
      }),
    ],
    delete: [
      userModificationLimiter,
      standardDeduplication,
      validateRequest({ params: codBloqueoParamSchema }),
    ],
  },
});

// Merge base routes
router.use(baseRouter);

export default router;
