/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Appointments";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
// creamos la clase barberController para enviar y manejar el base
class AppointmentsController extends BaseController<any> {
  protected model = model;
  protected entityName = "appointments";
  protected idFieldName = "codTurno";
}

const appointmentsController = new AppointmentsController();

// Funciones personalizadas para appointments
export const findByAvailableDate = async (req: any, res: any) => {
  try {
    const { fechaTurno, codSucursal } = req.params;

    if (!fechaTurno || !codSucursal) {
      return res.status(400).json({
        success: false,
        message: "fechaTurno y codSucursal son requeridos",
      });
    }

    const horasDisponibles = await model.findByAvailableDate(
      fechaTurno,
      codSucursal
    );

    return res.status(200).json({
      success: true,
      data: horasDisponibles,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error al buscar horas disponibles",
    });
  }
};

export const findByBarberId = async (req: any, res: any) => {
  try {
    const { codBarbero, fechaTurno } = req.params;

    if (!codBarbero || !fechaTurno) {
      return res.status(400).json({
        success: false,
        message: "codBarbero y fechaTurno son requeridos",
      });
    }

    const horasDisponibles = await model.findByBarberId(codBarbero, fechaTurno);

    return res.status(200).json({
      success: true,
      data: horasDisponibles,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error al buscar horas disponibles del barbero",
    });
  }
};

export const findByClientId = async (req: any, res: any) => {
  try {
    const { codCliente } = req.params;

    if (!codCliente) {
      return res.status(400).json({
        success: false,
        message: "codCliente es requerido",
      });
    }

    const turno = await model.findByClientId(codCliente);

    return res.status(200).json({
      success: true,
      data: turno,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error al buscar turno del cliente",
    });
  }
};
export const { create, store, index, show, edit, update, destroy } =
  appointmentsController;
