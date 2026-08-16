import { z } from "zod";
import { DatabaseError } from "../base/Base";

export const parseValidatedInput = <TOutput, TInput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  input: TInput,
): TOutput => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new DatabaseError(firstError.message);
    }
    throw error;
  }
};

export const safeValidate = <TOutput, TInput>(
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>,
  input: TInput,
): TOutput | null => {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
};
