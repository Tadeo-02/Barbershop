import * as model from "./Appointments";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
import { Request, Response } from "express";
import {
  AppointmentOutputSchema,
  AvailableSlotSchema,
} from "../Schemas/appointmentsSchema";
import { sanitizeOutput } from "../middleware/zodValidation";
import {
  createDataResponse,
  createErrorResponse,
  getErrorMessage,
} from "../lib/backendResponse";
// Create the barberController class to send and handle the base.

type AppointmentEntity = NonNullable<
  Awaited<ReturnType<typeof model.findById>>
>;
type AppointmentCreateArgs = Parameters<typeof model.store>;
type AppointmentUpdateArgs =
  Parameters<typeof model.update> extends [string, ...infer Rest]
    ? Rest
    : never;

const successData = <T>(data: T, message?: string) =>
  createDataResponse(data, message);

const serverError = (message: string) =>
  createErrorResponse(message, "server_error");

class AppointmentsController extends BaseController<
  AppointmentEntity,
  AppointmentCreateArgs,
  AppointmentUpdateArgs
> {
  protected model = model;
  protected entityName = "appointments";
  protected idFieldName = "codTurno";
  protected responseSchema = AppointmentOutputSchema;
}

const appointmentsController = new AppointmentsController();

// Custom functions for appointments.

export const findByAvailableDate = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fechaTurno, codSucursal } = req.params;

    const horasDisponibles = await model.findByAvailableDate(
      fechaTurno,
      codSucursal,
    );
    const safeHoras = sanitizeOutput(AvailableSlotSchema, horasDisponibles);

    res.status(200).json(successData(safeHoras));
  } catch (error: unknown) {
    res.status(500).json(
      serverError(getErrorMessage(error, "Error al buscar horas disponibles")),
    );
  }
};

export const findByBarberId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codBarbero, fechaTurno } = req.params;

    const horasDisponibles = await model.findByBarberId(codBarbero, fechaTurno);
    const safeHoras = sanitizeOutput(AvailableSlotSchema, horasDisponibles);

    res.status(200).json(successData(safeHoras));
  } catch (error: unknown) {
    res.status(500).json(
      serverError(
        getErrorMessage(error, "Error al buscar horas disponibles del barbero"),
      ),
    );
  }
};

export const findByUserId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codUsuario } = req.params;

    // a client or a barber can only consult their own appointments. admin can consult any
    if (req.user?.rol !== "admin" && req.user?.codUsuario !== codUsuario) {
      res.status(403).json({
        success: false,
        message: "Acceso denegado",
      });
      return;
    }

    const turno = await model.findByUserId(codUsuario);
    const safeTurno = sanitizeOutput(AppointmentOutputSchema, turno);

    res.status(200).json(successData(safeTurno));
  } catch (error: unknown) {
    res.status(500).json(
      serverError(getErrorMessage(error, "Error al buscar turno del cliente")),
    );
  }
};

export const findByBranchId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codSucursal } = req.params;

    const turnos = await model.findByBranchId(codSucursal);
    const safeTurnos = sanitizeOutput(AppointmentOutputSchema, turnos);

    res.status(200).json(successData(safeTurnos));
  } catch (error: unknown) {
    res.status(500).json(
      serverError(getErrorMessage(error, "Error al buscar turnos de la sucursal")),
    );
  }
};

export const findPendingByBranchId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codSucursal } = req.params;

    const turnos = await model.findPendingByBranchId(codSucursal);
    const safeTurnos = sanitizeOutput(AppointmentOutputSchema, turnos);

    res.status(200).json(successData(safeTurnos));
  } catch (error: unknown) {
    res.status(500).json(
      serverError(
        getErrorMessage(error, "Error al buscar turnos pendientes de la sucursal"),
      ),
    );
  }
};

export const cancelAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codTurno } = req.params;

    const result = await model.cancelAppointment(codTurno);
    const safeResult = sanitizeOutput(AppointmentOutputSchema, result);

    res.status(200).json({
      success: true,
      data: safeResult,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error al cancelar turno"),
    });
  }
};

export const checkoutAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codTurno } = req.params;
    const { codCorte, precioTurno, metodoPago } = req.body;

    const result = await model.checkoutAppointment(
      codTurno,
      codCorte,
      precioTurno,
      metodoPago,
    );
    const safeResult = sanitizeOutput(AppointmentOutputSchema, result);

    res.status(200).json({
      success: true,
      data: safeResult,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error al realizar checkout del turno"),
    });
  }
};

export const updateAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codTurno } = req.params;
    const { fechaTurno, horaDesde, horaHasta } = req.body;

    const result = await model.updateAppointment(
      codTurno,
      fechaTurno,
      horaDesde,
      horaHasta,
    );
    const safeResult = sanitizeOutput(AppointmentOutputSchema, result);

    res.status(200).json({
      success: true,
      data: safeResult,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error al actualizar turno"),
    });
  }
};

export const markAsNoShow = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codTurno } = req.params;

    const result = await model.markAsNoShow(codTurno);
    const safeResult = sanitizeOutput(AppointmentOutputSchema, result);

    res.status(200).json({
      success: true,
      data: safeResult,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(error, "Error al marcar turno como No asistido"),
    });
  }
};

export const findPendingByBarberId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codBarbero } = req.params;

    const pendingAppointments = await model.findPendingByBarberId(codBarbero);
    const safePending = sanitizeOutput(
      AppointmentOutputSchema,
      pendingAppointments,
    );

    res.status(200).json({
      success: true,
      data: safePending,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: getErrorMessage(
        error,
        "Error al buscar turnos pendientes del barbero",
      ),
    });
  }
};

export const { create, store, index, show, edit, update, destroy } =
  appointmentsController;
