export const getResponseMessage = (
  data: unknown,
  fallback?: string,
): string | undefined => {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return fallback;
  }

  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  if (message != null) return String(message);
  return fallback;
};

export const readJsonSafely = async <T = unknown>(
  response: Response,
): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};
