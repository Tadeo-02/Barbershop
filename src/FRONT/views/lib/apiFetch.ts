// lib/apiFetch.ts
import {
  ApiError,
  describeResponseFormat,
  normalizeResponse,
  toApiError,
  type ApiResponse,
} from "./apiResponse";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
  }

  return response;
}

/**
 * Parsea una respuesta HTTP y devuelve un ApiResponse discriminado.
 * Lanza ApiError si el status, el JSON o la forma del payload no encajan.
 */
export async function parseApiResponse<T>(
  response: Response,
  context = "",
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;

    if (bodyText.trim()) {
      try {
        const errorData = JSON.parse(bodyText) as Record<string, unknown>;
        if (typeof errorData.message === "string") {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        }
      } catch {
        errorMessage = `${errorMessage}: ${bodyText.slice(0, 100)}`;
      }
    }

    throw new ApiError(response.status, errorMessage, "HTTP_ERROR", bodyText);
  }

  if (!contentType.includes("application/json")) {
    throw new ApiError(
      response.status,
      `Expected JSON but got ${contentType || "unknown content-type"}${bodyText ? `: ${bodyText.slice(0, 100)}` : ""}`,
      "INVALID_CONTENT_TYPE",
      bodyText,
    );
  }

  let json: unknown;
  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch (error) {
    throw new ApiError(
      response.status,
      `Failed to parse JSON: ${error instanceof Error ? error.message : "unknown error"}`,
      "JSON_PARSE_ERROR",
      bodyText,
    );
  }

  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (obj.success === false) {
      const errorMessage =
        typeof obj.message === "string"
          ? obj.message
          : typeof obj.error === "string"
            ? obj.error
            : "Unknown error";

      return {
        success: false,
        error: errorMessage,
        code: "BACKEND_ERROR",
        statusCode: response.status,
      };
    }
  }

  try {
    return {
      success: true,
      data: normalizeResponse<T>(json, context),
    };
  } catch (error) {
    throw toApiError(
      error,
      response.status,
      `Failed to normalize response. Format: ${describeResponseFormat(json)}${context ? ` (${context})` : ""}`,
    );
  }
}

/**
 * Wrapper sobre apiFetch que devuelve directamente el payload normalizado.
 */
export async function apiFetchJson<T>(
  path: string,
  options: RequestInit = {},
  context = path,
): Promise<T> {
  const response = await apiFetch(path, options);
  const parsed = await parseApiResponse<T>(response, context);

  if (!parsed.success) {
    throw new ApiError(
      parsed.statusCode ?? response.status,
      parsed.error,
      parsed.code ?? "BACKEND_ERROR",
    );
  }

  return parsed.data;
}
