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
export const findByAvailableDate = async (
  req: Request,
  res: Response
): Promise<void> => {
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

export const findByBarberId = async (
  req: Request,
  res: Response
): Promise<void> => {
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

export const findByUserId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { codUsuario } = req.params;

    if (!codUsuario) {
      res.status(400).json({
        success: false,
        message: "codUsuario es requerido",
      });
      return;
    }

    const turno = await model.findByUserId(codUsuario);

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

    const turnos = await model.findByBranchId(codSucursal);

    res.status(200).json({
      success: true,
      data: turnos,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar turnos de la sucursal",
    });
  }
};

export const findPendingByBranchId = async (
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

    const turnos = await model.findPendingByBranchId(codSucursal);

    res.status(200).json({
      success: true,
      data: turnos,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar turnos pendientes de la sucursal",
    });
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
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

export const checkoutAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { codTurno } = req.params;
    const { codCorte, precioTurno } = req.body;

    if (!codTurno) {
      res.status(400).json({
        success: false,
        message: "codTurno es requerido",
      });
      return;
    }

    const result = await model.checkoutAppointment(
      codTurno,
      codCorte,
      precioTurno
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al realizar checkout del turno",
    });
  }
};

export const updateAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { codTurno } = req.params;
    const { fechaTurno, horaDesde, horaHasta } = req.body;

    if (!codTurno) {
      res.status(400).json({
        success: false,
        message: "codTurno es requerido",
      });
      return;
    }

    const result = await model.updateAppointment(
      codTurno,
      fechaTurno,
      horaDesde,
      horaHasta
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al actualizar turno",
    });
  }
};

export const markAsNoShow = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { codTurno } = req.params;

    if (!codTurno) {
      res.status(400).json({
        success: false,
        message: "codTurno es requerido",
      });
      return;
    }

    const result = await model.markAsNoShow(codTurno);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al marcar turno como No asistido",
    });
  }
};

export const findPendingByBarberId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { codBarbero } = req.params;

    if (!codBarbero) {
      res.status(400).json({
        success: false,
        message: "codBarbero es requerido",
      });
      return;
    }

    const pendingAppointments = await model.findPendingByBarberId(codBarbero);

    res.status(200).json({
      success: true,
      data: pendingAppointments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al buscar turnos pendientes del barbero",
    });
  }
};

export const { create, store, index, show, edit, update, destroy } =
  appointmentsController;
