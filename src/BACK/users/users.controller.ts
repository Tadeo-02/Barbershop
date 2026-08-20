import * as model from "./Users";
import { BaseController } from "../base/base.controller";
import logger from "../lib/logger";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { sanitizeOutput } from "../middleware/zodValidation";
import { deriveRole } from "../lib/roles";
import {
  AUTH_COOKIE,
  CSRF_COOKIE,
  authCookieOptions,
  csrfCookieOptions,
  clearCookieOptions,
  clearCsrfCookieOptions,
} from "../lib/cookieConfig";
import {
  BarberResponseSchema,
  type UserResponse,
  UserResponseSchema,
} from "../Schemas/usersSchema";
import {
  createErrorResponse,
  createValidationErrorResponse,
  getErrorMessage,
} from "../lib/backendResponse";
import {
  buildResetPasswordEmail,
  buildVerificationEmail,
  sendMail,
} from "../lib/mailer";

const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

type UserEntity = NonNullable<Awaited<ReturnType<typeof model.findById>>>;
type UserCreateArgs = Parameters<typeof model.store>;
type UserUpdateArgs =
  Parameters<typeof model.update> extends [string, ...infer Rest]
    ? Rest
    : never;

const getAppBaseUrl = () =>
  process.env.FRONTEND_URL || process.env.APP_BASE_URL || "http://localhost:5173";

class UsersController extends BaseController<
  UserEntity,
  UserCreateArgs,
  UserUpdateArgs
