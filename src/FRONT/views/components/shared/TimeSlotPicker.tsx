import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./TimeSlotPicker.module.css";
import { apiFetchJson } from "../../lib/apiFetch.ts";

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
    initialDate || getTomorrowDate(),
  );
  const [fechaTurno, setFechaTurno] = useState<string>(
    (initialDate || getTomorrowDate()).toISOString().split("T")[0],
  );
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

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
    if (!isFirstRender.current) {
      setLoadingHorarios(true);
    } else {
      isFirstRender.current = false;
    }

    // Ir directamente al endpoint correcto según el tipo
    const endpoint = isBarbero
      ? `/turnos/barber/${codigo}/${fechaTurno}`
      : `/turnos/available/${fechaTurno}/${codigo}`;

    console.log("Llamando a endpoint:", endpoint);

    apiFetchJson<Horario[]>(endpoint)
      .then((horariosData) => {
        const list = horariosData.filter((item) => item && item.hora);

        setHorarios(list);
        setLoading(false);
        setLoadingHorarios(false);
      })
      .catch((error) => {
        console.error("Error fetching horarios:", error);
        setError(error.message || "Error al obtener horarios");
        setLoading(false);
        setLoadingHorarios(false);
      });
  }, [codigo, fechaTurno, isBarbero]);

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

  const isWeekday = (date: Date) => {
    return date.getDay() >= 1 && date.getDay() <= 6;
  };

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
          filterDate={isWeekday}
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
