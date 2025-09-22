import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [appointmentDate, setAppointmentDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
  console.log("Enviando POST a /appointments con appointmentDate:", appointmentDate);
  const response = await fetch("/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
  body: JSON.stringify({ appointmentDate }),
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
  setAppointmentDate("");
  navigate("/indexAppointments");
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
          <label className={styles.formLabel} htmlFor="appointmentDate">
            Fecha del Turno:
          </label>
          <input
            className={styles.formInput}
            type="date"
            name="appointmentDate"
            id="appointmentDate"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
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

export default CreateAppointment;
