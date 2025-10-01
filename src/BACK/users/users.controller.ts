/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Users";
import { BaseController } from "../base/base.controller";
import { Request, Response } from "express";

// Crear la clase UsersController para manejar usuarios normales
class UsersController extends BaseController<any> {
  protected model = model;
  protected entityName = "usuario";
  protected idFieldName = "codUsuario";

  // Método específico para login de usuarios
  async login(req: Request, res: Response) {
    try {
      console.log("Login request received");
      console.log("Request body:", req.body);

      // Aceptar tanto email/contraseña como correo/clave para compatibilidad
      const { email, contraseña, correo, clave } = req.body;

      console.log("Extracted fields:", { email, contraseña, correo, clave });

      const userEmail = email || correo;
      const userPassword = contraseña || clave;

      console.log("Final values:", { userEmail, userPassword });

      if (!userEmail || !userPassword) {
        console.log("Missing credentials");
        return res.status(400).json({
          message: "Email y contraseña son requeridos",
        });
      }

      const usuario = await model.validateLogin(userEmail, userPassword);

      res.status(200).json({
        message: "Login exitoso",
        user: usuario,
      });
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Error interno del servidor";

      // Si es error de credenciales, devolver 401, sino 500
      const statusCode = errorMessage.includes("incorrectos") ? 401 : 500;

      res.status(statusCode).json({
        message: errorMessage,
      });
    }
  }
}

const usersController = new UsersController();

// Función personalizada para buscar usuarios por sucursal
export const findByBranchId = async (req: any, res: any) => {
  try {
    const { codSucursal } = req.params;

    if (!codSucursal) {
      return res.status(400).json({
        success: false,
        message: "codSucursal es requerido",
      });
    }

    const usuarios = await model.findByBranchId(codSucursal);

    return res.status(200).json({
      success: true,
      data: usuarios,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error al buscar usuarios por sucursal",
    });
  }
};

export const { create, store, index, show, edit, update, destroy } =
  usersController;

// Exportar también el método login
export const login = usersController.login.bind(usersController);
