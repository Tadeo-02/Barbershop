import * as controller from "./appointments.controller";
import createRouter from "../base/base.router";
import { Router } from "express";

const router: Router = createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
});

// Rutas adicionales específicas para appointments
router.get(
  "/available/:fechaTurno/:codSucursal",
  controller.findByAvailableDate
);
router.get("/barber/:codBarbero/:fechaTurno", controller.findByBarberId);
router.get("/user/:codUsuario", controller.findByUserId);
router.put("/:codTurno/cancel", controller.cancelAppointment);
router.get("/branch/:codSucursal", controller.findByBranchId);
router.put("/:codTurno/checkout", controller.checkoutAppointment);
router.put("/:codTurno/update", controller.updateAppointment);

export default router;
