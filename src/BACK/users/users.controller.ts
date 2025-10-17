/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Users";
import { BaseController } from "../base/base.controller";
import { Request, Response } from "express";

class UsersController extends BaseController<any> {
  protected model = model;
  protected entityName = "usuario";
  protected idFieldName = "codUsuario";

  index = async (req: Request, res: Response): Promise<void> => {
    try {
      const userType = req.query.type as "client" | "barber" | undefined;
      const entities = await model.findAll(userType);
      res.status(200).json(entities);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  store = async (req: Request, res: Response): Promise<void> => {
    try {
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
        codSucursal
      );

      const userType = cuil ? "barbero" : "cliente";

      res.status(201).json({
        message: `${
          userType.charAt(0).toUpperCase() + userType.slice(1)
        } creado exitosamente`,
        user: newUser,
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

      res.status(200).json({
        message: `${
          userType.charAt(0).toUpperCase() + userType.slice(1)
        } actualizado exitosamente`,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      this.handleError(error, res);
    }
  };

  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log("Login request received");
      console.log("Request body:", req.body);

      const { email, contraseña, correo, clave } = req.body;

      console.log("Extracted fields:", { email, contraseña, correo, clave });

      const userEmail = email || correo;
      const userPassword = contraseña || clave;

      console.log("Final values:", { userEmail, userPassword });

      if (!userEmail || !userPassword) {
        console.log("Missing credentials");
        res.status(400).json({
          message: "Email y contraseña son requeridos",
        });
        return;
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

      const statusCode = errorMessage.includes("incorrectos") ? 401 : 500;

      res.status(statusCode).json({
        message: errorMessage,
      });
    }
  }
}

const usersController = new UsersController();

export const findByBranchId = async (
  req: Request,
  res: Response
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

    res.status(200).json({
      success: true,
      data: usuarios,
      message: `Se encontraron ${usuarios.length} barberos en la sucursal`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar usuarios por sucursal",
    });
  }
};

export const findBySchedule = async (
  req: Request,
  res: Response
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
      horaDesde
    );

    res.status(200).json({
      success: true,
      data: barberosDisponibles,
      message: `Se encontraron ${barberosDisponibles.length} barberos disponibles`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar barberos disponibles",
    });
  }
};

export const { create, show, edit, destroy } = usersController;
export const store = usersController.store.bind(usersController);
export const index = usersController.index.bind(usersController);
export const update = usersController.update.bind(usersController);
export const login = usersController.login.bind(usersController);
