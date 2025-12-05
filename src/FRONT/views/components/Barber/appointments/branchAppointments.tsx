import React, { useState, useEffect } from "react";
import { useAuth } from "../../login/AuthContext";
import styles from "./branchAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface AppointmentForm {
  codCorte: string;
  precioTurno: number;
  metodoPago: string;
}

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
    codSucursal: string;
  };
  usuarios_turnos_codClienteTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
  };
}

interface Cut {
  codCorte: string;
  nombreCorte: string;
  valorBase: number;
}

const BranchAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<Appointment[]>([]);
  const [allCortes, setAllCortes] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: AppointmentForm }>(
    {}
  );
  const navigate = useNavigate();
  // Client-side search state (search by barber or client name)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Debounce search input to avoid recalculating on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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

  useEffect(() => {
    // Dar tiempo para que el AuthContext cargue desde localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true);

      if (!isAuthenticated || !user || !user.codUsuario) {
        toast.error("Debes iniciar sesión para ver los turnos");
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !user) return;

    const endpoint = `/turnos/branch/${user?.codSucursal}`;
    fetch(endpoint)
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

        let turnosArray: Appointment[] = [];

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
        // On error, stop both loading flags so UI shows the error/empty state
        setLoadingData(false);
        setLoading(false);
      });
  }, [authChecked, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (turnos.length === 0) {
      setLoadingData(false);
      setLoading(false);
      return;
    }

    // Los datos de barberos y clientes ya vienen incluidos en turnos
    setLoadingData(false);
    setLoading(false);
  }, [turnos]);

  // Cargar todos los tipos de corte disponibles
  useEffect(() => {
    fetch("/tipoCortes")
      .then((res) => {
        console.log("Response status cortes:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Cortes data:", data);
        if (Array.isArray(data)) {
          console.log("Setting allCortes:", data);
          setAllCortes(data);
        } else if (data.success && Array.isArray(data.data)) {
          console.log("Setting allCortes from data.data:", data.data);
          setAllCortes(data.data);
        } else {
          console.warn("Formato de respuesta inesperado:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching cuts:", error);
        toast.error("Error al cargar tipos de corte");
      });
  }, []);

  // Client-side filtered results based on debounced search (barber or client name) and date
  const filteredTurnos = turnos.filter((turno) => {
    // Filtro por búsqueda de texto
    if (debouncedSearch && debouncedSearch.trim() !== "") {
      const q = debouncedSearch.toLowerCase();

      const barberoName = turno.usuarios_turnos_codBarberoTousuarios
        ? `${turno.usuarios_turnos_codBarberoTousuarios.nombre} ${turno.usuarios_turnos_codBarberoTousuarios.apellido}`.toLowerCase()
        : "";
      const clienteName = turno.usuarios_turnos_codClienteTousuarios
        ? `${turno.usuarios_turnos_codClienteTousuarios.nombre} ${turno.usuarios_turnos_codClienteTousuarios.apellido}`.toLowerCase()
        : "";

      if (!barberoName.includes(q) && !clienteName.includes(q)) {
        return false;
      }
    }

    // Filtro por fecha
    if (selectedDate) {
      const turnoDate = turno.fechaTurno.split("T")[0];
      if (turnoDate !== selectedDate) {
        return false;
      }
    }

    return true;
  });

  const handleFormChange = (
    codTurno: string,
    field: keyof AppointmentForm,
    value: string | number
  ) => {
    setFormData((prev) => {
      const current = prev[codTurno] || {
        codCorte: "",
        precioTurno: 0,
        metodoPago: "",
      };

      // Si cambia el tipo de corte, actualizar el precio automáticamente
      if (field === "codCorte") {
        const selectedCut = allCortes.find((c) => c.codCorte === value);
        return {
          ...prev,
          [codTurno]: {
            ...current,
            codCorte: value as string,
            precioTurno: selectedCut?.valorBase || 0,
          },
        };
      }

      return {
        ...prev,
        [codTurno]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleCheckOut = (codTurno: string) => {
    const data = formData[codTurno];

    if (!data || !data.codCorte || !data.metodoPago || !data.precioTurno) {
      toast.error("Por favor complete todos los campos antes de continuar");
      return;
    }

    //alert personalizado para confirmacion:
    toast(
      (t) => (
        <div className={styles.modalContainer}>
          <p className={styles.modalTitle}>Completar servicio</p>
          <p className={styles.modalDescription}>
            ¿Confirmar que el servicio ha sido completado y proceder con el
            cobro?
          </p>
          <div className={styles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={styles.modalButtonCancel}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmedCheckOut(
                  codTurno,
                  data.codCorte,
                  data.precioTurno,
                  data.metodoPago
                );
              }}
              className={styles.modalButtonConfirm}
            >
              Confirmar cobro
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "400px",
          maxWidth: "500px",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          background: "#ffffff",
        },
      }
    );
  };

  const confirmedCheckOut = async (
    codTurno: string,
    codCorte: string,
    precioTurno: number,
    metodoPago: string
  ) => {
    const toastId = toast.loading("Finalizando turno...");

    try {
      const response = await fetch(`/turnos/${codTurno}/checkout`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codCorte, precioTurno, metodoPago }),
      });

      if (response.ok) {
        await response.json();
        toast.success("Turno cobrado con éxito", { id: toastId });

        // Recargar turnos
        if (user) {
          const res = await fetch(`/turnos/branch/${user.codSucursal}`);
          const data = await res.json();

          let turnosArray: Appointment[] = [];
          if (data.success && Array.isArray(data.data)) {
            turnosArray = data.data;
          } else if (Array.isArray(data)) {
            turnosArray = data;
          }

          setTurnos(turnosArray);
          // Limpiar form data del turno completado
          setFormData((prev) => {
            const newData = { ...prev };
            delete newData[codTurno];
            return newData;
          });
        }
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId });
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Error al finalizar el turno", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error de red al finalizar el turno", { id: toastId });
    }
  };

  return (
    <div className={styles.appointmentsContainer}>
      <h2 className={styles.pageTitle}>Turnos de la Sucursal</h2>

      <input
        type="text"
        name="search"
        placeholder="Buscar por barbero o cliente"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
      />

      <input
        type="date"
        name="dateFilter"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className={styles.searchInput}
      />

      <br />
      {loading || loadingData ? (
        <div className={styles.loadingState}>Cargando turnos...</div>
      ) : turnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay turnos programados para esta sucursal</p>
        </div>
      ) : filteredTurnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No se encontraron coincidencias para la búsqueda.</p>
        </div>
      ) : (
        <ul className={styles.appointmentList}>
          {filteredTurnos.map((turno) => {
            const barbero = turno.usuarios_turnos_codBarberoTousuarios;
            const cliente = turno.usuarios_turnos_codClienteTousuarios;
            const currentForm = formData[turno.codTurno] || {
              codCorte: "",
              precioTurno: 0,
              metodoPago: "",
            };

            return (
              <li key={turno.codTurno} className={styles.appointmentItem}>
                <div className={styles.appointmentDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fecha:</span>
                    <span className={styles.detailValue}>
                      {formatDate(turno.fechaTurno)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Hora:</span>
                    <span className={styles.detailValue}>
                      {formatTime(turno.horaDesde)} -{" "}
                      {formatTime(turno.horaHasta)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Barbero:</span>
                    <span className={styles.detailValue}>
                      {barbero
                        ? `${barbero.nombre} ${barbero.apellido}`
                        : "Cargando..."}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Cliente:</span>
                    <span className={styles.detailValue}>
                      {cliente
                        ? `${cliente.nombre} ${cliente.apellido}`
                        : "Cargando..."}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Estado:</span>
                    <span
                      className={`${styles.statusBadge} ${styles.statusProgramado}`}
                    >
                      {turno.estado}
                    </span>
                  </div>
                </div>

                {turno.estado === "Programado" && (
                  <div className={styles.actionButtons}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Tipo de Corte:</label>
                      <select
                        className={styles.formSelect}
                        value={currentForm.codCorte}
                        onChange={(e) =>
                          handleFormChange(
                            turno.codTurno,
                            "codCorte",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Seleccione un corte</option>
                        {allCortes.map((cut) => (
                          <option key={cut.codCorte} value={cut.codCorte}>
                            {cut.nombreCorte} - ${cut.valorBase}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Precio:</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={currentForm.precioTurno || ""}
                        onChange={(e) =>
                          handleFormChange(
                            turno.codTurno,
                            "precioTurno",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={!currentForm.codCorte}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Método de Pago:
                      </label>
                      <select
                        className={styles.formSelect}
                        value={currentForm.metodoPago}
                        onChange={(e) =>
                          handleFormChange(
                            turno.codTurno,
                            "metodoPago",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Seleccione método</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="QR">QR</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleCheckOut(turno.codTurno)}
                      className={`${styles.button} ${styles.buttonSuccess}`}
                      disabled={
                        !currentForm.codCorte ||
                        !currentForm.metodoPago ||
                        !currentForm.precioTurno
                      }
                    >
                      Completar y cobrar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BranchAppointments;
