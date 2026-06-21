// src/FRONT/views/lib/apiResponse.ts

export type ApiErrorCode =
  | "HTTP_ERROR"
  | "INVALID_CONTENT_TYPE"
  | "JSON_PARSE_ERROR"
  | "BACKEND_ERROR"
  | "NORMALIZATION_ERROR";

/**
 * Error personalizado para fallos en la API.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: ApiErrorCode;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code?: ApiErrorCode,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

/**
 * Tipos discriminados para respuestas normalizadas.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ApiErrorCode; statusCode?: number };

/**
 * Helper para crear respuestas exitosas.
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Helper para crear respuestas de error.
 */
export function errorResponse(
  error: string,
  code?: ApiErrorCode,
  statusCode?: number,
): ApiResponse<never> {
  return { success: false, error, code, statusCode };
}

const META_KEYS = new Set([
  "success",
  "data",
  "message",
  "error",
  "code",
  "type",
  "errors",
  "statusCode",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getPayloadKeys(record: Record<string, unknown>): string[] {
  return Object.keys(record).filter((key) => !META_KEYS.has(key));
}

/**
 * Detecta y normaliza formatos válidos del backend.
 * Lanza ApiError si el payload no encaja en ninguno de los casos esperados.
 */
export function normalizeResponse<T>(data: unknown, context = ""): T {
  if (Array.isArray(data)) {
    return data as T;
  }

  if (!isRecord(data)) {
    if (data === undefined) {
      throw new ApiError(
        0,
        `Respuesta vacía${context ? ` (${context})` : ""}`,
        "NORMALIZATION_ERROR",
      );
    }

    return data as T;
  }

  const payloadKeys = getPayloadKeys(data);

  if (data.success === true) {
    if ("data" in data) {
      return data.data as T;
    }

    if (payloadKeys.length === 1) {
      return data[payloadKeys[0]] as T;
    }

    if (payloadKeys.length > 1) {
      return data as T;
    }

    throw new ApiError(
      0,
      `Respuesta exitosa sin datos reconocibles${context ? ` (${context})` : ""}`,
      "NORMALIZATION_ERROR",
      data,
    );
  }

  if ("message" in data && payloadKeys.length === 1) {
    return data[payloadKeys[0]] as T;
  }

  if (payloadKeys.length > 1) {
    return data as T;
  }

  if (payloadKeys.length === 1) {
    return data[payloadKeys[0]] as T;
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(
      0,
      `Respuesta vacía${context ? ` (${context})` : ""}`,
      "NORMALIZATION_ERROR",
      data,
    );
  }

  throw new ApiError(
    0,
    `Formato de respuesta no reconocido${context ? ` (${context})` : ""}`,
    "NORMALIZATION_ERROR",
    data,
  );
}

/**
 * Describe el tipo de respuesta para debugging.
 */
export function describeResponseFormat(data: unknown): string {
  if (Array.isArray(data)) {
    return `array[${data.length}]`;
  }

  if (data === null || typeof data !== "object") {
    return typeof data;
  }

  const obj = data as Record<string, unknown>;

  if (obj.success === true && "data" in obj) {
    return "{ success: true, data }";
  }

  if (obj.success === false) {
    return "{ success: false, message }";
  }

  const keys = Object.keys(obj);
  return `{ ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", ..." : ""} }`;
}

export function toApiError(
  error: unknown,
  fallbackStatusCode = 0,
  fallbackMessage = "Unexpected API error",
): ApiError {
  if (ApiError.isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(
      fallbackStatusCode,
      error.message,
      "NORMALIZATION_ERROR",
      error,
    );
  }

  return new ApiError(
    fallbackStatusCode,
    fallbackMessage,
    "NORMALIZATION_ERROR",
    error,
  );
}
