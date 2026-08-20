import { apiFetch } from "../../lib/apiFetch";
import { readJsonSafely, unwrapArray } from "../../lib/apiResponse";

type PendingScope = "barber" | "branch";

type PendingResponse = {
  data?: unknown;
};

export const fetchPendingAppointmentsCount = async (
  scope: PendingScope,
  id: string,
): Promise<number> => {
  const response = await apiFetch(`/turnos/pending/${scope}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to check pending appointments: ${response.status}`);
  }

  const payload = await readJsonSafely<PendingResponse>(response);
  const pendingList = unwrapArray(payload?.data ?? []);
  return pendingList.length;
};
