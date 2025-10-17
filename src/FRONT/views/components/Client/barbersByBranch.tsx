import { useEffect, useState } from "react";
import styles from "./barbersByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../login/AuthContext.tsx";

interface Barbero {
  codUsuario: string;
  codSucursal: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

const BarbersByBranch = () => {
  const params = useParams();
  const { codSucursal, fechaTurno, horaDesde } = params;
  const { user, isAuthenticated } = useAuth(); // Agregar isAuthenticated

  const isHorario = !!fechaTurno && !!horaDesde;

  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
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

  useEffect(() => {
    console.log(
      "codSucursal from params:",
      codSucursal,
      "- Selecciono el horario:",
      isHorario
    );

    if (!codSucursal) {
      setError("No se encontró el código de sucursal");
      setLoading(false);
      return;
    }

    const endpoint = isHorario
      ? `/usuarios/schedule/${codSucursal}/${fechaTurno}/${horaDesde}`
      : `/usuarios/branch/${codSucursal}`;

    console.log("Fetching barbers from endpoint:", endpoint);

    fetch(endpoint)
      .then(async (res) => {
        console.log("Response status:", res.status);

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Expected JSON but received:", text.substring(0, 100));
          throw new Error("El servidor no devolvió datos JSON válidos");
        }

        return res.json();
      })
      .then((data) => {
        console.log(
          "Data received:",
          data,
          "Type:",
          typeof data,
          "Is Array:",
          Array.isArray(data)
        );
        // Extract the actual array from the response object
        const barbersArray = data.data || data; // Use data.data if it exists, otherwise fallback to data
        setBarberos(Array.isArray(barbersArray) ? barbersArray : []);
      })
      .catch((error) => {
        console.error("Error al obtener barberos:", error);
        setError(error.message);
        setBarberos([]); // Ensure it's an empty array on error
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
    setSelectedBarber(codUsuario);
    setShowSchedule(true);
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
      });

      const response = await fetch("/turnos", {
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
        }),
      });

      console.log("Response status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          toast.error("Error al procesar respuesta del servidor", {
            id: toastId,
          });
          return;
        }
      } else {
        toast.error("Respuesta vacía del servidor", { id: toastId });
        return;
      }

      if (response.ok) {
        toast.success("Turno reservado exitosamente", {
          id: toastId,
        });
        setSelectedBarber(null);

        navigate("/");
      } else {
        toast.error("Error al reservar turno", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.barbersContainer}>
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
              className={styles.barberItem}
              onClick={() => handleSelectBarber(barbero.codUsuario)} // Add click handler
              style={{ cursor: "pointer" }}
            >
              <div className={styles.barberName}>
                {barbero.apellido}, {barbero.nombre}
              </div>
              <div className={styles.barberPhone}>Tel: {barbero.telefono}</div>
            </li>
          ))
        )}
      </ul>

      {barberos.length > 0 && (
        <div>
          {isHorario ? (
            <button
              className={styles.backButton}
              onClick={handleSubmit}
              disabled={!selectedBarber}
            >
              Confirmar Turno
            </button>
          ) : (
            <button
              className={styles.backButton}
              onClick={handleSchedule}
              disabled={!selectedBarber}
            >
              Seleccionar Horario
            </button>
          )}
        </div>
      )}
      {showSchedule && (
        <div className={styles.optionsContainer}>
          <button className={`${styles.button} ${styles.buttonPrimary} ${styles.optionButton}`} onClick={handleSchedule}>
            <span aria-hidden="true" style={{display: 'inline-flex', alignItems: 'center'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 7V12L15.5 14.5" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Ver horarios disponibles</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BarbersByBranch;
