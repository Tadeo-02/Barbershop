import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./schedules.module.css";

interface Schedule {
  codHorario: string;
  codBarbero: string;
  fecha: string;
  horaDesde: string;
  horaHasta: string;
  estado: string;
}

const UpdateSchedule: React.FC = () => {
  const { codHorario } = useParams<{ codHorario: string }>();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [fecha, setFecha] = useState("");
  const [horaDesde, setHoraDesde] = useState("");
  const [horaHasta, setHoraHasta] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`/schedules/${codHorario}`);
        if (response.ok) {
          const data = await response.json();
          setSchedule(data);
          setFecha(data.fecha);
          setHoraDesde(data.horaDesde);
          setHoraHasta(data.horaHasta);
          setEstado(data.estado);
        } else {
          console.error("Failed to fetch schedule");
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
      }
    };

    fetchSchedule();
  }, [codHorario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `/schedules/${schedule?.codHorario}?_method=PUT`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codHorario: schedule?.codHorario,
            codBarbero: schedule?.codBarbero,
            fecha,
            horaDesde,
            horaHasta,
            estado,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/Admin/SchedulesPage"); // Redirigir a la página de administración de horarios
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Error de conexión");
    }
  };

  if (!schedule) {
    return <div className={styles.loadingState}>Cargando Horario...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Horario</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="fecha">
            Fecha:
          </label>
          <input
            className={styles.formInput}
            type="date"
            name="fecha"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={styles.formLabel} htmlFor="horaDesde">
            Hora Desde:
          </label>
          <input
            className={styles.formInput}
            type="time"
            name="horaDesde"
            id="horaDesde"
            value={horaDesde}
            onChange={(e) => setHoraDesde(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={styles.formLabel} htmlFor="horaHasta">
            Hora Hasta:
          </label>
          <input
            className={styles.formInput}
            type="time"
            name="horaHasta"
            id="horaHasta"
            value={horaHasta}
            onChange={(e) => setHoraHasta(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={styles.formLabel} htmlFor="estado">
            Estado:
          </label>
          <select
            className={styles.formInput}
            name="estado"
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            required
          >
            <option value="disponible">Disponible</option>
            <option value="ocupado">Ocupado</option>
          </select>
        </div>
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default UpdateSchedule;
