import toast from "react-hot-toast";
import { apiFetch } from "../../../lib/apiFetch";
import { getResponseMessage, readJsonSafely } from "../../../lib/apiResponse";

type ChangeEntityStatusOptions = {
  endpoint: string;
  method?: "PATCH" | "PUT" | "POST" | "DELETE";
  headers?: HeadersInit;
  body?: BodyInit | null;
  loadingMessage: string;
  successMessage: string;
  notFoundMessage: string;
  genericErrorMessage: string;
  networkErrorMessage?: string;
  duration?: number;
  onSuccess?: () => void;
};

export const changeEntityStatus = async ({
  endpoint,
  method = "PATCH",
  headers,
  body,
  loadingMessage,
  successMessage,
  notFoundMessage,
  genericErrorMessage,
  networkErrorMessage = "Error de conexión con el servidor",
  duration = 2000,
  onSuccess,
}: ChangeEntityStatusOptions): Promise<void> => {
  const toastId = toast.loading(loadingMessage);

  try {
    const response = await apiFetch(endpoint, { method, headers, body });

    if (response.ok) {
      toast.success(successMessage, { id: toastId, duration });
      onSuccess?.();
      return;
    }

    if (response.status === 404) {
      toast.error(notFoundMessage, { id: toastId, duration });
      return;
    }

    const errorData = await readJsonSafely(response);
    const message =
      getResponseMessage(errorData, genericErrorMessage) ?? genericErrorMessage;
    toast.error(message, { id: toastId, duration });
  } catch (error) {
    console.error("Error en la solicitud:", error);
    toast.error(networkErrorMessage, { id: toastId, duration });
  }
};
