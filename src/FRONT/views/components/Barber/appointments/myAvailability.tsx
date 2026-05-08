import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../login/AuthContext";
import listStyles from "./barberAppointments.module.css";
import AvailabilityForm from "./AvailabilityForm";
import type { AvailabilityFormValues } from "./AvailabilityForm";

interface Availability {
  codBloqueo: string;
  codBarbero: string;
  fechaHoraDesde: string | Date;
  fechaHoraHasta: string | Date;
  motivo: string;
}

const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "AbortError");

const normalizeDateInput = (value: string | Date): Date => {
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  if (trimmed.includes("T")) return new Date(trimmed);
  if (trimmed.includes(" ")) {
    return new Date(`${trimmed.replace(" ", "T")}Z`);
  }

  return new Date(trimmed);
};

const getDateParts = (value: string | Date) => {
  const date = normalizeDateInput(value);
  const [datePart, timePart] = date.toISOString().split("T");
  const time = timePart.slice(0, 5);
  return { date: datePart, time };
};

const formatDate = (value: string | Date): string => {
  const { date } = getDateParts(value);
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const formatTime = (value: string | Date): string => {
  const { time } = getDateParts(value);
  return time;
};

const isAvailabilityEnded = (item: Availability) =>
  normalizeDateInput(item.fechaHoraHasta).getTime() < Date.now();

interface MyAvailabilityProps {
  refreshKey?: number;
}

const MyAvailability: React.FC<MyAvailabilityProps> = ({ refreshKey = 0 }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [availabilityToUpdate, setAvailabilityToUpdate] =
    useState<Availability | null>(null);
  const [editValues, setEditValues] = useState<AvailabilityFormValues | null>(
    null,
  );

  useEffect(() => {
    return () => {
      fetchControllerRef.current?.abort();
      submitControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.codUsuario) return;

    const loadAvailability = async () => {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch("/availability", {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json().catch(() => null);

        let list: Availability[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (data && Array.isArray(data.availability)) {
          list = data.availability;
        }

        const filtered = list
          .filter((item) => item.codBarbero === user.codUsuario)
          .sort(
            (a, b) =>
              normalizeDateInput(a.fechaHoraDesde).getTime() -
              normalizeDateInput(b.fechaHoraDesde).getTime(),
          );

        setAvailability(filtered);
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        console.error("Error fetching availability:", error);
        setAvailability([]);
      } finally {
        setIsLoading(false);
        fetchControllerRef.current = null;
      }
    };

    void loadAvailability();
  }, [isAuthenticated, user, refreshKey]);

  const handleDelete = (item: Availability) => {
    if (isAvailabilityEnded(item)) {
      toast.error("No se puede cancelar un bloqueo finalizado");
      return;
    }

    toast(
      (t) => (
        <div className={listStyles.modalContainer}>
          <p className={listStyles.modalTitle}>
            Estas seguro de que deseas cancelar este bloqueo?
          </p>
          <div className={listStyles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={listStyles.buttonCancel}
            >
              Atras
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                void confirmedDelete(item);
              }}
              className={listStyles.buttonConfirm}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "350px",
          padding: "24px",
        },
      },
    );
  };

  const confirmedDelete = async (item: Availability) => {
    if (isAvailabilityEnded(item)) {
      toast.error("No se puede cancelar un bloqueo finalizado");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Cancelando bloqueo...");

    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      const response = await fetch(`/availability/${item.codBloqueo}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        toast.success("Bloqueo cancelado correctamente", { id: toastId });
        setAvailability((prev) =>
          prev.filter((current) => current.codBloqueo !== item.codBloqueo),
        );
      } else {
        const message =
          data?.message || data?.error || "Error al cancelar bloqueo";
        toast.error(message, { id: toastId });
      }
    } catch (error: unknown) {
      if (isAbortError(error)) {
        toast.dismiss(toastId);
        return;
      }

      console.error("Error canceling availability:", error);
      toast.error("Error de conexion", { id: toastId });
    } finally {
      setIsSubmitting(false);
      submitControllerRef.current = null;
    }
  };

  const handleUpdate = (item: Availability) => {
    if (isAvailabilityEnded(item)) {
      toast.error("No se puede modificar un bloqueo finalizado");
      return;
    }

    const desde = getDateParts(item.fechaHoraDesde);
    const hasta = getDateParts(item.fechaHoraHasta);

    setAvailabilityToUpdate(item);
    setEditValues({
      desdeFecha: desde.date,
      desdeHora: desde.time,
      hastaFecha: hasta.date,
      hastaHora: hasta.time,
      motivo: item.motivo || "",
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (values: AvailabilityFormValues) => {
    if (!availabilityToUpdate) {
      toast.error("No hay bloqueo seleccionado para modificar");
      return;
    }

    if (isAvailabilityEnded(availabilityToUpdate)) {
      toast.error("No se puede modificar un bloqueo finalizado");
      return;
    }

    if (!user?.codUsuario) {
      toast.error("Debes iniciar sesion para modificar bloqueos");
      return;
    }

    const payload = {
      codBarbero: user.codUsuario,
      fechaHoraDesde: `${values.desdeFecha} ${values.desdeHora}:00`,
      fechaHoraHasta: `${values.hastaFecha} ${values.hastaHora}:00`,
      motivo: values.motivo,
    };

    const toastId = toast.loading("Modificando bloqueo...");
    setIsSubmitting(true);

    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      const response = await fetch(
        `/availability/${availabilityToUpdate.codBloqueo}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );

      const data = await response.json().catch(() => null);

      if (response.ok) {
        toast.success("Bloqueo modificado correctamente", { id: toastId });
        setAvailability((prev) =>
          prev
            .map((item) =>
              item.codBloqueo === availabilityToUpdate.codBloqueo
                ? {
                    ...item,
                    fechaHoraDesde: payload.fechaHoraDesde,
                    fechaHoraHasta: payload.fechaHoraHasta,
                    motivo: payload.motivo,
                  }
                : item,
            )
            .sort(
              (a, b) =>
                normalizeDateInput(a.fechaHoraDesde).getTime() -
                normalizeDateInput(b.fechaHoraDesde).getTime(),
            ),
        );

        setIsUpdateModalOpen(false);
        setAvailabilityToUpdate(null);
        setEditValues(null);
      } else {
        const message =
          data?.message || data?.error || "Error al modificar bloqueo";
        toast.error(message, { id: toastId });
      }
    } catch (error: unknown) {
      if (isAbortError(error)) {
        toast.dismiss(toastId);
        return;
      }

      console.error("Error updating availability:", error);
      toast.error("Error de conexion", { id: toastId });
    } finally {
      setIsSubmitting(false);
      submitControllerRef.current = null;
    }
  };

  return (
    <div className={listStyles.appointmentsContainer}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h2>Mis bloqueos de disponibilidad</h2>
      </div>
      <ul className={listStyles.appointmentList}>
        {isLoading ? (
          <li className={listStyles.loadingState}>Cargando bloqueos...</li>
        ) : availability.length === 0 ? (
          <li className={listStyles.emptyState}>
            No tienes bloqueos registrados.
          </li>
        ) : (
          availability.map((item) => {
            const ended = isAvailabilityEnded(item);

            return (
              <li key={item.codBloqueo} className={listStyles.appointmentItem}>
                <div className={listStyles.appointmentDetails}>
                  <div className={listStyles.detailRow}>
                    <span className={listStyles.detailLabel}>Desde:</span>
                    <span className={listStyles.detailValue}>
                      {formatDate(item.fechaHoraDesde)}{" "}
                      {formatTime(item.fechaHoraDesde)}
                    </span>
                  </div>
                  <div className={listStyles.detailRow}>
                    <span className={listStyles.detailLabel}>Hasta:</span>
                    <span className={listStyles.detailValue}>
                      {formatDate(item.fechaHoraHasta)}{" "}
                      {formatTime(item.fechaHoraHasta)}
                    </span>
                  </div>
                  <div className={listStyles.detailRow}>
                    <span className={listStyles.detailLabel}>Motivo:</span>
                    <span className={listStyles.detailValue}>
                      {item.motivo}
                    </span>
                  </div>
                  <div className={listStyles.detailRow}>
                    <span className={listStyles.detailLabel}>Estado:</span>
                    <span className={listStyles.detailValue}>
                      {ended ? "Finalizado" : "Activo"}
                    </span>
                  </div>
                </div>
                <div className={listStyles.appointmentActions}>
                  <button
                    className={listStyles.deleteButton}
                    onClick={() => handleDelete(item)}
                    disabled={isSubmitting || ended}
                  >
                    Cancelar bloqueo
                  </button>
                  <button
                    className={listStyles.updateButton}
                    onClick={() => handleUpdate(item)}
                    disabled={isSubmitting || ended}
                  >
                    Modificar bloqueo
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {isUpdateModalOpen && availabilityToUpdate && (
        <div className={listStyles.modalOverlay}>
          <div className={listStyles.modalContent}>
            <div className={listStyles.modalHeader}>
              <h3>Modificar bloqueo</h3>
              <button
                className={listStyles.closeButton}
                onClick={() => setIsUpdateModalOpen(false)}
              >
                x
              </button>
            </div>
            <div className={listStyles.modalBody}>
              <p className={listStyles.currentAppointmentInfo}>
                <strong>Bloqueo actual:</strong>
                <br />
                Desde: {formatDate(availabilityToUpdate.fechaHoraDesde)}{" "}
                {formatTime(availabilityToUpdate.fechaHoraDesde)}
                <br />
                Hasta: {formatDate(availabilityToUpdate.fechaHoraHasta)}{" "}
                {formatTime(availabilityToUpdate.fechaHoraHasta)}
                <br />
                Motivo: {availabilityToUpdate.motivo}
              </p>
              <AvailabilityForm
                initialValues={editValues || undefined}
                onSubmit={handleUpdateSubmit}
                submitLabel={
                  isSubmitting ? "Modificando..." : "Confirmar cambios"
                }
                submitClassName={listStyles.updateButton}
                disabled={isSubmitting}
                idPrefix="update"
                confirmTitle="Modificar ausencia"
                confirmConfirmLabel="Modificar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAvailability;
