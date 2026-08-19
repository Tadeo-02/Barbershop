import { z } from "zod";
import { HaircutResponseSchema } from "../../BACK/Schemas/typeOfHaircutSchema";

export type Haircut = z.infer<typeof HaircutResponseSchema>;
