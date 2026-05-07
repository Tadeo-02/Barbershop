import * as model from "./Availability";
import { BaseController } from "../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
import { AvailabilityResponseSchema } from "../Schemas/availabilitySchema";

// creamos la clase availabilityController para enviar y manejar el base
type AvailabilityEntity = NonNullable<
  Awaited<ReturnType<typeof model.findById>>
>;
type AvailabilityCreateArgs = Parameters<typeof model.store>;
type AvailabilityUpdateArgs = Parameters<typeof model.update> extends [
  string,
  ...infer Rest
]
  ? Rest
  : never;

class AvailabilityController extends BaseController<
  AvailabilityEntity,
  AvailabilityCreateArgs,
  AvailabilityUpdateArgs
> {
  protected model = model;
  protected entityName = "availability";
  protected idFieldName = "codBloqueo";
  protected responseSchema = AvailabilityResponseSchema;
}

const availabilityController = new AvailabilityController();
export const { create, store, index, show, edit, update, destroy } =
  availabilityController;
