import toast from "react-hot-toast";
import { showConfirmActionToast } from "./confirmActionToast";
import { changeEntityStatus } from "./entityStatus";
import { fetchPendingAppointmentsCount } from "./pendingAppointments";

type PendingScope = "barber" | "branch";
type Gender = "masculine" | "feminine";

interface EntityActivationConfig {
  /** Nombre de la entidad en minúscula, para armar los mensajes (ej. "barbero", "sucursal"). */
  entityLabel: string;
  /** Nombre de la entidad con la primera letra en mayúscula (ej. "Barbero", "Sucursal"). */
  entityLabelCapitalized: string;
  /** Género gramatical de entityLabel, para concordancia de artículos y participios. */
  gender: Gender;
  /** Endpoint base sin id, ej. "/usuarios" o "/sucursales". Se arma como `${endpointBase}/${id}/deactivate`. */
  endpointBase: string;
  /**
   * Si se especifica, antes de desactivar se chequean turnos pendientes de esa entidad
   * y se bloquea la baja si hay alguno.
   */
  pendingCheck?: {
    scope: PendingScope;
    /** Mensaje mostrado cuando hay turnos pendientes; recibe la cantidad. */
    blockedMessage: (count: number) => string;
    /** Duración del toast de bloqueo en ms. Default: 4000. */
    blockedMessageDuration?: number;
  };
  /** Se llama con (id, activo) para actualizar el estado local de la lista tras el cambio. */
  onStatusChange: (id: string, activo: boolean) => void;
}

const AGREEMENT: Record<
  Gender,
  { article: string; demonstrative: string; pastSuffix: string }
> = {
  masculine: { article: "el", demonstrative: "este", pastSuffix: "o" },
  feminine: { article: "la", demonstrative: "esta", pastSuffix: "a" },
};

/**
 * Encapsula el flujo repetido de dar de baja / reactivar una entidad de Admin
 * (confirmación -> chequeo opcional de turnos pendientes -> cambio de estado
 * en el backend -> actualización del estado local).
 */
export function useEntityActivation({
  entityLabel,
  entityLabelCapitalized,
  gender,
  endpointBase,
  pendingCheck,
  onStatusChange,
}: EntityActivationConfig) {
  const { article, demonstrative, pastSuffix } = AGREEMENT[gender];

  const handleDelete = async (id: string) => {
    if (pendingCheck) {
      try {
        const pendingCount = await fetchPendingAppointmentsCount(
          pendingCheck.scope,
          id,
        );

        if (pendingCount > 0) {
          toast.error(pendingCheck.blockedMessage(pendingCount), {
            duration: pendingCheck.blockedMessageDuration ?? 4000,
          });
          return;
        }
      } catch (error) {
        console.error("Error checking pending appointments:", error);
        toast.error("Error al verificar turnos pendientes", {
          duration: 4000,
        });
        return;
      }
    }

    showConfirmActionToast({
      title: `¿Estás seguro de que querés dar de baja ${demonstrative} ${entityLabel}?`,
      confirmLabel: "Dar de baja",
      confirmColor: "danger",
      onConfirm: () => confirmedDelete(id),
    });
  };

  const confirmedDelete = async (id: string) => {
    await changeEntityStatus({
      endpoint: `${endpointBase}/${id}/deactivate`,
      loadingMessage: `Dando de baja ${entityLabel}...`,
      successMessage: `${entityLabelCapitalized} dad${pastSuffix} de baja correctamente`,
      notFoundMessage: `${entityLabelCapitalized} no encontrad${pastSuffix}`,
      genericErrorMessage: `Error al dar de baja ${article} ${entityLabel}`,
      onSuccess: () => onStatusChange(id, false),
    });
  };

  const handleReactivate = async (id: string) => {
    showConfirmActionToast({
      title: `¿Estás seguro de que querés reactivar ${demonstrative} ${entityLabel}?`,
      confirmLabel: "Reactivar",
      confirmColor: "success",
      onConfirm: () => confirmedReactivate(id),
    });
  };

  const confirmedReactivate = async (id: string) => {
    await changeEntityStatus({
      endpoint: `${endpointBase}/${id}/reactivate`,
      loadingMessage: `Reactivando ${entityLabel}...`,
      successMessage: `${entityLabelCapitalized} reactivad${pastSuffix} correctamente`,
      notFoundMessage: `${entityLabelCapitalized} no encontrad${pastSuffix}`,
      genericErrorMessage: `Error al reactivar ${article} ${entityLabel}`,
      onSuccess: () => onStatusChange(id, true),
    });
  };

  return { handleDelete, handleReactivate };
}
