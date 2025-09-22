import * as controller from "./users.controller";
import { createRouter } from "../base/base.router";

const router = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
});

// Agregar ruta específica para login
router.post("/login", controller.login);

export default router;
