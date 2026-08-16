export type BackendErrorType =
  | "validation_error"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "server_error";

export type BackendResponsePayload<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  type?: BackendErrorType;
  [key: string]: unknown;
};

export const createSuccessResponse = <T>(
  data: T,
  message?: string,
): BackendResponsePayload<T> => ({
  success: true,
  ...(message ? { message } : {}),
  data,
});

export const createDataResponse = <T>(
  data: T,
  message?: string,
): BackendResponsePayload<T> => createSuccessResponse(data, message);

export const createErrorResponse = (
  message: string,
  type: BackendErrorType = "server_error",
  statusCode?: number,
): BackendResponsePayload & { statusCode?: number } => ({
  success: false,
  message,
  type,
  ...(typeof statusCode === "number" ? { statusCode } : {}),
});

export const createValidationErrorResponse = (
  message: string,
  details?: unknown,
): BackendResponsePayload & { errors?: unknown } => ({
  success: false,
  message,
  type: "validation_error",
  ...(details !== undefined ? { errors: details } : {}),
});

export const createUnauthorizedResponse = (
  message = "No autenticado",
): BackendResponsePayload => ({
  success: false,
  message,
  type: "unauthorized",
});

export const createForbiddenResponse = (
  message = "Acceso denegado",
): BackendResponsePayload => ({
  success: false,
  message,
  type: "forbidden",
});

export const createNotFoundResponse = (
  entityName: string,
): BackendResponsePayload => ({
  success: false,
  message: `${entityName} no encontrado`,
  type: "not_found",
});

export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
