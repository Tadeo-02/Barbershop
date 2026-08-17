type FormErrorLike = {
  message?: unknown;
};

type FormErrorsMap = Record<string, FormErrorLike | undefined>;

type FormResultLike = {
  errors?: FormErrorsMap;
};

type MessageCarrier = { message?: unknown };

export const normalizeMessage = (message: unknown): string | undefined => {
  if (typeof message !== "string") return undefined;

  const normalized = message.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const extractMessageValue = (
  value: unknown,
  fallback?: string,
): string | undefined => {
  if (!value || typeof value !== "object" || !("message" in value)) {
    return fallback;
  }

  const message = (value as MessageCarrier).message;
  const normalized = normalizeMessage(message);

  if (normalized) return normalized;
  if (message != null) return String(message).trim() || fallback;
  return fallback;
};

export const normalizeFormErrors = <T extends FormResultLike>(
  result: T | undefined,
): T | undefined => {
  if (!result || !result.errors) return result;

  for (const key of Object.keys(result.errors)) {
    const error = result.errors[key];
    if (!error || typeof error !== "object" || !("message" in error)) {
      continue;
    }

    const normalized = extractMessageValue(error);
    if (normalized) {
      error.message = normalized;
    }
  }

  return result;
};