> {
  protected model = model;
  protected entityName = "usuario";
  protected idFieldName = "codUsuario";
  protected responseSchema = UserResponseSchema;

  index = async (req: Request, res: Response): Promise<void> => {
    try {
      const userType = req.query.type as "client" | "barber" | undefined;
      const entities = await model.findAll(userType);
      const safeEntities = sanitizeOutput(UserResponseSchema, entities);
      res.status(200).json(safeEntities);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  store = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.debug({ body: req.body }, "store endpoint called");
      const {
        dni,
        nombre,
        apellido,
        telefono,
        email,
        contraseña,
        cuil,
        codSucursal,
      } = req.body;

      if (cuil && !codSucursal) {
        res.status(400).json({
          message: "Los barberos deben tener una sucursal asignada",
        });
        return;
      }

      const newUser = await model.store(
        dni,
        nombre,
        apellido,
        telefono,
        email,
        contraseña,
        cuil,
        codSucursal,
      );

      const userType = cuil ? "barbero" : "cliente";
      const safeUser = sanitizeOutput(UserResponseSchema, newUser);

      const verificationPayload = await model.createEmailVerificationTokenByUserId(
        newUser.codUsuario,
      );

      if (verificationPayload) {
        const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(
          verificationPayload.token,
        )}`;
        const emailContent = buildVerificationEmail(
          verificationPayload.name,
          verificationUrl,
        );
        await sendMail({
          to: verificationPayload.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
      }

      res.status(201).json({
        message: `${
          userType.charAt(0).toUpperCase() + userType.slice(1)
        } creado exitosamente. Revisa tu email para verificar tu cuenta.`,
        user: safeUser,
      });
    } catch (error) {
      logger.error({ error }, "Error creating user");
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { codUsuario } = req.params;

      const {
        dni,
        nombre,
        apellido,
        telefono,
        email,
        contraseña,
        cuil,
        codSucursal,
      } = req.body;

      if (cuil && !codSucursal) {
        res.status(400).json(
          createValidationErrorResponse(
            "Los barberos deben tener una sucursal asignada",
          ),
        );
        return;
      }

      const updatedUser = await model.update(codUsuario, {
        dni,
        nombre,
        apellido,
        telefono,
        email,
        contraseña,
        cuil,
        codSucursal,
      });

      const userType = cuil ? "barbero" : "cliente";

      const safeUser = sanitizeOutput(UserResponseSchema, updatedUser);

      res.status(200).json({
        message: `${
          userType.charAt(0).toUpperCase() + userType.slice(1)
        } actualizado exitosamente`,
        user: safeUser,
      });
    } catch (error) {
      logger.error({ error }, "Error updating user");
      this.handleError(error, res);
    }
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    const { codUsuario } = req.params;
    try {
      const result = await model.destroy(codUsuario);
      const safeUser = sanitizeOutput(UserResponseSchema, result);
      res.status(200).json({
        message: "Usuario dado de baja correctamente",
        user: safeUser,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const { codUsuario } = req.params;
    try {
      const result = await model.deactivate(codUsuario);
      const safeUser = sanitizeOutput(UserResponseSchema, result);
      res.status(200).json({
        message: "Usuario dado de baja correctamente",
        user: safeUser,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  reactivate = async (req: Request, res: Response): Promise<void> => {
    const { codUsuario } = req.params;
    try {
      const result = await model.reactivate(codUsuario);
      const safeUser = sanitizeOutput(UserResponseSchema, result);
      res.status(200).json({
        message: "Barbero reactivado correctamente",
        user: safeUser,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, contraseña, correo, clave } = req.body;

      // email/correo y contraseña/clave ya fueron validados por loginRequestSchema en el router
      const userEmail = email || correo;
      const userPassword = contraseña || clave;

      const usuario = await model.validateLogin(userEmail, userPassword);
      const safeUser = sanitizeOutput<UserResponse>(
        UserResponseSchema,
        usuario,
      );
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        res.status(500).json(
          createErrorResponse("JWT_SECRET no configurado", "server_error"),
        );
        return;
      }

      const rol = deriveRole(safeUser.cuil);

      const token = jwt.sign(
        {
          codUsuario: safeUser.codUsuario,
          codSucursal: safeUser.codSucursal ?? null,
          rol,
        },
        jwtSecret,
        { algorithm: "HS256", expiresIn: "8h" },
      );

      const csrfToken = randomBytes(32).toString("hex");

      res.cookie(AUTH_COOKIE, token, authCookieOptions(TOKEN_MAX_AGE_MS));
      res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions(TOKEN_MAX_AGE_MS));

      res.status(200).json({
        message: "Login exitoso",
        user: safeUser,
        csrfToken,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Error interno del servidor");
      let statusCode = 500;

      if (errorMessage.includes("incorrectos")) {
        statusCode = 401;
      } else if (
        error instanceof Error &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string" &&
        (error as { code: string }).code === "EMAIL_NOT_VERIFIED"
      ) {
        statusCode = 403;
      }

      res.status(statusCode).json(
        createErrorResponse(
          errorMessage,
          statusCode === 401 ? "unauthorized" : "server_error",
        ),
      );
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.cookie(AUTH_COOKIE, "", clearCookieOptions);
    res.cookie(CSRF_COOKIE, "", clearCsrfCookieOptions);
    res.status(200).json({ message: "Sesión cerrada" });
  }
}

const usersController = new UsersController();

export const findByBranchId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codSucursal } = req.params;

    const usuarios = await model.findByBranchId(codSucursal);
    const safeUsuarios = sanitizeOutput(BarberResponseSchema, usuarios);

    res.status(200).json({
      success: true,
      data: safeUsuarios,
      message: `Se encontraron ${usuarios.length} barberos en la sucursal`,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error al buscar usuarios por sucursal"),
    });
  }
};

export const findBySchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codSucursal, fechaTurno, horaDesde } = req.params;

    const barberosDisponibles = await model.findBySchedule(
      codSucursal,
      fechaTurno,
      horaDesde,
    );
    const safeBarberos = sanitizeOutput(
      BarberResponseSchema,
      barberosDisponibles,
    );

    res.status(200).json({
      success: true,
      data: safeBarberos,
      message: `Se encontraron ${barberosDisponibles.length} barberos disponibles`,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error al buscar barberos disponibles"),
    });
  }
};

export const { create, show, edit, destroy } = usersController;
export const store = usersController.store.bind(usersController);
export const index = usersController.index.bind(usersController);
export const update = usersController.update.bind(usersController);
export const login = usersController.login.bind(usersController);
export const logout = usersController.logout.bind(usersController);
export const deactivate = usersController.deactivate.bind(usersController);
export const reactivate = usersController.reactivate.bind(usersController);

export const requestEmailVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const payload = await model.requestEmailVerificationForEmail(email);

    if (payload) {
      const verificationUrl = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(
        payload.token,
      )}`;
      const emailContent = buildVerificationEmail(payload.name, verificationUrl);
      await sendMail({
        to: payload.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Si el email existe y necesita verificación, enviamos un enlace para activar la cuenta.",
    });
  } catch (error) {
    logger.error({ error }, "Error requesting email verification");
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error interno del servidor"),
    });
  }
};

export const confirmEmailVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.body;
    await model.verifyEmailByToken(token);

    res.status(200).json({
      success: true,
      message: "Email verificado correctamente.",
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Token inválido o expirado");
    res.status(400).json({ success: false, message: errorMessage });
  }
};

export const requestPasswordReset = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    const payload = await model.createPasswordResetTokenByEmail(email);

    if (payload) {
      const resetUrl = `${getAppBaseUrl()}/changePassword?token=${encodeURIComponent(
        payload.token,
      )}`;
      const emailContent = buildResetPasswordEmail(payload.name, resetUrl);
      await sendMail({
        to: payload.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Si el email existe en el sistema, enviamos un enlace para restablecer la contraseña.",
    });
  } catch (error) {
    logger.error({ error }, "Error requesting password reset");
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error interno del servidor"),
    });
  }
};

export const resetPasswordWithToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, nuevaContraseña } = req.body;
    await model.resetPasswordByToken(token, nuevaContraseña);
    res.status(200).json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Token inválido o expirado");
    res.status(400).json({ success: false, message: errorMessage });
  }
};
