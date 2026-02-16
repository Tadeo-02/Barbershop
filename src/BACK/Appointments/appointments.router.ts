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
  idParam: "codTurno",
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

// Rutas adicionales específicas para appointments
// Read operations - standard user limiting
router.get(
  "/available/:fechaTurno/:codSucursal",
  userLimiter,
  controller.findByAvailableDate,
);
router.get(
  "/barber/:codBarbero/:fechaTurno",
  userLimiter,
  controller.findByBarberId,
);
router.get("/user/:codUsuario", userLimiter, controller.findByUserId);
router.get("/branch/:codSucursal", userLimiter, controller.findByBranchId);
router.get(
  "/pending/barber/:codBarbero",
  userLimiter,
  controller.findPendingByBarberId,
);
router.get(
  "/pending/branch/:codSucursal",
  userLimiter,
  controller.findPendingByBranchId,
);

// Modification operations - user modification limiting
router.put(
  "/:codTurno/cancel",
  userModificationLimiter,
  standardDeduplication,
  controller.cancelAppointment,
);
router.put(
  "/:codTurno/checkout",
  userModificationLimiter,
  standardDeduplication,
  controller.checkoutAppointment,
);
router.put(
  "/:codTurno/update",
  userModificationLimiter,
  standardDeduplication,
  controller.updateAppointment,
);
router.put(
  "/:codTurno/no-show",
  userModificationLimiter,
  standardDeduplication,
  controller.markAsNoShow,
);

export default router;
