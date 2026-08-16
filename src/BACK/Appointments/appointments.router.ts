//hay algunas cosas que dice que las hace el barbero y el admin pero despues no se implementan asi

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
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
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


router.post(
  "/",
  authMiddleware,
  requireRole("client", "admin"), 
  userModificationLimiter,
  strictDeduplication,
  validateRequest({ body: AppointmentSchema.omit({ codTurno: true }) }),
  controller.store,
);

// ─── BASE ROUTER (generic ABM) ─────────────────────────────────────────────
// The baseRouter index/show is not used in production for appointments
// (the specific routes below are used instead), but they are protected as well.

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
  middleware: {
    read: [
      authMiddleware,
      requireRole("barber", "admin"), // only staff sees generic list
      userLimiter,
      validateRequest({ params: optionalTurnoParamSchema }),
    ],
    create: [
      authMiddleware,
      requireRole("client", "admin"),
      userModificationLimiter,
      strictDeduplication,
      validateRequest({ body: AppointmentSchema.omit({ codTurno: true }) }),
    ],
    update: [
      authMiddleware,
      requireRole("barber", "admin"),
      userModificationLimiter,
      standardDeduplication,
      validateRequest({
        params: codTurnoParamSchema,
        body: AppointmentSchema.partial(),
      }),
    ],
    delete: [
      authMiddleware,
      requireRole("admin"), // only admin can delete physically
      userModificationLimiter,
      standardDeduplication,
      validateRequest({ params: codTurnoParamSchema }),
    ],
  },
});

router.use(baseRouter);

// ─── AVAILABILITY QUERIES ────────────────────────────────────────────────────
// Public with rate limiting: anyone needs to see available time slots
// (even before logging in to decide whether to book an appointment)

router.get(
  "/available/:fechaTurno/:codSucursal",
  userLimiter,
  validateRequest({ params: availableParamsSchema }),
  controller.findByAvailableDate,
);

// ─── CUSTOMER QUERIES ────────────────────────────────────────────────────────
// A customer can only view THEIR appointments — ownership validation is handled in the controller.
router.get(
  "/user/:codUsuario",
  authMiddleware,
  requireRole("client", "admin"),
  userLimiter,
  validateRequest({ params: userParamsSchema }),
  controller.findByUserId,
);

// ─── BARBER QUERIES ────────────────────────────────────────────────────────────
router.get(
  "/barber/:codBarbero/:fechaTurno",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userLimiter,
  validateRequest({ params: barberParamsSchema }),
  controller.findByBarberId,
);

router.get(
  "/pending/barber/:codBarbero",
  authMiddleware,
  requireRole("barber", "admin"),
  userLimiter,
  validateRequest({ params: z.object({ codBarbero: z.string().min(1) }) }),
  controller.findPendingByBarberId,
);

// ─── BRANCH QUERIES (STAFF) ───────────────────────────────────────────
router.get(
  "/branch/:codSucursal",
  authMiddleware,
  requireRole("barber", "admin"),
  userLimiter,
  validateRequest({ params: branchParamsSchema }),
  controller.findByBranchId,
);

router.get(
  "/pending/branch/:codSucursal",
  authMiddleware,
  requireRole("barber", "admin"),
  userLimiter,
  validateRequest({ params: branchParamsSchema }),
  controller.findPendingByBranchId,
);

// ─── STATE'S UPDATES ────────────────────────────────────────────────
// Cancel: client cancels their own, barber/admin can cancel any
router.put(
  "/:codTurno/cancel",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codTurnoParamSchema }),
  controller.cancelAppointment,
);

// Checkout: only the barber who attended or admin close the appointment with payment
router.put(
  "/:codTurno/checkout",
  authMiddleware,
  requireRole("barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({
    params: codTurnoParamSchema,
    body: checkoutBodySchema,
  }),
  controller.checkoutAppointment,
);

// Reschedule: the customer can move their appointment; barber/admin can as well.
router.put(
  "/:codTurno/update",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({
    params: codTurnoParamSchema,
    body: updateAppointmentBodySchema,
  }),
  controller.updateAppointment,
);

// No-show: only the barber or admin can mark an absence.
router.put(
  "/:codTurno/no-show",
  authMiddleware,
  requireRole("barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codTurnoParamSchema }),
  controller.markAsNoShow,
);

export default router;
