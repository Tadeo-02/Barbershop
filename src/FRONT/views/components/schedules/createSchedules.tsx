import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./schedules.module.css";

const CreateSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [scheduleDate, setScheduleDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Enviando POST a /schedules con scheduleDate:", scheduleDate);
      const response = await fetch("/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduleDate }),
      });
      console.log("Después de fetch, status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("Después de JSON.parse, data:", data);
        } catch (parseError) {
          console.error("Error al parsear JSON:", parseError);
          throw parseError;
        }
      } else {
        console.error("Respuesta vacía del backend");
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        alert(data.message);
        setScheduleDate("");
        navigate("/Admin/SchedulesPage");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Turno</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="scheduleDate">
            Fecha:
          </label>
          <input
            className={styles.formInput}
            type="date"
            name="scheduleDate"
            id="scheduleDate"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            required
          />
        </div>
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Turno
        </button>
      </form>
    </div>
  );
};

export default CreateSchedule;
