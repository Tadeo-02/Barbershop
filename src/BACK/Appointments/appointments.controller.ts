/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Appointments";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
import { Request, Response } from "express";
// creamos la clase barberController para enviar y manejar el base
class AppointmentsController extends BaseController<any> {
  protected model = model;
  protected entityName = "appointments";
  protected idFieldName = "codTurno";
}

const appointmentsController = new AppointmentsController();

// Funciones personalizadas para appointments
export const findByAvailableDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fechaTurno, codSucursal } = req.params;

    if (!fechaTurno || !codSucursal) {
      res.status(400).json({
        success: false,
        message: "fechaTurno y codSucursal son requeridos",
      });
      return;
    }

    const horasDisponibles = await model.findByAvailableDate(
      fechaTurno,
      codSucursal
    );

    res.status(200).json({
      success: true,
      data: horasDisponibles,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar horas disponibles",
    });
  }
};

export const findByBarberId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codBarbero, fechaTurno } = req.params;

    if (!codBarbero || !fechaTurno) {
      res.status(400).json({
        success: false,
        message: "codBarbero y fechaTurno son requeridos",
      });
      return;
    }

    const horasDisponibles = await model.findByBarberId(codBarbero, fechaTurno);

    res.status(200).json({
      success: true,
      data: horasDisponibles,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar horas disponibles del barbero",
    });
  }
};

export const findByClientId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codCliente } = req.params;

    if (!codCliente) {
      res.status(400).json({
        success: false,
        message: "codCliente es requerido",
      });
      return;
    }

    const turno = await model.findByClientId(codCliente);

    res.status(200).json({
      success: true,
      data: turno,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar turno del cliente",
    });
  }
};

export const findState = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codEstado } = req.params;

    if (!codEstado) {
      res.status(400).json({
        success: false,
        message: "codEstado es requerido",
      });
      return;
    }

    const estado = await model.findState(codEstado);

    res.status(200).json({
      success: true,
      data: estado,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar estado",
    });
  }
};

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { codTurno } = req.params;

    if (!codTurno) {
      res.status(400).json({
        success: false,
        message: "codTurno es requerido",
      });
      return;
    }

    const result = await model.cancelAppointment(codTurno);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al cancelar turno",
    });
  }
};

export const { create, store, index, show, edit, update, destroy } =
  appointmentsController;
