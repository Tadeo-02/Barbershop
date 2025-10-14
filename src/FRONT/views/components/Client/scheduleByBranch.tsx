import { useEffect, useState } from "react";
import styles from "./scheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { useAuth } from "../login/AuthContext.tsx";

interface Horario {
  hora: string; // Solo hora, simplificado
}

interface HorarioResponse {
  hora: string;
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Inicio del día de mañana
  // console.log("Hoy:", today.toDateString());
  // console.log("Mañana (minDate):", tomorrow.toDateString());
  return tomorrow;
};

const ScheduleByBranch = () => {
  const params = useParams();
  const { codSucursal, codBarbero } = params;
  const { user, isAuthenticated } = useAuth(); // Agregar isAuthenticated

  // Determinar qué código usar y el tipo
  const codigo = codSucursal || codBarbero;
  const isBarbero = !!codBarbero;

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrowDate());
  const [fechaTurno, setFechaTurno] = useState<string>(selectedDate.toISOString().split("T")[0]);
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
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
    console.log("Código from params:", codigo, "- Es barbero:", isBarbero);

    if (!codigo) {
      setError("No se encontró el código");
      setLoading(false);
      return;
    }

    // Mostrar loading de horarios al cambiar fecha/código
    if (!loading) {
      setLoadingHorarios(true);
    }

    // Ir directamente al endpoint correcto según el tipo
    const endpoint = isBarbero
      ? `/turnos/barber/${codigo}/${fechaTurno || tomorrow()}`
      : `/turnos/available/${fechaTurno || tomorrow()}/${codigo}`;

    // console.log("Llamando a endpoint:", endpoint);

    fetch(endpoint)
      .then(async (res) => {
        // console.log("Response status:", res.status);
        // console.log("Response headers:", res.headers.get("content-type"));

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Expected JSON but received:", text.substring(0, 100));
          throw new Error("El servidor no devolvió datos JSON válidos");
        }

        return res.json();
      })
      .then((response) => {
        // console.log("Fetched response:", response);

        // Ambos endpoints devuelven objetos con propiedad 'hora'
        let horariosData: Horario[] = [];

        if (response.success && Array.isArray(response.data)) {
          // Si viene en formato { success: true, data: [...] }
          horariosData = response.data.filter(
            (item: HorarioResponse) => item && item.hora
          );
        } else if (Array.isArray(response)) {
          // Si viene directamente como array
          horariosData = response.filter(
            (item: HorarioResponse) => item && item.hora
          );
        } else {
          console.error("Unexpected response format:", response);
          horariosData = [];
        }

        // console.log("Processed horariosData:", horariosData);
        setHorarios(horariosData);
        setLoading(false);
        setLoadingHorarios(false);
      })
      .catch((error) => {
        console.error("Error fetching horarios:", error);
        setError(error.message || "Error al obtener horarios");
        setLoading(false);
        setLoadingHorarios(false);
      });
  }, [codigo, fechaTurno, loading, isBarbero]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      setFechaTurno(formattedDate);
      setSelectedHorario(null);
    }
  };

  const handleHorarioClick = (hora: string) => {
    setSelectedHorario(hora);
  };

  const handleNavigateToBarbers = () => {
    if (selectedHorario) {
      if (isBarbero) {
        // Si es barbero específico, ir a confirmación
        navigate(
          `/barbers/${codigo}/appointments/${fechaTurno}/${selectedHorario}/confirm`
        );
      } else {
        // Si es sucursal, ir a seleccionar barbero
        navigate(
          `/branches/${codigo}/schedule/${fechaTurno}/${selectedHorario}/barbers`
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // CORREGIR: mover preventDefault al principio

    // Validar autenticación
    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesión para reservar un turno");
      navigate("/login");
      return;
    }

    // Validar selecciones
    if (!selectedHorario || !fechaTurno) {
      toast.error("Por favor selecciona fecha y horario");
      return;
    }

    // Validar que tenemos el código del barbero
    if (!isBarbero || !codBarbero) {
      toast.error("Error: No se encontró el código del barbero");
      return;
    }

    const toastId = toast.loading("Creando Turno..."); // CORREGIR mensaje

    try {
      // Calcular horaHasta
      const horaHasta = calculateHoraHasta(selectedHorario);

      console.log("Enviando POST a /turnos con datos:", {
        codCliente: user.codUsuario,
        codBarbero: codBarbero, // Usar codBarbero de params, no codigo genérico
        fechaTurno: fechaTurno,
        horaDesde: selectedHorario,
        horaHasta: horaHasta,
      });

      const response = await fetch("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codCliente: user.codUsuario,
          codBarbero: codBarbero, // CORREGIR: usar codBarbero específico
          fechaTurno: fechaTurno,
          horaDesde: selectedHorario,
          horaHasta: horaHasta, // CORREGIR: usar horaHasta calculada
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
        setSelectedHorario(null);
        setFechaTurno(tomorrow());
        setSelectedDate(getTomorrowDate());

        navigate("");
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

  if (loading) {
    return <div className={styles.loadingState}>Cargando horarios...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Error: {error}</div>;
  }

  return (
    <div className={styles.scheduleContainer}>
      <h2>
        {isBarbero ? "Horarios disponibles del barbero" : "Elige un horario"}
      </h2>

      <div className={styles.datePickerContainer}>
        <label htmlFor="datepicker">Selecciona una fecha:</label>
        <DatePicker
          id="datepicker"
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={getTomorrowDate()}
          dateFormat="yyyy-MM-dd"
          placeholderText="Selecciona una fecha"
          className={styles.datePicker}
        />
      </div>

      <ul className={styles.scheduleList}>
        <label>Selecciona una hora:</label>
        {loadingHorarios ? (
          <li key="loading-horarios" className={styles.emptyState}>
            Cargando horarios...
          </li>
        ) : horarios.length === 0 ? (
          <li key="empty-state" className={styles.emptyState}>
            No hay horarios disponibles este día.
          </li>
        ) : (
          horarios.map((horario, index) => {
            if (!horario || !horario.hora) {
              console.warn("Invalid horario object:", horario);
              return null;
            }
            return (
              <li
                key={`${horario.hora}-${index}`}
                className={`${styles.scheduleItem} ${
                  selectedHorario === horario.hora ? styles.selected : ""
                }`}
                onClick={() => handleHorarioClick(horario.hora)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.scheduleHour}>{horario.hora}</div>
              </li>
            );
          })
        )}
      </ul>

      {horarios.length > 0 && (
        <div>
          {isBarbero ? (
            <button
              className={styles.backButton}
              onClick={handleSubmit}
              disabled={!selectedHorario}
            >
              Confirmar Turno
            </button>
          ) : (
            <button
              className={styles.backButton}
              onClick={handleNavigateToBarbers}
              disabled={!selectedHorario}
            >
              Seleccionar Barbero
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleByBranch;
