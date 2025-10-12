import { useEffect, useState } from "react";
import styles from "./scheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Horario {
  barbero: string;
  fecha: string;
  hora: string;
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const ScheduleByBranch = () => {
  const { codSucursal } = useParams();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [fechaTurno, setFechaTurno] = useState<string>(tomorrow());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(tomorrow()));
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("codSucursal from params:", codSucursal);

    if (!codSucursal) {
      setError("No se encontró el código de sucursal");
      setLoading(false);
      return;
    }

    // Si no es la carga inicial, mostrar loading de horarios
    if (!loading) {
      setLoadingHorarios(true);
    }

    fetch(`/turnos/available/${fechaTurno || tomorrow()}/${codSucursal}`)
      .then(async (res) => {
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.get("content-type"));

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
        console.log("Fetched response:", response);

        if (response.success && Array.isArray(response.data)) {
          setHorarios(response.data);
        } else if (Array.isArray(response)) {
          // En caso de que el backend devuelva directamente el array
          setHorarios(response);
        } else {
          console.error("Unexpected response format:", response);
          setHorarios([]);
        }
        setLoading(false);
        setLoadingHorarios(false);
      })
      .catch((error) => {
        console.error("Error fetching horarios:", error);
        setError(error.message || "Error al obtener horarios");
        setLoading(false);
        setLoadingHorarios(false);
      });
  }, [codSucursal, fechaTurno, loading]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      setFechaTurno(formattedDate);
      // Resetear horario seleccionado cuando cambia la fecha
      setSelectedHorario(null);
    }
  };

  const handleHorarioClick = (hora: string) => {
    setSelectedHorario(hora);
  };

  const handleNavigateToBarbers = () => {
    if (selectedHorario) {
      navigate(
        `/branches/${codSucursal}/schedule/${fechaTurno}/${selectedHorario}/barbers`
      );
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
      <h2>Elige un horario</h2>

      <div className={styles.datePickerContainer}>
        <label htmlFor="datepicker">Selecciona una fecha:</label>
        <DatePicker
          id="datepicker"
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={new Date(tomorrow())}
          dateFormat="yyyy-MM-dd"
          placeholderText="Selecciona una fecha"
          className={styles.datePicker}
        />
      </div>

      <ul className={styles.scheduleList}>
        <label htmlFor="datepicker">Selecciona una hora:</label>
        {loadingHorarios ? (
          <li key="loading-horarios" className={styles.emptyState}>
            Cargando horarios...
          </li>
        ) : horarios.length === 0 ? (
          <li key="empty-state" className={styles.emptyState}>
            No hay horarios disponibles este día.
          </li>
        ) : (
          horarios.map((horario) => (
            <li
              key={horario.hora}
              className={`${styles.scheduleItem} ${
                selectedHorario === horario.hora ? styles.selected : ""
              }`}
              onClick={() => handleHorarioClick(horario.hora)}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.scheduleHour}>{horario.hora}</div>
            </li>
          ))
        )}
      </ul>
      {horarios.length > 0 && (
        <div>
          <button
            className={styles.backButton}
            onClick={handleNavigateToBarbers}
            disabled={!selectedHorario || !fechaTurno}
          >
            Seleccionar Barbero
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleByBranch;
