import type { RequestHandler } from "express";
import { z } from "zod";

type ValidationSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

const formatZodError = (error: z.ZodError) => error.flatten();

export const validateRequest = (schemas: ValidationSchemas): RequestHandler => {
  return (req, res, next) => {
    const errors: Record<string, unknown> = {};

    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (!parsed.success) {
        errors.params = formatZodError(parsed.error);
      } else {
        req.params = parsed.data;
      }
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (!parsed.success) {
        errors.query = formatZodError(parsed.error);
      } else {
        req.query = parsed.data;
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

export const sanitizeOutput = <T>(schema: z.ZodTypeAny, data: unknown): T => {
  const target = Array.isArray(data) ? z.array(schema) : schema;
  return target.parse(data) as T;
};
