//No se usa

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./appointments.module.css";
import type { AppointmentResponse } from "../../../../../BACK/Schemas/appointmentsSchema";

const ShowAppointment = () => {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);

  useEffect(() => {
    fetch(`/appointments/${appointmentId}`)
      .then((res) => res.json())
      .then((data) => setAppointment(data))
      .catch((err) => console.error("Error al obtener el appointment:", err));
  }, [appointmentId]);

  if (!appointment) return <div className={styles.loadingState}>Cargando Turno...</div>;

  return (
    <div className={styles.appointmentInfo}>
      <h1 className={styles.pageTitle}>Detalles del Turno</h1>
      <div className={styles.appointmentTitle}>Turno #{appointment.codTurno}</div>
      <div className={styles.appointmentCode}>ID: {appointment.codTurno}</div>
      <div className={styles.appointmentDetails}>
        <span className={styles.appointmentDate}>
          Fecha: {new Date(appointment.fechaTurno).toLocaleDateString()}
        </span>
        {appointment.horaDesde && (
          <span className={styles.appointmentTime}>
            Hora desde: {new Date(appointment.horaDesde).toISOString().substring(11, 16)}
          </span>
        )}
        {appointment.precioTurno !== undefined && (
          <span className={styles.appointmentTime}>Precio: ${appointment.precioTurno}</span>
        )}
      </div>
    </div>
  );
  };

export default ShowAppointment;
