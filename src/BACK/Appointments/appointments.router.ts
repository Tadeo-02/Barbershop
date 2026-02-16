import * as controller from "./appointments.controller";
import createRouter from "../base/base.router";
import { Router } from "express";
import { modificationLimiter } from "../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../middleware/deduplication";

const router: Router = Router();

// Apply strict deduplication and rate limiting to appointment creation to prevent double-booking
router.post("/", modificationLimiter, strictDeduplication, controller.store);

// Create base router for other CRUD operations
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
  middleware: {
    create: [modificationLimiter, strictDeduplication],
    update: [modificationLimiter, standardDeduplication],
    delete: [modificationLimiter, standardDeduplication],
  },
});

// Merge base routes
router.use(baseRouter);

// Rutas adicionales específicas para appointments
router.get(
  "/available/:fechaTurno/:codSucursal",
  controller.findByAvailableDate,
);
router.get("/barber/:codBarbero/:fechaTurno", controller.findByBarberId);
router.get("/user/:codUsuario", controller.findByUserId);
router.put(
  "/:codTurno/cancel",
  modificationLimiter,
  standardDeduplication,
  controller.cancelAppointment,
);
router.get("/branch/:codSucursal", controller.findByBranchId);
router.put(
  "/:codTurno/checkout",
  modificationLimiter,
  standardDeduplication,
  controller.checkoutAppointment,
);
router.put(
  "/:codTurno/update",
  modificationLimiter,
  standardDeduplication,
  controller.updateAppointment,
);
router.put(
  "/:codTurno/no-show",
  modificationLimiter,
  standardDeduplication,
  controller.markAsNoShow,
);
router.get("/pending/barber/:codBarbero", controller.findPendingByBarberId);
router.get("/pending/branch/:codSucursal", controller.findPendingByBranchId);

export default router;
