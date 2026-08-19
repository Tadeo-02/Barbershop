import { z } from "zod";
import { BranchResponseSchema } from "../../BACK/Schemas/branchesSchema";

export type Sucursal = z.infer<typeof BranchResponseSchema>;
