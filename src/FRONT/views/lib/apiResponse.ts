import { extractMessageValue } from "../utils/formErrorUtils";

export const getResponseMessage = (
  data: unknown,
  fallback?: string,
): string | undefined => {
  return extractMessageValue(data, fallback);
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
export const unwrapArray = <T = unknown>(
  data: unknown,
  keys: string[] = ["data"],
): T[] => {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
};