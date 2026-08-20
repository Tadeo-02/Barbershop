import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/user/AuthContext";
import barberStyles from "./ClientAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { AppointmentFull } from "../../components/shared/appointments";
import { sortTurnosByDateTime,} from "../../components/shared/appointments";
import { formatDate, formatTime,} from "../../utils/dateUtils";
import { apiFetch } from "../../lib/apiFetch.ts";
import { getResponseMessage, readJsonSafely, unwrapArray } from "../../lib/apiResponse";
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import { ensureAuthenticatedUser } from "../../lib/authUtils";
import logger from "../../lib/logger";

const ClientAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<AppointmentFull[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  // function to obtain the CSS class according to the appointment's status
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
        return barberStyles.statusProgramado; // default
    }
  };

  useEffect(() => {
    const loadAppointments = async () => {

      if (!ensureAuthenticatedUser(isAuthenticated, user, navigate, {})) {
        return;
      }

      try {
        const res = await apiFetch(`/turnos/user/${user.codUsuario}`);

        logger.debug("Response status:", res.status);
        logger.debug("Response headers:", res.headers.get("content-type"));

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const turnosArray = unwrapArray<AppointmentFull>(data);

        setTurnos(turnosArray);
      } catch (error) {
        logger.error("Error fetching appointments:", error);
        setTurnos([]);
      }
    };

    void loadAppointments();
  }, [isAuthenticated, user, navigate]);

  const handleDelete = async (codTurno: string) => {
    //Custom confirmation alert
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
      },
    );
  };

  const confirmedDelete = async (codTurno: string) => {
    const toastId = toast.loading("Cancelando turno...");

    try {
      const response = await apiFetch(`/turnos/${codTurno}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await readJsonSafely(response);
        toast.success("Turno cancelado correctamente", {
          id: toastId,
          duration: 2000,
        });

        // update localState of the appointment instead of removing it
        setTurnos(
          turnos.map((turno) =>
            turno.codTurno === codTurno
              ? { ...turno, estado: "Cancelado" }
              : turno,
          ),
        );
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId, duration: 2000 });
      } else {
        const errorData = await readJsonSafely(response);
        logger.error("Error response:", errorData);
        toast.error(getResponseMessage(errorData, "Error al cancelar el turno")??
          "Error al cancelar el turno", {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (error) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión con el servidor")) {
        return;
      }
      logger.error("Error en la solicitud:", error);
    }
  };

  return (
    <div className={barberStyles.appointmentsContainer}>
      <h2>Mis turnos</h2>
      <div className={barberStyles.filtersContainer}>
        <select
          className={barberStyles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Programado">Programado</option>
          <option value="Cobrado">Cobrado</option>
          <option value="Sin cobrar">Sin cobrar</option>
          <option value="Cancelado">Cancelado</option>
          <option value="No asistido">No asistido</option>
        </select>
        <select
          className={barberStyles.filterSelect}
          value={dateSort}
          onChange={(e) =>
            setDateSort(e.target.value as "asc" | "desc")
          }
        >
          <option value="desc">Lejanos primero</option>
          <option value="asc">Próximos primero</option>
        </select>
      </div>
      <ul className={barberStyles.appointmentList}>
        {turnos.length === 0 ? (
          <li className={barberStyles.emptyState}>
            Nunca has agendado un turno.
          </li>
        ) : (
          [...turnos]
            .filter(
              (t) => statusFilter === "Todos" || t.estado === statusFilter,
            )
            .sort((a, b) => sortTurnosByDateTime(a, b, dateSort))
            .map((t) => {
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
                    {barber && (
                      <div className={barberStyles.detailRow}>
                        <span className={barberStyles.detailLabel}>
                          Barbero:
                        </span>
                        <span className={barberStyles.detailValue}>
                          {barber.nombre} {barber.apellido}
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
                          <span className={barberStyles.detailLabel}>
                            Corte:
                          </span>
                          <span className={barberStyles.detailValue}>
                            {cut.nombreCorte}
                          </span>
                        </div>
                      )}
                    {t.precioTurno && t.precioTurno > 0 && (
                      <div className={barberStyles.detailRow}>
                        <span className={barberStyles.detailLabel}>
                          Precio:
                        </span>
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
                    </div>
                  )}
                  {t.estado === "Cobrado" && (
                    <div className={barberStyles.appointmentActions}>
                      <button
                        className={barberStyles.invoiceButton}
                        onClick={() =>
                          navigate(`/client/appointments/recibo/${t.codTurno}`)
                        }
                      >
                        Ver Factura
                      </button>
                    </div>
                  )}
                </li>
              );
            })
        )}
      </ul>
    </div>
  );
};

export default ClientAppointments;
