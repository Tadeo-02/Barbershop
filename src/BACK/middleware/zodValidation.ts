import type { RequestHandler } from "express";
import { z } from "zod";

type ValidationSchemas<TBody extends z.ZodTypeAny | undefined = undefined,
  TParams extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined> = {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
};

const formatZodError = (error: z.ZodError) => error.flatten();

export const validateRequest = <
  TBody extends z.ZodTypeAny | undefined = undefined,
  TParams extends z.ZodTypeAny | undefined = undefined,
  TQuery extends z.ZodTypeAny | undefined = undefined,
>(
  schemas: ValidationSchemas<TBody, TParams, TQuery>,
): RequestHandler => {
  return (req, res, next) => {
    const errors: Record<string, unknown> = {};

    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (!parsed.success) {
        errors.params = formatZodError(parsed.error);
      } else {
        req.params = parsed.data as typeof req.params;
      }
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (!parsed.success) {
        errors.query = formatZodError(parsed.error);
      } else {
        req.query = parsed.data as typeof req.query;
      }
    }

    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body);
      if (!parsed.success) {
        errors.body = formatZodError(parsed.error);
      } else {
        req.body = parsed.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        message: "Datos invalidos",
        errors,
      });
      return;
    }

    next();
  };
};

type OutputShape = {
  pick?: Record<string, true>;
  omit?: Record<string, true>;
};

const applyOutputShape = (
  schema: z.ZodTypeAny,
  shape?: OutputShape,
): z.ZodTypeAny => {
  if (!shape) return schema;
  if (!(schema instanceof z.ZodObject)) return schema;
  if (shape.pick) {
    return schema.pick(shape.pick);
  }
  if (shape.omit) {
    return schema.omit(shape.omit);
  }
  return schema;
};

export const sanitizeOutput = <T>(
  schema: z.ZodTypeAny,
  data: unknown,
  shape?: OutputShape,
): T => {
  const shapedSchema = applyOutputShape(schema, shape);
  const target = Array.isArray(data)
    ? z.array(shapedSchema)
    : shapedSchema;
  return target.parse(data) as T;
};
