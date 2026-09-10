import { z } from "zod";
import { BarberResponseSchema } from "../../BACK/Schemas/usersSchema";

export type Barbero = z.infer<typeof BarberResponseSchema>;
