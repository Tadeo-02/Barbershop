import React, { useState, useEffect } from "react";
import { useAuth } from "../login/AuthContext";
import barberStyles from "../Client/clientAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  AppointmentFull,
  formatDate,
  formatTime,
} from "../shared/appointments";

const ClientAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<AppointmentFull[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [dateSort, setDateSort] = useState<string>("asc");
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

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

      if (!isAuthenticated || !user || !user.codUsuario) {
        toast.error("Debes iniciar sesión para ver tus turnos");
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate]);

  // Segundo efecto: cargar turnos una vez autenticado
  useEffect(() => {
    // No cargar hasta que se haya verificado la autenticación
    if (!authChecked) return;

    // Si no está autenticado, no hacer fetch
    if (!isAuthenticated || !user || !user.codUsuario) {
      return;
    }

    fetch(`/turnos/user/${user.codUsuario}`)
      .then(async (res) => {
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.get("content-type"));

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Turnos data:", data);
        // El backend devuelve { success: true, data: [...] }
        let turnosArray: AppointmentFull[] = [];

        if (data.success && Array.isArray(data.data)) {
          turnosArray = data.data;
        } else if (Array.isArray(data)) {
          turnosArray = data;
        }

        console.log("Turnos array procesado:", turnosArray);
        setTurnos(turnosArray);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setTurnos([]);
      });
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
      },
    );
  };

  const confirmedDelete = async (codTurno: string) => {
    const toastId = toast.loading("Cancelando turno...");

    try {
      const response = await fetch(`/turnos/${codTurno}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await response.json();
        toast.success("Turno cancelado correctamente", {
          id: toastId,
          duration: 2000,
        });

        // Actualizar el estado local del turno en lugar de eliminarlo
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
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Error al cancelar el turno", {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", {
        id: toastId,
        duration: 2000,
      });
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
          onChange={(e) => setDateSort(e.target.value)}
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
            .sort((a, b) => {
              const strA = `${a.fechaTurno.split("T")[0]}T${formatTime(a.horaDesde)}`;
              const strB = `${b.fechaTurno.split("T")[0]}T${formatTime(b.horaDesde)}`;
              return dateSort === "desc"
                ? strB.localeCompare(strA)
                : strA.localeCompare(strB);
            })
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
