import React, { useState, useEffect } from "react";
import { useAuth } from "../../login/AuthContext";
import barberStyles from "./barberAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
}

interface Client {
  codUsuario: string;
  nombre: string;
  apellido: string;
  telefono: string;
  codSucursal: string;
}

interface Branch {
  codSucursal: string;
  nombre: string;
  calle: string;
  altura: string;
}

interface Cut {
  codCorte: string;
  nombreCorte: string;
  valorBase: number;
}

const BarberAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<Appointment[]>([]);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [cortes, setCortes] = useState<Cut[]>([]);
  const [sucursales, setSucursales] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
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
      setLoading(false);
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
        let turnosArray: Appointment[] = [];

        if (data.success && Array.isArray(data.data)) {
          turnosArray = data.data;
        } else if (Array.isArray(data)) {
          turnosArray = data;
        }

        console.log("Turnos array procesado:", turnosArray);
        setTurnos(turnosArray);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setTurnos([]);
        setLoading(false);
      });
  }, [authChecked, isAuthenticated, user, navigate]);

  // Efecto separado para cargar datos relacionados cuando cambien los turnos
  useEffect(() => {
    if (turnos.length === 0) return;

    // Limpiar datos anteriores
    setClientes([]);
    setSucursales([]);
    setCortes([]);

    turnos.forEach((turno) => {
      // Fetch client
      fetch(`/usuarios/${turno.codCliente}`)
        .then((res) => res.json())
        .then((data) => {
          setClientes((prev) => {
            if (prev.some((c) => c.codUsuario === data.codUsuario)) {
              return prev;
            }
            return [...prev, data];
          });
        })
        .catch((error) => {
          console.error("Error fetching client:", error);
        });

      // Fetch branch
      fetch(`/sucursales/${user.codSucursal}`)
        .then((res) => res.json())
        .then((branchData) => {
          setSucursales((prev) => {
            if (prev.some((s) => s.codSucursal === branchData.codSucursal)) {
              return prev;
            }
            return [...prev, branchData];
          });
        })
        .catch((error) => {
          console.error("Error fetching branch:", error);
        });

      // Fetch corte si existe
      if (turno.codCorte) {
        fetch(`/tipoCortes/${turno.codCorte}`)
          .then((res) => res.json())
          .then((data) => {
            setCortes((prev) => {
              if (prev.some((c) => c.codCorte === data.codCorte)) {
                return prev;
              }
              return [...prev, data];
            });
          })
          .catch((error) => {
            console.error("Error fetching cut type:", error);
          });
      }
    });
  }, [turnos, user.codSucursal]);

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
    const toastId = toast.loading("Cancelando turno...");

    try {
      // Obtener la fecha actual en formato YYYY-MM-DD
      const fechaCancelacion = new Date().toISOString().split("T")[0];

      const response = await fetch(`/turnos/${codTurno}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fechaCancelacion }),
      });

      if (response.ok) {
        await response.json();
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
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Error al cancelar el turno", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  // const handleUpdate = (codTurno: string) => {
    
  //   toast(
  //     (t) => (
  //       <div className={barberStyles.modalContainer}>
  //         <p className={barberStyles.modalTitle}>
  //           Fecha:
  //         </p>
  //         <div className={barberStyles.modalButtons}>
  //           <button
  //             onClick={() => toast.dismiss(t.id)}
  //             className={barberStyles.buttonCancel}
  //           >
  //             Atrás
  //           </button>
  //           <button
  //             onClick={() => {
  //               toast.dismiss(t.id);
  //               confirmedDelete(codTurno);
  //             }}
  //             className={barberStyles.buttonConfirm}
  //           >
  //             Cancelar
  //           </button>
  //         </div>
  //       </div>
  //     ),
  //     {
  //       duration: Infinity,
  //       style: {
  //         minWidth: "350px",
  //         padding: "24px",
  //       },
  //     }
  //   );
  // };

  return (
    <div className={barberStyles.appointmentsContainer}>
      <h2>Mis turnos</h2>
      <ul className={barberStyles.appointmentList}>
        {turnos.length === 0 ? (
          <li className={barberStyles.emptyState}>
            Nunca has agendado un turno.
          </li>
        ) : (
          turnos.map((t) => {
            const client = clientes.find((c) => c.codUsuario === t.codCliente);
            const branch = sucursales.find(
              (s) => s.codSucursal === client?.codSucursal
            );
            const cut = cortes.find((c) => c.codCorte === t.codCorte);

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
                      disabled={true}
                      // onClick={() => handleUpdate(t.codTurno)}
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
    </div>
  );
};

export default BarberAppointments;
