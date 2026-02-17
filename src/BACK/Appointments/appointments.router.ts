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
import { authenticateToken } from "../middleware/auth";
const router: Router = Router();

// Apply strict deduplication and rate limiting to appointment creation to prevent double-booking
// Uses user-based rate limiting for authenticated users
router.post(
  "/",
  authenticateToken,
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
    read: [authenticateToken, userLimiter],
    create: [authenticateToken, userModificationLimiter, strictDeduplication],
    update: [authenticateToken, userModificationLimiter, standardDeduplication],
    delete: [authenticateToken, userModificationLimiter, standardDeduplication],
  },
});

// Merge base routes
router.use(baseRouter);

// Rutas adicionales específicas para appointments
// Read operations - standard user limiting
router.get(
  "/available/:fechaTurno/:codSucursal",
  authenticateToken,
  userLimiter,
  controller.findByAvailableDate,
);
router.get(
  "/barber/:codBarbero/:fechaTurno",
  authenticateToken,
  userLimiter,
  controller.findByBarberId,
);
router.get(
  "/user/:codUsuario",
  authenticateToken,
  userLimiter,
  controller.findByUserId,
);
router.get(
  "/branch/:codSucursal",
  authenticateToken,
  userLimiter,
  controller.findByBranchId,
);
router.get(
  "/pending/barber/:codBarbero",
  authenticateToken,
  userLimiter,
  controller.findPendingByBarberId,
);
router.get(
  "/pending/branch/:codSucursal",
  authenticateToken,
  userLimiter,
  controller.findPendingByBranchId,
);

// Modification operations - user modification limiting
router.put(
  "/:codTurno/cancel",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.cancelAppointment,
);
router.put(
  "/:codTurno/checkout",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.checkoutAppointment,
);
router.put(
  "/:codTurno/update",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.updateAppointment,
);
router.put(
  "/:codTurno/no-show",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.markAsNoShow,
);

export default router;
