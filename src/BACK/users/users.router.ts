import * as controller from "./users.controller";
import createRouter from "../base/base.router";
import { findByIdWithCategory } from "./Users";
import logger from "../lib/logger";
import { RequestHandler, Router } from "express";
import {
  authLimiter,
  sensitiveLimiter,
  userModificationLimiter,
  userLimiter,
} from "../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../middleware/deduplication";
import { validateRequest } from "../middleware/zodValidation";
import { z } from "zod";
import {
  EmailRequestSchema,
  ResetPasswordByTokenSchema,
  TokenValidationSchema,
  UserSchema,
  UserUpdateSchema,
} from "../Schemas/usersSchema";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { csrfProtection } from "../middleware/csrf";
import { CSRF_COOKIE } from "../lib/cookieConfig";

const router: Router = Router();

const codUsuarioParamSchema = z.object({ codUsuario: z.string().min(1) });
const codSucursalParamSchema = z.object({ codSucursal: z.string().min(1) });
const scheduleParamSchema = z.object({
  codSucursal: z.string().min(1),
  fechaTurno: z.string().min(1),
  horaDesde: z.string().min(1),
});
const optionalUserParamSchema = z.object({
  codUsuario: z.string().optional(),
});
const loginRequestSchema = z
  .object({
    email: z.string().email().optional(),
    correo: z.string().email().optional(),
    contraseña: z.string().min(1).optional(),
    clave: z.string().min(1).optional(),
  })
  .refine((data) => data.email || data.correo, {
    message: "Email es requerido",
  })
  .refine((data) => data.contraseña || data.clave, {
    message: "Contraseña es requerida",
  });
const requireAdminForStaffUser: RequestHandler = (req, res, next) => {
  if (!req.body?.cuil && !req.body?.codSucursal) {
    next();
    return;
  }

  csrfProtection(req, res, (csrfError?: unknown) => {
    if (csrfError || res.headersSent) {
      return;
    }

    authMiddleware(req, res, (authError?: unknown) => {
      if (authError) {
        next(authError);
        return;
      }

      requireRole("admin")(req, res, next);
    });
  });
};

// ========================================
// NON-AUTHENTICATED ROUTES (IP-based limiting)
// ========================================

// Login endpoint - IP-based limiting for non-authenticated users
router.post(
  "/login",
  authLimiter,
  strictDeduplication,
  validateRequest({ body: loginRequestSchema }),
  controller.login,
);

// Logout endpoint - clears auth and CSRF cookies
router.post("/logout", controller.logout);

// Refresh endpoint - exchange valid refresh token for new access + refresh tokens
// No authMiddleware or csrfProtection — refresh token possession IS the auth proof.
// Rate-limited to prevent brute-force.
router.post("/refresh", authLimiter, controller.refresh);

// Email verification and password reset endpoints - IP-based limiting
router.post(
  "/email-verification/request",
  sensitiveLimiter,
  strictDeduplication,
  validateRequest({ body: EmailRequestSchema }),
  controller.requestEmailVerification,
);
router.post(
  "/email-verification/confirm",
  sensitiveLimiter,
  strictDeduplication,
  validateRequest({ body: TokenValidationSchema }),
  controller.confirmEmailVerification,
);
router.post(
  "/password-reset/request",
  sensitiveLimiter,
  strictDeduplication,
  validateRequest({ body: EmailRequestSchema }),
  controller.requestPasswordReset,
);
router.post(
  "/password-reset/confirm",
  sensitiveLimiter,
  strictDeduplication,
  validateRequest({ body: ResetPasswordByTokenSchema }),
  controller.resetPasswordWithToken,
);

// User registration - IP-based limiting for non-authenticated users
router.post(
  "/",
  authLimiter,
  requireAdminForStaffUser,
  strictDeduplication,
  validateRequest({ body: UserSchema }),
  controller.store,
);

// ========================================
// AUTHENTICATED ROUTES (User ID-based limiting)
// ========================================

// Read operations - standard user limiting
router.get(
  "/branch/:codSucursal",
  userLimiter,
  validateRequest({ params: codSucursalParamSchema }),
  controller.findByBranchId,
);
router.get(
  "/schedule/:codSucursal/:fechaTurno/:horaDesde",
  userLimiter,
  validateRequest({ params: scheduleParamSchema }),
  controller.findBySchedule,
);

// User profile - standard user limiting
router.get(
  "/profiles/:codUsuario",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userLimiter,
  validateRequest({ params: codUsuarioParamSchema }),
  async (req, res) => {
    try {
      const { codUsuario } = req.params;

      const userWithCategory = await findByIdWithCategory(codUsuario);

      if (req.user?.rol === "client" && req.user.codUsuario !== codUsuario) {
        const isBarber =
          userWithCategory.cuil !== null && userWithCategory.cuil !== "1";
        if (!isBarber) {
          res.status(403).json({
            success: false,
            message: "Acceso denegado",
          });
          return;
        }
      }

      res.json({
        success: true,
        data: userWithCategory,
        csrfToken: req.cookies?.[CSRF_COOKIE] ?? null,
      });
    } catch (error) {
      logger.error({ error }, "Error getting user profile with category");
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
  authMiddleware,
  csrfProtection,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codUsuarioParamSchema }),
  controller.deactivate,
);
router.patch(
  "/:codUsuario/reactivate",
  authMiddleware,
  csrfProtection,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codUsuarioParamSchema }),
  controller.reactivate,
);

// apply base routes (generic GET, POST, PUT, DELETE)
const baseRouter = createRouter(controller, {
  idParam: "codUsuario",
  updatePath: "/update",
  middleware: {
    read: [
      authMiddleware,
      requireRole("admin"),
      validateRequest({ params: optionalUserParamSchema }),
    ],
    create: [validateRequest({ body: UserSchema })],
    update: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      validateRequest({
        params: codUsuarioParamSchema,
        body: UserUpdateSchema,
      }),
    ],
    delete: [
      authMiddleware,
      csrfProtection,
      requireRole("admin"),
      validateRequest({ params: codUsuarioParamSchema }),
    ],
  },
});

// Merge base routes into our router (POST "/" will be overridden by our auth-limited version above)
router.use(baseRouter);

export default router;
