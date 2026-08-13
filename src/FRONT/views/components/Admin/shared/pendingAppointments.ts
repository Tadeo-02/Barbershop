import { apiFetch } from "../../../lib/apiFetch";
import { readJsonSafely } from "./apiResponse";

type PendingScope = "barber" | "branch";

type PendingResponse = {
  data?: unknown;
};

const getPendingList = (payload: PendingResponse | null): unknown[] => {
  if (!payload || !Array.isArray(payload.data)) return [];
  return payload.data;
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
  const pendingList = getPendingList(payload);
  return pendingList.length;
};
