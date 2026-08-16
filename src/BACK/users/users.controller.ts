import * as model from "./Users";
import { BaseController } from "../base/base.controller";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sanitizeOutput } from "../middleware/zodValidation";
import {
  BarberResponseSchema,
  type UserResponse,
  UserResponseSchema,
} from "../Schemas/usersSchema";
import {
  buildResetPasswordEmail,
  buildVerificationEmail,
  sendMail,
} from "../lib/mailer";

type UserEntity = NonNullable<Awaited<ReturnType<typeof model.findById>>>;
type UserCreateArgs = Parameters<typeof model.store>;
type UserUpdateArgs =
  Parameters<typeof model.update> extends [string, ...infer Rest]
    ? Rest
    : never;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

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
      console.log("store endpoint called. Body:", req.body);
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
      const { preguntaSeguridad, respuestaSeguridad } = req.body;

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
        preguntaSeguridad,
        respuestaSeguridad,
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
      console.error("Error creating user:", error);
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
        res.status(400).json({
          message: "Los barberos deben tener una sucursal asignada",
        });
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
      console.error("Error updating user:", error);
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

      const userEmail = email || correo;
      const userPassword = contraseña || clave;

      if (!userEmail || !userPassword) {
        res.status(400).json({
          message: "Email y contraseña son requeridos",
        });
        return;
      }

      const usuario = await model.validateLogin(userEmail, userPassword);
      const safeUser = sanitizeOutput<UserResponse>(
        UserResponseSchema,
        usuario,
      );
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        res.status(500).json({
          message: "JWT_SECRET no configurado",
        });
        return;
      }

      const rol: "admin" | "barber" | "client" =
        safeUser.cuil === "1" ? "admin" : safeUser.cuil ? "barber" : "client";

      const token = jwt.sign(
        {
          codUsuario: safeUser.codUsuario,
          codSucursal: safeUser.codSucursal ?? null,
          rol,
        },
        jwtSecret,
        { expiresIn: "8h" },
      );

      res.status(200).json({
        message: "Login exitoso",
        user: safeUser,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage = getErrorMessage(error, "Error interno del servidor");
      let statusCode = 500;
      let code: string | undefined;

      if (errorMessage.includes("incorrectos")) {
        statusCode = 401;
      } else if (
        error instanceof Error &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string" &&
        (error as { code: string }).code === "EMAIL_NOT_VERIFIED"
      ) {
        statusCode = 403;
        code = "EMAIL_NOT_VERIFIED";
      }

      res.status(statusCode).json({
        message: errorMessage,
        code,
      });
    }
  }
}

const usersController = new UsersController();

export const findByBranchId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codSucursal } = req.params;

    if (!codSucursal) {
      res.status(400).json({
        success: false,
        message: "codSucursal es requerido",
      });
      return;
    }

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

    if (!codSucursal || !fechaTurno || !horaDesde) {
      res.status(400).json({
        success: false,
        message: "codSucursal, fechaTurno y horaDesde son requeridos",
      });
      return;
    }

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
    console.error("Error requesting email verification:", error);
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
    console.error("Error requesting password reset:", error);
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

// get security question by email
export const getSecurityQuestion = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    console.log("getSecurityQuestion called. Param email:", email);
    if (!email) {
      res.status(400).json({ success: false, message: "Email es requerido" });
      return;
    }
    const pregunta = await model.getSecurityQuestionByEmail(email);
    console.log(
      "getSecurityQuestion result for",
      email,
      "-> pregunta:",
      pregunta,
    );
    res.status(200).json({ success: true, pregunta });
  } catch (error: unknown) {
    console.error("Error getting security question:", error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error interno"),
    });
  }
};

// Update security question and answer for a user (requires simple header auth: x-user-id === codUsuario)
export const updateSecurityQuestion = async (req: Request, res: Response) => {
  try {
    const { codUsuario } = req.params;

    if (!codUsuario) {
      res
        .status(400)
        .json({ success: false, message: "codUsuario es requerido" });
      return;
    }

    if (req.user?.rol !== "admin" && req.user?.codUsuario !== codUsuario) {
      res.status(401).json({ success: false, message: "No autorizado" });
      return;
    }

    const { preguntaSeguridad, respuestaSeguridad } = req.body;
    if (!preguntaSeguridad || !respuestaSeguridad) {
      res.status(400).json({
        success: false,
        message: "Pregunta y respuesta son requeridas",
      });
      return;
    }

    // Delegate to model
    const updated = await model.updateSecurityQuestion(
      codUsuario,
      preguntaSeguridad,
      respuestaSeguridad,
    );

    res.status(200).json({
      success: true,
      message: "Pregunta de seguridad actualizada",
      data: { codUsuario: updated.codUsuario },
    });
  } catch (error: unknown) {
    console.error("Error updating security question:", error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error interno"),
    });
  }
};

// verify security answer and reset password
export const verifySecurityAnswer = async (req: Request, res: Response) => {
  try {
    console.log("verifySecurityAnswer endpoint called. Body:", req.body);
    const { email, respuestaSeguridad, nuevaContraseña } = req.body;
    if (!email || !respuestaSeguridad) {
      res
        .status(400)
        .json({ success: false, message: "Email y respuesta son requeridos" });
      return;
    }

    if (!nuevaContraseña) {
      await model.verifySecurityAnswerOnly(email, respuestaSeguridad);
      res
        .status(200)
        .json({ success: true, message: "Respuesta verificada correctamente" });
      return;
    }

    await model.verifySecurityAnswerAndReset(
      email,
      respuestaSeguridad,
      nuevaContraseña,
    );

    res
      .status(200)
      .json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error: unknown) {
    console.error("Error verifying security answer:", error);
    if (error instanceof Error && error.stack) console.error(error.stack);
    const errMsg = getErrorMessage(error, "Error interno");
    let status = 500;

    const lowerMsg = errMsg.toLowerCase();
    if (lowerMsg.includes("incorrecta")) {
      status = 401; // incorrect answer -> unauthorized
    } else if (
      lowerMsg.includes("usuario no encontrado") ||
      lowerMsg.includes("no user found")
    ) {
      status = 404; // user not found
    } else if (
      lowerMsg.includes("no hay respuesta") ||
      lowerMsg.includes("no hay respuesta de seguridad")
    ) {
      status = 400; // bad request: no security answer configured
    }

    res.status(status).json({ success: false, message: errMsg });
  }
};

// reset password  (separade step, after verifying security answer)
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, respuestaSeguridad, nuevaContraseña } = req.body;
    if (!email || !respuestaSeguridad || !nuevaContraseña) {
      res.status(400).json({
        success: false,
        message: "Email, respuesta y nueva contraseña son requeridos",
      });
      return;
    }

    await model.verifySecurityAnswerAndReset(
      email,
      respuestaSeguridad,
      nuevaContraseña,
    );

    res
      .status(200)
      .json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (error: unknown) {
    console.error("Error resetting password:", error);
    const errMsg = getErrorMessage(error, "Error interno");
    let status = 500;
    const lowerMsg = errMsg.toLowerCase();
    if (lowerMsg.includes("incorrecta")) {
      status = 401;
    } else if (
      lowerMsg.includes("usuario no encontrado") ||
      lowerMsg.includes("no user found")
    ) {
      status = 404;
    } else if (lowerMsg.includes("no hay respuesta")) {
      status = 400;
    }
    res.status(status).json({ success: false, message: errMsg });
  }
};
