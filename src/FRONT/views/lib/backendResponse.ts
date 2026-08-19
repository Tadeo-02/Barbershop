export type ParsedBackendResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  message: string | null;
  raw: unknown;
};

export type ParseBackendResponseOptions = {
  emptyResponseMessage?: string;
  invalidJsonMessage?: string;
  defaultSuccessMessage?: string;
};

export const parseBackendResponse = async <T = unknown>(
  response: Response,
  options: ParseBackendResponseOptions = {},
): Promise<ParsedBackendResponse<T>> => {
  const {
    emptyResponseMessage = "El servidor no devolvió respuesta.",
    invalidJsonMessage = "Respuesta inválida del servidor",
    defaultSuccessMessage = "Operación exitosa",
  } = options;

  const rawText = await response.text();

  if (!rawText) {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      message: emptyResponseMessage,
      raw: null,
    };
  }

  try {
    const parsed = JSON.parse(rawText) as T & {
      message?: string;
      data?: T;
      success?: boolean;
    };

    const data = parsed && typeof parsed === "object" && "data" in parsed
      ? (parsed.data as T)
      : (parsed as T);

    const message =
      parsed && typeof parsed === "object" && "message" in parsed
        ? String(parsed.message)
        : response.ok
          ? defaultSuccessMessage
          : invalidJsonMessage;

    return {
      ok: response.ok,
      status: response.status,
      data,
      message,
      raw: parsed,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
      message: invalidJsonMessage,
      raw: rawText,
    };
  }
};

export const getBackendErrorMessage = <T = unknown>(
  payload: T | null,
  fallback = "Error del servidor",
): string => {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as Record<string, unknown>;
  const message = record.message;

  return typeof message === "string" && message.trim()
    ? message
    : fallback;
};
