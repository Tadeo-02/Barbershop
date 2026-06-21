import { useEffect, useState } from "react";
import styles from "./barbersByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../BACK/schemas/branchesSchema.ts";
import { useAuth } from "../user/AuthContext.tsx";
import { apiFetchJson } from "../../lib/apiFetch.ts";
import { ApiError } from "../../lib/apiResponse.ts";

interface Barbero {
  codUsuario: string;
  codSucursal: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

type Sucursal = z.infer<typeof BranchWithIdSchema>;

const BarbersByBranch = () => {
  const params = useParams();
  const { codSucursal, fechaTurno, horaDesde } = params;
  const { user, isAuthenticated } = useAuth(); // Agregar isAuthenticated

  const isHorario = !!fechaTurno && !!horaDesde;

  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Función para calcular horaHasta (30 minutos después)
  const calculateHoraHasta = (horaDesde: string): string => {
    if (!horaDesde) return "";

    const [hours, minutes] = horaDesde.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + 30; // Agregar 30 minutos

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  // Formatea una fecha recibida (posible 'YYYY-MM-DD' o con 'T') a 'DD/MM/AAAA'
  const formatFecha = (fecha?: string | null): string => {
    if (!fecha) return "";
    let f = fecha;
    // Si viene con hora (ISO), tomamos la parte de fecha
    if (f.includes("T")) f = f.split("T")[0];

    if (f.includes("-")) {
      const parts = f.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }
    }

    if (f.includes("/")) return f; // ya está formateada

    // Fallback: intentar parsear con Date
    const d = new Date(f);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return fecha; // si no conseguimos formatear, devolver original
  };

  useEffect(() => {
    console.log(
      "codSucursal from params:",
      codSucursal,
      "- Selecciono el horario:",
      isHorario,
    );

    if (!codSucursal) {
      setError("No se encontró el código de sucursal");
      setLoading(false);
      return;
    }

    // Endpoints: barberos y detalle de sucursal
    const barberosEndpoint = isHorario
      ? `/usuarios/schedule/${codSucursal}/${fechaTurno}/${horaDesde}`
      : `/usuarios/branch/${codSucursal}`;
    const sucursalEndpoint = `/sucursales/${codSucursal}`;

    console.log("Fetching barbers from endpoint:", barberosEndpoint);
    console.log("Fetching sucursal from endpoint:", sucursalEndpoint);

    Promise.all([
      apiFetchJson<Barbero[]>(barberosEndpoint),
      apiFetchJson<Sucursal | Sucursal[]>(sucursalEndpoint),
    ])
      .then(([barberosData, sucursalData]) => {
        setBarberos(barberosData);

        // si la respuesta es un array por alguna razon tomamos el primero
        const sucObj = Array.isArray(sucursalData)
          ? sucursalData[0] || null
          : sucursalData || null;
        setSucursal(sucObj as Sucursal | null);
      })
      .catch((error) => {
        console.error("Error al obtener datos:", error);
        setError(error instanceof ApiError ? error.message : "Error al obtener datos");
        setBarberos([]);
        setSucursal(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [codSucursal, isHorario, fechaTurno, horaDesde]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando barberos...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Error: {error}</div>;
  }

  const handleSelectBarber = (codUsuario: string) => {
    // Toggle selection: if the same barber is clicked again, deselect
    if (selectedBarber === codUsuario) {
      setSelectedBarber(null);
    } else {
      setSelectedBarber(codUsuario);
    }
  };

  const handleSchedule = () => {
    navigate(`/barbers/${selectedBarber}/appointments`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar autenticación
    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesión para reservar un turno");
      navigate("/login");
      return;
    }

    // Validar selecciones
    if (!selectedBarber) {
      toast.error("Por favor selecciona un barbero");
      return;
    }

    // Validar que tenemos el horario y sucursal
    if (!isHorario || !codSucursal || !fechaTurno || !horaDesde) {
      toast.error("Error: No se encontró el horario o sucursal");
      return;
    }

    const toastId = toast.loading("Creando Turno...");
    try {
      // Calcular horaHasta
      const horaHasta = calculateHoraHasta(horaDesde);

      console.log("Enviando POST a /turnos con datos:", {
        codCliente: user.codUsuario,
        codBarbero: selectedBarber,
        fechaTurno: fechaTurno,
        horaDesde: horaDesde,
        horaHasta: horaHasta,
        estado: "Programado",
      });

      await apiFetchJson<{ codTurno: string }>("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codCliente: user.codUsuario,
          codBarbero: selectedBarber,
          fechaTurno: fechaTurno,
          horaDesde: horaDesde,
          horaHasta: horaHasta,
          estado: "Programado",
        }),
      });
      toast.success("Turno reservado exitosamente", {
        id: toastId,
      });
      setSelectedBarber(null);

      navigate("/client/home");
    } catch (error: unknown) {
      const message = ApiError.isApiError(error)
        ? error.message
        : "Error de conexión con el servidor";
      const duplicateMessage = message.includes("ya tiene un turno en ese horario");

      if (duplicateMessage) {
        toast.error(
          "Ya tienes un turno reservado en ese horario. Por favor elige otro horario.",
          {
            id: toastId,
            duration: 2000,
          },
        );
      } else {
        toast.error(message, { id: toastId });
      }
    }
  };

  return (
    <div className={styles.barbersContainer}>
      <div className={styles.infoRow}>
        {sucursal && (
          <div className={styles.branchInfo}>
            <h3>{sucursal.nombre}</h3>
            <p>
              {sucursal.calle}
              {sucursal.altura ? `, ${sucursal.altura}` : ""}
            </p>
          </div>
        )}

        {/* Mostrar horario seleccionado en tarjeta idéntica a la de sucursal */}
        {isHorario && (
          <div className={styles.branchInfo}>
            <h3>Horario </h3>
            <p>
              {formatFecha(fechaTurno)} - {horaDesde}
            </p>
          </div>
        )}
      </div>
      <h2>Elige un barbero</h2>
      <ul className={styles.barberList}>
        {barberos.length === 0 ? (
          <li className={styles.emptyState}>
            No hay barberos disponibles en esta sucursal.
          </li>
        ) : (
          barberos.map((barbero) => (
            <li
              key={barbero.codUsuario}
              className={`${styles.barberItem} ${
                selectedBarber === barbero.codUsuario ? styles.selected : ""
              }`}
              onClick={() => handleSelectBarber(barbero.codUsuario)}
              style={{ cursor: "pointer" }}
              aria-pressed={selectedBarber === barbero.codUsuario}
              role="button"
            >
              <div className={styles.barberName}>
                {barbero.apellido}, {barbero.nombre}
              </div>
              <div className={styles.barberPhone}>Tel: {barbero.telefono}</div>
              {selectedBarber === barbero.codUsuario && (
                <div
                  className={styles.inlineActions}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isHorario ? (
                    <button
                      className={`${styles.backButton} ${styles.inlineButton}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSubmit(event);
                      }}
                      disabled={!selectedBarber}
                    >
                      Confirmar Turno
                    </button>
                  ) : (
                    <button
                      className={`${styles.backButton} ${styles.inlineButton}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSchedule();
                      }}
                      disabled={!selectedBarber}
                    >
                      Seleccionar Horario
                    </button>
                  )}
                </div>
              )}
            </li>
          ))
        )}
      </ul>
      {/* {showSchedule && (
        <div className={styles.optionsContainer}>
          <h3>Ahora elige el horario</h3>
          <button className={styles.optionButton} onClick={handleSchedule}>
            Ver horarios disponibles
          </button>
        </div>
      )} */}
    </div>
  );
};

export default BarbersByBranch;
