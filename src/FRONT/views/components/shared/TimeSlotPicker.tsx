import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./TimeSlotPicker.module.css";

interface Horario {
  hora: string;
}

interface TimeSlotPickerProps {
  codBarbero?: string;
  codSucursal?: string;
  initialDate?: Date;
  onTimeSlotSelect: (fecha: string, hora: string) => void;
  showConfirmButton?: boolean;
  confirmButtonText?: string;
  onConfirm?: () => void;
  minDate?: Date;
}

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  codBarbero,
  codSucursal,
  initialDate,
  onTimeSlotSelect,
  showConfirmButton = false,
  confirmButtonText = "Confirmar",
  onConfirm,
  minDate,
}) => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || getTomorrowDate()
  );
  const [fechaTurno, setFechaTurno] = useState<string>(
    (initialDate || getTomorrowDate()).toISOString().split("T")[0]
  );
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar qué endpoint usar basado en los props
  const isBarbero = !!codBarbero;
  const codigo = codBarbero || codSucursal;

  useEffect(() => {
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
      ? `/turnos/barber/${codigo}/${fechaTurno}`
      : `/turnos/available/${fechaTurno}/${codigo}`;

    console.log("Llamando a endpoint:", endpoint);

    fetch(endpoint)
      .then(async (res) => {
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
        let horariosData: Horario[] = [];

        if (response.success && Array.isArray(response.data)) {
          horariosData = response.data.filter(
            (item: Horario) => item && item.hora
          );
        } else if (Array.isArray(response)) {
          horariosData = response.filter((item: Horario) => item && item.hora);
        } else {
          console.error("Unexpected response format:", response);
          horariosData = [];
        }

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
  }, [codigo, fechaTurno, isBarbero, loading]);

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
    onTimeSlotSelect(fechaTurno, hora);
  };

  const handleConfirm = () => {
    if (onConfirm && selectedHorario) {
      onConfirm();
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando horarios...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Error: {error}</div>;
  }

  // Función para agrupar horarios por período del día
  const groupHorariosByPeriod = () => {
    const manana: Horario[] = [];
    const tarde: Horario[] = [];
    const noche: Horario[] = [];

    horarios.forEach((horario) => {
      if (!horario || !horario.hora) return;

      const hora = parseInt(horario.hora.split(":")[0]);

      if (hora >= 6 && hora < 12) {
        manana.push(horario);
      } else if (hora >= 12 && hora < 18) {
        tarde.push(horario);
      } else {
        noche.push(horario);
      }
    });

    return { manana, tarde, noche };
  };

  const renderHorarioGroup = (horarios: Horario[], title: string) => {
    if (horarios.length === 0) return null;

    return (
      <div key={title} className={styles.horarioGroup}>
        <h4 className={styles.periodTitle}>{title}</h4>
        <div className={styles.scheduleGrid}>
          {horarios.map((horario, index) => (
            <div
              key={`${horario.hora}-${index}`}
              className={`${styles.scheduleItem} ${
                selectedHorario === horario.hora ? styles.selected : ""
              }`}
              onClick={() => handleHorarioClick(horario.hora)}
            >
              <div className={styles.scheduleHour}>{horario.hora}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const { manana, tarde, noche } = groupHorariosByPeriod();

  return (
    <div className={styles.timeSlotContainer}>
      <h3 className={styles.title}>Selecciona fecha y horario</h3>

      <div className={styles.datePickerContainer}>
        <label htmlFor="datepicker">Selecciona una fecha:</label>
        <DatePicker
          id="datepicker"
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={minDate || getTomorrowDate()}
          dateFormat="yyyy-MM-dd"
          placeholderText="Selecciona una fecha"
          className={styles.datePicker}
        />
      </div>

      <div className={styles.horariosContainer}>
        {loadingHorarios ? (
          <div className={styles.emptyState}>Cargando horarios...</div>
        ) : horarios.length === 0 ? (
          <div className={styles.emptyState}>
            No hay horarios disponibles este día.
          </div>
        ) : (
          <>
            {renderHorarioGroup(manana, "Mañana")}
            {renderHorarioGroup(tarde, "Tarde")}
            {renderHorarioGroup(noche, "Noche")}
          </>
        )}
      </div>

      {showConfirmButton && horarios.length > 0 && (
        <button
          className={styles.confirmButton}
          onClick={handleConfirm}
          disabled={!selectedHorario}
        >
          {confirmButtonText}
        </button>
      )}
    </div>
  );
};

export default TimeSlotPicker;
