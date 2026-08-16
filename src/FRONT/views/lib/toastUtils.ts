import toast from "react-hot-toast";
import { isAbortError } from "../components/shared/useAbortController";

export const handleAbortOrConnectionError = (
  error: unknown,
  toastId?: string,
  fallbackMessage = "Error de conexión",
): boolean => {
  if (isAbortError(error)) {
    if (toastId) toast.dismiss(toastId);
    return true;
  }

  if (toastId) {
    toast.error(fallbackMessage, { id: toastId });
  } else {
    toast.error(fallbackMessage);
  }

  return false;
};
