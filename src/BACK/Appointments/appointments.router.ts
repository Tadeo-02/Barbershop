import * as controller from "./appointments.controller";
import { createRouter } from "../base/base.router";

const router = createRouter(controller, {
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
router.get("/client/:codCliente", controller.findByClientId);

export default router;
