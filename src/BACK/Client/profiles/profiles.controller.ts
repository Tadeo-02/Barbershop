/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./profiles";
import { BaseController } from "../../base/base.controller";
import { Request, Response } from "express";

// Crear la clase UsersController para manejar usuarios normales
class ProfileController extends BaseController<any> {
  protected model = model;
  protected entityName = "client";
  protected idFieldName = "codUsuario";
}

const profileController = new ProfileController();

// Función personalizada para buscar usuario por ID
export const findByUserId = async (req: Request, res: Response) => {
  try {
    const { codUsuario } = req.params;

    if (!codUsuario) {
      return res.status(400).json({
        success: false,
        message: "codUsuario es requerido",
      });
    }

    const usuario = await model.findByUserId(codUsuario);

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error al buscar usuario",
    });
  }
};

export const { create, store, index, show, edit, update, destroy } =
  profileController;

// Exportar también el método login
export const login = profileController.login.bind(profileController);
