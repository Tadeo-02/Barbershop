import * as controller from "./users.controller";
import createRouter from "../base/base.router";
import { findByIdWithCategory } from "./Users";
import { Router } from "express";
import {
  authLimiter,
  sensitiveLimiter,
  userModificationLimiter,
  userSensitiveLimiter,
  userLimiter,
} from "../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../middleware/deduplication";
import { authenticateToken } from "../middleware/auth";

const router: Router = Router();

// ========================================
// NON-AUTHENTICATED ROUTES (IP-based limiting)
// ========================================

// Login endpoint - IP-based limiting for non-authenticated users
router.post("/login", authLimiter, strictDeduplication, controller.login);

// Refresh token endpoint - IP-based limiting
router.post(
  "/refresh",
  authLimiter,
  strictDeduplication,
  controller.refreshAccessToken,
);

// Logout endpoint - doesn't require auth (client sends refresh token to blacklist)
router.post("/logout", strictDeduplication, controller.logout);

// Logout from all devices - requires authentication
router.post(
  "/logout-all",
  authenticateToken,
  strictDeduplication,
  controller.logoutAll,
);

// Password reset endpoints - IP-based limiting (users not authenticated yet)
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

// User registration - IP-based limiting for non-authenticated users
router.post("/", authLimiter, strictDeduplication, controller.store);

// ========================================
// AUTHENTICATED ROUTES (User ID-based limiting)
// ========================================

// Read operations - standard user limiting
router.get(
  "/branch/:codSucursal",
  authenticateToken,
  userLimiter,
  controller.findByBranchId,
);
router.get(
  "/schedule/:codSucursal/:fechaTurno/:horaDesde",
  authenticateToken,
  userLimiter,
  controller.findBySchedule,
);

// User profile - standard user limiting
router.get(
  "/profiles/:codUsuario",
  authenticateToken,
  userLimiter,
  async (req, res) => {
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
  },
);

// Account modification operations - user modification limiting
router.patch(
  "/:codUsuario/deactivate",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.deactivate,
);
router.patch(
  "/:codUsuario/reactivate",
  authenticateToken,
  userModificationLimiter,
  standardDeduplication,
  controller.reactivate,
);

// Security question update - sensitive operation for authenticated users
router.patch(
  "/:codUsuario/security-question",
  authenticateToken,
  userSensitiveLimiter,
  strictDeduplication,
  controller.updateSecurityQuestion,
);

// Ahora aplicamos las rutas base (GET, POST, PUT, DELETE genéricas)
// All base routes require authentication
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
  middleware: {
    read: [authenticateToken, userLimiter],
    create: [authenticateToken, userModificationLimiter, strictDeduplication],
    update: [authenticateToken, userModificationLimiter, standardDeduplication],
    delete: [authenticateToken, userModificationLimiter, standardDeduplication],
  },
});

// Merge base routes into our router (POST "/" will be overridden by our auth-limited version above)
router.use(baseRouter);

export default router;
