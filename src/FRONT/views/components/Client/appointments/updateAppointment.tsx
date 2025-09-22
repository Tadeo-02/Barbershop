import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";

interface Appointment {
  appointmentId: number;
  appointmentDate: string;
}

const UpdateAppointment: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/appointments/${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          setAppointment(data);
          setAppointmentDate(data.appointmentDate);
        } else {
          console.error("Failed to fetch appointment");
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/appointments/${appointment?.appointmentId}?_method=PUT`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentDate }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/indexAppointments"); // Redirigir a la lista de turnos
      } else {
        alert(data.message);
      }
    } catch (error) { 
      console.error("Error updating appointment:", error);
      alert("Error de conexión");
    }
  };

  if (!appointment) {
    return <div className={styles.loadingState}>Cargando Turno...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Turno</h1>
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
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default UpdateAppointment;
