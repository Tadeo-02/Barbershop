import * as model from "./typeOfHaircut";
import { BaseController } from "../../base/base.controller"; // import request, response and dataBaseError from the base
import { HaircutResponseSchema } from "../../Schemas/typeOfHaircutSchema";
// create the barberController class to send and handle the base
type HaircutEntity = NonNullable<Awaited<ReturnType<typeof model.findById>>>;
type HaircutCreateArgs = Parameters<typeof model.store>;
type HaircutUpdateArgs =
  Parameters<typeof model.update> extends [string, ...infer Rest]
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
