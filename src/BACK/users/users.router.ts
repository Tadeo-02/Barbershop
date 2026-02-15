import * as controller from "./users.controller";
import createRouter from "../base/base.router";
import { findByIdWithCategory } from "./Users";
import { Router } from "express";
import { authLimiter, sensitiveLimiter } from "../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../middleware/deduplication";

const router: Router = Router();

// Rutas específicas PRIMERO (antes de createRouter) para evitar conflictos
// Apply strict auth limiter to login (with deduplication to prevent multiple clicks)
router.post("/login", authLimiter, standardDeduplication, controller.login);
router.get("/branch/:codSucursal", controller.findByBranchId);
router.get(
  "/schedule/:codSucursal/:fechaTurno/:horaDesde",
  controller.findBySchedule,
);

// Rutas con parámetros específicos (deben ir antes de las rutas genéricas con :codUsuario)
router.patch(
  "/:codUsuario/deactivate",
  standardDeduplication,
  controller.deactivate,
);
router.patch(
  "/:codUsuario/reactivate",
  standardDeduplication,
  controller.reactivate,
);
router.patch(
  "/:codUsuario/security-question",
  strictDeduplication,
  controller.updateSecurityQuestion,
);
// Apply sensitive limiter to security question operations
router.get(
  "/security-question/:email",
  sensitiveLimiter,
  controller.getSecurityQuestion,
);
router.post(
  "/verify-security-answer",
  sensitiveLimiter,
  strictDeduplication,
  controller.verifySecurityAnswer,
);

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

// Apply auth limiter and strict deduplication to user creation (registration)
// Strict deduplication prevents duplicate registrations when user clicks multiple times
router.post("/", authLimiter, strictDeduplication, controller.store);

// Ahora aplicamos las rutas base (GET, POST, PUT, DELETE genéricas)
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
});

// Merge base routes into our router (POST "/" will be overridden by our auth-limited version above)
router.use(baseRouter);

export default router;
