import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../login/AuthContext";
import listStyles from "./barberAppointments.module.css";
import formStyles from "./barberAvailability.module.css";

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

interface MyAvailabilityProps {
  refreshKey?: number;
}

const MyAvailability: React.FC<MyAvailabilityProps> = ({ refreshKey = 0 }) => {
  const { user, isAuthenticated } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [availabilityToUpdate, setAvailabilityToUpdate] =
    useState<Availability | null>(null);
  const [editDesdeFecha, setEditDesdeFecha] = useState("");
  const [editDesdeHora, setEditDesdeHora] = useState("");
  const [editHastaFecha, setEditHastaFecha] = useState("");
  const [editHastaHora, setEditHastaHora] = useState("");
  const [editMotivo, setEditMotivo] = useState("");

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

  const handleDelete = (codBloqueo: string) => {
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
                void confirmedDelete(codBloqueo);
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

  const confirmedDelete = async (codBloqueo: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Cancelando bloqueo...");

    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      const response = await fetch(`/availability/${codBloqueo}`, {
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
          prev.filter((item) => item.codBloqueo !== codBloqueo),
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
    const desde = getDateParts(item.fechaHoraDesde);
    const hasta = getDateParts(item.fechaHoraHasta);

    setAvailabilityToUpdate(item);
    setEditDesdeFecha(desde.date);
    setEditDesdeHora(desde.time);
    setEditHastaFecha(hasta.date);
    setEditHastaHora(hasta.time);
    setEditMotivo(item.motivo || "");
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!availabilityToUpdate) {
      toast.error("No hay bloqueo seleccionado para modificar");
      return;
    }

    if (!user?.codUsuario) {
      toast.error("Debes iniciar sesion para modificar bloqueos");
      return;
    }

    if (
      !editDesdeFecha ||
      !editDesdeHora ||
      !editHastaFecha ||
      !editHastaHora
    ) {
      toast.error("Completa fecha y hora");
      return;
    }

    const motivo = editMotivo.trim();
    if (!motivo) {
      toast.error("El motivo es requerido");
      return;
    }

    if (motivo.length > 250) {
      toast.error("El motivo no puede superar 250 caracteres");
      return;
    }

    const fechaDesde = new Date(`${editDesdeFecha}T${editDesdeHora}:00Z`);
    const fechaHasta = new Date(`${editHastaFecha}T${editHastaHora}:00Z`);

    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      toast.error("Fecha u hora invalida");
      return;
    }

    if (fechaDesde >= fechaHasta) {
      toast.error("La fecha/hora Desde debe ser anterior a Hasta");
      return;
    }

    const payload = {
      codBarbero: user.codUsuario,
      fechaHoraDesde: `${editDesdeFecha} ${editDesdeHora}:00`,
      fechaHoraHasta: `${editHastaFecha} ${editHastaHora}:00`,
      motivo,
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
          availability.map((item) => (
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
                  <span className={listStyles.detailValue}>{item.motivo}</span>
                </div>
              </div>
              <div className={listStyles.appointmentActions}>
                <button
                  className={listStyles.deleteButton}
                  onClick={() => handleDelete(item.codBloqueo)}
                  disabled={isSubmitting}
                >
                  Cancelar bloqueo
                </button>
                <button
                  className={listStyles.updateButton}
                  onClick={() => handleUpdate(item)}
                  disabled={isSubmitting}
                >
                  Modificar bloqueo
                </button>
              </div>
            </li>
          ))
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
              <form onSubmit={handleUpdateSubmit}>
                <fieldset disabled={isSubmitting}>
                  <div className={formStyles.rangeSection}>
                    <h4 className={formStyles.sectionTitle}>Desde</h4>
                    <div className={formStyles.fieldsRow}>
                      <div className={formStyles.fieldGroup}>
                        <label
                          className={formStyles.label}
                          htmlFor="updateDesdeFecha"
                        >
                          Fecha
                        </label>
                        <input
                          id="updateDesdeFecha"
                          type="date"
                          className={formStyles.input}
                          value={editDesdeFecha}
                          max={editHastaFecha || undefined}
                          onChange={(e) => setEditDesdeFecha(e.target.value)}
                          required
                        />
                      </div>
                      <div className={formStyles.fieldGroup}>
                        <label
                          className={formStyles.label}
                          htmlFor="updateDesdeHora"
                        >
                          Hora
                        </label>
                        <input
                          id="updateDesdeHora"
                          type="time"
                          className={formStyles.input}
                          value={editDesdeHora}
                          onChange={(e) => setEditDesdeHora(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className={formStyles.rangeSection}>
                    <h4 className={formStyles.sectionTitle}>Hasta</h4>
                    <div className={formStyles.fieldsRow}>
                      <div className={formStyles.fieldGroup}>
                        <label
                          className={formStyles.label}
                          htmlFor="updateHastaFecha"
                        >
                          Fecha
                        </label>
                        <input
                          id="updateHastaFecha"
                          type="date"
                          className={formStyles.input}
                          value={editHastaFecha}
                          min={editDesdeFecha || undefined}
                          onChange={(e) => setEditHastaFecha(e.target.value)}
                          required
                        />
                      </div>
                      <div className={formStyles.fieldGroup}>
                        <label
                          className={formStyles.label}
                          htmlFor="updateHastaHora"
                        >
                          Hora
                        </label>
                        <input
                          id="updateHastaHora"
                          type="time"
                          className={formStyles.input}
                          value={editHastaHora}
                          onChange={(e) => setEditHastaHora(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <hr className={formStyles.divider} />

                  <div className={formStyles.fieldGroup}>
                    <label className={formStyles.label} htmlFor="updateMotivo">
                      Motivo
                    </label>
                    <textarea
                      id="updateMotivo"
                      className={formStyles.textarea}
                      value={editMotivo}
                      onChange={(e) => setEditMotivo(e.target.value)}
                      required
                      maxLength={250}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button
                      type="submit"
                      className={listStyles.updateButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Modificando..." : "Confirmar cambios"}
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAvailability;
