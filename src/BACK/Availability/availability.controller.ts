/* eslint-disable @typescript-eslint/no-explicit-any */
import * as model from "./Availability";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
import { AvailabilityResponseSchema } from "../Schemas/availabilitySchema";

// creamos la clase availabilityController para enviar y manejar el base
class AvailabilityController extends BaseController<any> {
  protected model = model;
  protected entityName = "availability";
  protected idFieldName = "codBloqueo";
  protected responseSchema = AvailabilityResponseSchema;
}

const availabilityController = new AvailabilityController();
export const { create, store, index, show, edit, update, destroy } =
  availabilityController;
