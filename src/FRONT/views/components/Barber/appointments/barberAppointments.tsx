import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../login/AuthContext";
import barberStyles from "./barberAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import TimeSlotPicker from "../../shared/TimeSlotPicker";

interface Appointment {
  codTurno: string;
  codBarbero: string;
  codCorte?: string;
  codCliente: string;
  fechaTurno: string;
  horaDesde: string;
  horaHasta: string;
  precioTurno?: number;
  metodoPago?: string;
  estado: string;
  usuarios_turnos_codBarberoTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    codSucursal: string | null;
    sucursales?: {
      codSucursal: string;
      nombre: string;
      calle: string;
      altura: number;
    } | null;
  };
  usuarios_turnos_codClienteTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
  };
  tipos_corte?: {
    codCorte: string;
    nombreCorte: string;
    valorBase: number;
  } | null;
}

const BarberAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<Appointment[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);

  // Estados para el modal de modificación
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [turnoToUpdate, setTurnoToUpdate] = useState<Appointment | null>(null);
  const [selectedUpdateDate, setSelectedUpdateDate] = useState<string>("");
  const [selectedUpdateTime, setSelectedUpdateTime] = useState<string>("");

  const navigate = useNavigate();

  // Función para formatear la fecha en formato legible (DD/MM/YYYY)
  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  // Función para extraer solo la hora en formato HH:MM
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Función para obtener la clase CSS según el estado del turno
  const getStatusClass = (estado: string): string => {
    switch (estado) {
      case "Programado":
        return barberStyles.statusProgramado;
      case "Cancelado":
        return barberStyles.statusCancelado;
      case "Cobrado":
        return barberStyles.statusCobrado;
      case "Sin cobrar":
        return barberStyles.statusSinCobrar;
      case "No asistido":
        return barberStyles.statusNoAsistido;
      default:
        return barberStyles.statusProgramado; // Valor por defecto
    }
  };

  // Primer efecto: verificar autenticación
  useEffect(() => {
    // Dar tiempo para que el AuthContext cargue desde localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true);

      if (!isAuthenticated || !user || !user.codUsuario || !user.codSucursal) {
        toast.error("Debes iniciar sesión como barbero para ver tus turnos");
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate]);

  // Segundo efecto: cargar turnos una vez autenticado
  useEffect(() => {
    // No cargar hasta que se haya verificado la autenticación
    if (!authChecked) return;

    // Si no está autenticado o no tiene codSucursal (no es barbero), no hacer fetch
    if (!isAuthenticated || !user || !user.codUsuario || !user.codSucursal) {
      return;
    }

    const loadTurnos = async () => {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;

      try {
        const res = await fetch(`/turnos/user/${user.codUsuario}`, {
          signal: controller.signal,
        });

        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.get("content-type"));

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json().catch(() => null);

        console.log("Turnos data:", data);
        // El backend puede devolver { success: true, data: [...] } o directamente un array
        let turnosArray: Appointment[] = [];

        if (data) {
          if (data.success && Array.isArray(data.data)) {
            turnosArray = data.data;
          } else if (Array.isArray(data)) {
            turnosArray = data;
          }
        }

        console.log("Turnos array procesado:", turnosArray);
        setTurnos(turnosArray);
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted for turnos");
          return;
        }
        console.error("Error fetching appointments:", error);
        setTurnos([]);
      } finally {
        fetchControllerRef.current = null;
      }
    };

    void loadTurnos();
  }, [authChecked, isAuthenticated, user, navigate]);

  const handleDelete = async (codTurno: string) => {
    //alert personalizado para confirmacion:
    toast(
      (t) => (
        <div className={barberStyles.modalContainer}>
          <p className={barberStyles.modalTitle}>
            ¿Estás seguro de que deseas cancelar esta reserva?
          </p>
          <div className={barberStyles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={barberStyles.buttonCancel}
            >
              Atrás
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmedDelete(codTurno);
              }}
              className={barberStyles.buttonConfirm}
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
      }
    );
  };

  const confirmedDelete = async (codTurno: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Cancelando turno...");

    // Abort any previous submit
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      const response = await fetch(`/turnos/${codTurno}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (response.ok) {
        await response.json().catch(() => null);
        toast.success("Turno cancelado correctamente", { id: toastId });

        // Actualizar el estado local del turno en lugar de eliminarlo
        setTurnos(
          turnos.map((turno) =>
            turno.codTurno === codTurno
              ? { ...turno, estado: "Cancelado" }
              : turno
          )
        );
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId });
      } else {
        const errorData = await response.json().catch(() => ({ message: "Error" }));
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Error al cancelar el turno", {
          id: toastId,
        });
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // request was intentionally aborted
        toast.dismiss(toastId);
        console.log("Cancel request aborted");
      } else {
        console.error("Error en la solicitud:", error);
        toast.error("Error de conexión con el servidor", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
      submitControllerRef.current = null;
    }
  };

  const handleUpdate = (turno: Appointment) => {
    setTurnoToUpdate(turno);
    setSelectedUpdateDate("");
    setSelectedUpdateTime("");
    setIsUpdateModalOpen(true);
  };

  const handleTimeSlotSelect = (fecha: string, hora: string) => {
    setSelectedUpdateDate(fecha);
    setSelectedUpdateTime(hora);
  };

  const confirmedUpdate = async () => {
    if (!turnoToUpdate || !selectedUpdateDate || !selectedUpdateTime) {
      toast.error("Por favor selecciona fecha y horario");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Modificando turno...");

    // Calcular horaHasta (30 minutos después)
    const [hours, minutes] = selectedUpdateTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + 30;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    const horaHasta = `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;

    // Abort any previous submit
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      const response = await fetch(
        `/turnos/${turnoToUpdate.codTurno}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fechaTurno: selectedUpdateDate,
            horaDesde: selectedUpdateTime,
            horaHasta: horaHasta,
          }),
          signal: controller.signal,
        }
      );

      if (response.ok) {
        await response.json().catch(() => null);
        toast.success("Turno modificado exitosamente", { id: toastId });

        // Actualizar el estado local
        setTurnos(
          turnos.map((t) =>
            t.codTurno === turnoToUpdate.codTurno
              ? {
                  ...t,
                  fechaTurno: selectedUpdateDate,
                  horaDesde: selectedUpdateTime,
                  horaHasta: horaHasta,
                }
              : t
          )
        );

        // Cerrar modal
        setIsUpdateModalOpen(false);
        setTurnoToUpdate(null);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Error" }));
        toast.error(errorData.message || "Error al modificar el turno", {
          id: toastId,
        });
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.dismiss(toastId);
        console.log("Update request aborted");
      } else {
        console.error("Error modificando turno:", error);
        toast.error("Error de conexión con el servidor", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
      submitControllerRef.current = null;
    }
  };

  return (
    <div className={barberStyles.appointmentsContainer}>
      <h2>Mis turnos</h2>
      <ul className={barberStyles.appointmentList}>
        {turnos.length === 0 ? (
          <li className={barberStyles.emptyState}>
            No tienes turnos a tu nombre.
          </li>
        ) : (
          turnos.map((t) => {
            const client = t.usuarios_turnos_codClienteTousuarios;
            const barber = t.usuarios_turnos_codBarberoTousuarios;
            const branch = barber?.sucursales;
            const cut = t.tipos_corte;

            return (
              <li key={t.codTurno} className={barberStyles.appointmentItem}>
                <div className={barberStyles.appointmentDetails}>
                  <div className={barberStyles.detailRow}>
                    <span className={barberStyles.detailLabel}>Fecha:</span>
                    <span className={barberStyles.detailValue}>
                      {formatDate(t.fechaTurno)}
                    </span>
                  </div>
                  <div className={barberStyles.detailRow}>
                    <span className={barberStyles.detailLabel}>Horario:</span>
                    <span className={barberStyles.detailValue}>
                      {formatTime(t.horaDesde)} - {formatTime(t.horaHasta)}
                    </span>
                  </div>
                  {client && (
                    <div className={barberStyles.detailRow}>
                      <span className={barberStyles.detailLabel}>Cliente:</span>
                      <span className={barberStyles.detailValue}>
                        {client.nombre} {client.apellido}
                      </span>
                    </div>
                  )}
                  {branch && (
                    <div className={barberStyles.detailRow}>
                      <span className={barberStyles.detailLabel}>
                        Sucursal:
                      </span>
                      <span className={barberStyles.detailValue}>
                        {branch.nombre}
                      </span>
                    </div>
                  )}
                  {cut?.nombreCorte &&
                    cut.nombreCorte !== "No especificado" && (
                      <div className={barberStyles.detailRow}>
                        <span className={barberStyles.detailLabel}>Corte:</span>
                        <span className={barberStyles.detailValue}>
                          {cut.nombreCorte}
                        </span>
                      </div>
                    )}
                  {t.precioTurno && t.precioTurno > 0 && (
                    <div className={barberStyles.detailRow}>
                      <span className={barberStyles.detailLabel}>Precio:</span>
                      <span className={barberStyles.detailValue}>
                        ${t.precioTurno}
                      </span>
                    </div>
                  )}
                  <div className={barberStyles.detailRow}>
                    <span className={barberStyles.detailLabel}>Estado:</span>
                    <span
                      className={`${barberStyles.detailValue} ${
                        barberStyles.statusBadge
                      } ${getStatusClass(t.estado)}`}
                    >
                      {t.estado}
                    </span>
                  </div>
                </div>
                {t.estado === "Programado" && (
                  <div className={barberStyles.appointmentActions}>
                    <button
                      className={barberStyles.deleteButton}
                      onClick={() => handleDelete(t.codTurno)}
                    >
                      Cancelar Turno
                    </button>
                    <button
                      className={barberStyles.updateButton}
                      onClick={() => handleUpdate(t)}
                    >
                      Modificar Turno
                    </button>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>

      {/* Modal de modificación de turno */}
      {isUpdateModalOpen && turnoToUpdate && user && (
        <div className={barberStyles.modalOverlay}>
          <div className={barberStyles.modalContent}>
            <div className={barberStyles.modalHeader}>
              <h3>Modificar Turno</h3>
              <button
                className={barberStyles.closeButton}
                onClick={() => setIsUpdateModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={barberStyles.modalBody}>
              <p className={barberStyles.currentAppointmentInfo}>
                <strong>Turno actual:</strong>
                <br />
                Fecha: {formatDate(turnoToUpdate.fechaTurno)}
                <br />
                Hora: {formatTime(turnoToUpdate.horaDesde)} -{" "}
                {formatTime(turnoToUpdate.horaHasta)}
              </p>
              <TimeSlotPicker
                codBarbero={user.codUsuario}
                onTimeSlotSelect={handleTimeSlotSelect}
                showConfirmButton={true}
                confirmButtonText="Confirmar Modificación"
                onConfirm={confirmedUpdate}
                minDate={new Date()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberAppointments;
