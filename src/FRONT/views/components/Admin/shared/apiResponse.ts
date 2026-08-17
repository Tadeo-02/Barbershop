import { extractMessageValue } from "../../lib/formErrorUtils";

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
