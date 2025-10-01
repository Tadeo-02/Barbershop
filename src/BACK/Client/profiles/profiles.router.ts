import * as controller from "./profiles.controller";
import { createRouter } from "../../base/base.router";
import { Router } from "express";

const router: Router = createRouter(controller, {
  create: "/show",
  idParam: "codUsuario",
  updatePath: "/update",
});

// Rutas específicas para users
router.post("/login", controller.login);
router.get("/:codUsuario", controller.findByUserId); // Esta es la ruta correcta para obtener perfil

export default router;
