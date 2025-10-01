import * as controller from "./users.controller";
import { createRouter } from "../base/base.router";

const router = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
});

// Rutas específicas para users
router.post("/login", controller.login);
router.get("/branch/:codSucursal", controller.findByBranchId);

export default router;
