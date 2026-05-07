import * as controller from "./appointments.controller";
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
import { AppointmentSchema } from "../Schemas/appointmentsSchema";

const router: Router = Router();

const codTurnoParamSchema = z.object({ codTurno: z.string().min(1) });
const optionalTurnoParamSchema = z.object({
  codTurno: z.string().optional(),
});
const availableParamsSchema = z.object({
  fechaTurno: z.string().min(1),
  codSucursal: z.string().min(1),
});
const barberParamsSchema = z.object({
  codBarbero: z.string().min(1),
  fechaTurno: z.string().min(1),
});
const userParamsSchema = z.object({ codUsuario: z.string().min(1) });
const branchParamsSchema = z.object({ codSucursal: z.string().min(1) });
const checkoutBodySchema = z.object({
  codCorte: z.string().min(1),
  precioTurno: z.union([z.string(), z.number()]),
  metodoPago: z.string().min(1),
});
const updateAppointmentBodySchema = z.object({
  fechaTurno: z.string().min(1),
  horaDesde: z.string().min(1),
  horaHasta: z.string().min(1),
});

// Apply strict deduplication and rate limiting to appointment creation to prevent double-booking
// Uses user-based rate limiting for authenticated users
router.post(
  "/",
  userModificationLimiter,
  strictDeduplication,
  validateRequest({ body: AppointmentSchema.omit({ codTurno: true }) }),
  controller.store,
);

// Create base router for other CRUD operations
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
  middleware: {
    read: [userLimiter, validateRequest({ params: optionalTurnoParamSchema })],
    create: [
      userModificationLimiter,
      strictDeduplication,
      validateRequest({ body: AppointmentSchema.omit({ codTurno: true }) }),
    ],
    update: [
      userModificationLimiter,
      standardDeduplication,
      validateRequest({
        params: codTurnoParamSchema,
        body: AppointmentSchema.partial(),
      }),
    ],
    delete: [
      userModificationLimiter,
      standardDeduplication,
      validateRequest({ params: codTurnoParamSchema }),
    ],
  },
});

// Merge base routes
router.use(baseRouter);

// Rutas adicionales específicas para appointments
// Read operations - standard user limiting
router.get(
  "/available/:fechaTurno/:codSucursal",
  userLimiter,
  validateRequest({ params: availableParamsSchema }),
  controller.findByAvailableDate,
);
router.get(
  "/barber/:codBarbero/:fechaTurno",
  userLimiter,
  validateRequest({ params: barberParamsSchema }),
  controller.findByBarberId,
);
router.get(
  "/user/:codUsuario",
  userLimiter,
  validateRequest({ params: userParamsSchema }),
  controller.findByUserId,
);
router.get(
  "/branch/:codSucursal",
  userLimiter,
  validateRequest({ params: branchParamsSchema }),
  controller.findByBranchId,
);
router.get(
  "/pending/barber/:codBarbero",
  userLimiter,
  validateRequest({ params: z.object({ codBarbero: z.string().min(1) }) }),
  controller.findPendingByBarberId,
);
router.get(
  "/pending/branch/:codSucursal",
  userLimiter,
  validateRequest({ params: branchParamsSchema }),
  controller.findPendingByBranchId,
);

// Modification operations - user modification limiting
router.put(
  "/:codTurno/cancel",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codTurnoParamSchema }),
  controller.cancelAppointment,
);
router.put(
  "/:codTurno/checkout",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({
    params: codTurnoParamSchema,
    body: checkoutBodySchema,
  }),
  controller.checkoutAppointment,
);
router.put(
  "/:codTurno/update",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({
    params: codTurnoParamSchema,
    body: updateAppointmentBodySchema,
  }),
  controller.updateAppointment,
);
router.put(
  "/:codTurno/no-show",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codTurnoParamSchema }),
  controller.markAsNoShow,
);

export default router;
