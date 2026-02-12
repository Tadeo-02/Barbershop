import * as controller from "./users.controller";
import createRouter from "../base/base.router";
import { findByIdWithCategory } from "./Users";
import { Router } from "express";

const router: Router = Router();

// Rutas específicas PRIMERO (antes de createRouter) para evitar conflictos
router.post("/login", controller.login);
router.get("/branch/:codSucursal", controller.findByBranchId);
router.get(
  "/schedule/:codSucursal/:fechaTurno/:horaDesde",
  controller.findBySchedule
);

// Rutas con parámetros específicos (deben ir antes de las rutas genéricas con :codUsuario)
router.patch("/:codUsuario/reactivate", controller.reactivate);
router.patch("/:codUsuario/security-question", controller.updateSecurityQuestion);
router.get("/security-question/:email", controller.getSecurityQuestion);
router.post("/verify-security-answer", controller.verifySecurityAnswer);

// Agregar esta nueva ruta
router.get("/profiles/:codUsuario", async (req, res) => {
  try {
    const { codUsuario } = req.params;

    const userWithCategory = await findByIdWithCategory(codUsuario);

    res.json({
      success: true,
      data: userWithCategory,
    });
  } catch (error) {
    console.error("Error getting user profile with category:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Error interno del servidor",
    });
  }
});

// Ahora aplicamos las rutas base (GET, POST, PUT, DELETE genéricas)
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
});

// Merge base routes into our router
router.use(baseRouter);

export default router;
