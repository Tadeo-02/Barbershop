import * as controller from "./categories.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";

const router: Router = Router();

// Rutas específicas deben ir antes de las rutas genéricas
router.get("/:codCategoria/clients", controller.listClients);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codCategoria",
  updatePath: "/update",
});

router.use(baseRouter);

export default router;
