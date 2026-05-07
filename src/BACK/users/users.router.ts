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
import { validateRequest } from "../middleware/zodValidation";
import { z } from "zod";
import { UserSchema, UserUpdateSchema } from "../Schemas/usersSchema";

const router: Router = Router();

const codUsuarioParamSchema = z.object({ codUsuario: z.string().min(1) });
const codSucursalParamSchema = z.object({ codSucursal: z.string().min(1) });
const scheduleParamSchema = z.object({
  codSucursal: z.string().min(1),
  fechaTurno: z.string().min(1),
  horaDesde: z.string().min(1),
});
const emailParamSchema = z.object({ email: z.string().email() });
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
const securityQuestionBodySchema = z.object({
  preguntaSeguridad: z.string().min(1),
  respuestaSeguridad: z.string().min(1),
});
const verifySecurityAnswerSchema = z.object({
  email: z.string().email(),
  respuestaSeguridad: z.string().min(1),
  nuevaContraseña: z.string().min(1).optional(),
});
const resetPasswordSchema = z.object({
  email: z.string().email(),
  respuestaSeguridad: z.string().min(1),
  nuevaContraseña: z.string().min(1),
});

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

// Password reset endpoints - IP-based limiting (users not authenticated yet)
router.get(
  "/security-question/:email",
  sensitiveLimiter,
  validateRequest({ params: emailParamSchema }),
  controller.getSecurityQuestion,
);
router.post(
  "/verify-security-answer",
  sensitiveLimiter,
  strictDeduplication,
  validateRequest({ body: verifySecurityAnswerSchema }),
  controller.verifySecurityAnswer,
);
// Dedicated password-reset endpoint (separate rate-limit bucket from answer verification)
router.post(
  "/reset-password",
  sensitiveLimiter,
  strictDeduplication,
  validateRequest({ body: resetPasswordSchema }),
  controller.resetPassword,
);

// User registration - IP-based limiting for non-authenticated users
router.post(
  "/",
  authLimiter,
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
  userLimiter,
  validateRequest({ params: codUsuarioParamSchema }),
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
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codUsuarioParamSchema }),
  controller.deactivate,
);
router.patch(
  "/:codUsuario/reactivate",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codUsuarioParamSchema }),
  controller.reactivate,
);

// Security question update - sensitive operation for authenticated users
router.patch(
  "/:codUsuario/security-question",
  userSensitiveLimiter,
  strictDeduplication,
  validateRequest({
    params: codUsuarioParamSchema,
    body: securityQuestionBodySchema,
  }),
  controller.updateSecurityQuestion,
);

// Ahora aplicamos las rutas base (GET, POST, PUT, DELETE genéricas)
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
  middleware: {
    read: [validateRequest({ params: optionalUserParamSchema })],
    create: [validateRequest({ body: UserSchema })],
    update: [
      validateRequest({ params: codUsuarioParamSchema, body: UserUpdateSchema }),
    ],
    delete: [validateRequest({ params: codUsuarioParamSchema })],
  },
});

// Merge base routes into our router (POST "/" will be overridden by our auth-limited version above)
router.use(baseRouter);

export default router;
