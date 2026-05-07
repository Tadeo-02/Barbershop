import * as model from "./typeOfHaircut";
import { BaseController } from "../../base/base.controller"; // importamos las reques, responde y dataBaseError de la base
import { HaircutResponseSchema } from "../../Schemas/typeOfHaircutSchema";
// creamos la clase barberController para enviar y manejar el base
type HaircutEntity = NonNullable<Awaited<ReturnType<typeof model.findById>>>;
type HaircutCreateArgs = Parameters<typeof model.store>;
type HaircutUpdateArgs = Parameters<typeof model.update> extends [
  string,
  ...infer Rest
]
  ? Rest
  : never;

class TypeOfHaircutController extends BaseController<
  HaircutEntity,
  HaircutCreateArgs,
  HaircutUpdateArgs
> {
  protected model = model;
  protected entityName = "typeOfHaircut";
  protected idFieldName = "codCorte";
  protected responseSchema = HaircutResponseSchema;
}

const typeOfHaircutController = new TypeOfHaircutController();

export const { create, store, index, show, edit, update, destroy } =
  typeOfHaircutController;
