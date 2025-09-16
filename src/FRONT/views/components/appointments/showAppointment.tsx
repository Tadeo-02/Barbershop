import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./appointments.module.css";

interface Appointment {
  appointmentId: number;
  appointmentDate: string;
  appointmentPrice: number;
}

const ShowAppointment = () => {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetch(`/appointments/${appointmentId}`)
      .then((res) => res.json())
      .then((data) => setAppointment(data))
      .catch((err) => console.error("Error al obtener el appointment:", err));
  }, [appointmentId]);

  if (!appointment)
    return <div className={styles.loadingState}>Cargando Turno...</div>;

  return (
        <div className={styles.appointmentInfo}>
      <h1 className={styles.pageTitle}>Detalles del Turno</h1>
          <div className={styles.appointmentTitle}>Turno #{appointment.appointmentId}</div>
          <div className={styles.appointmentCode}>ID: {appointment.appointmentId}</div>
          <div className={styles.appointmentDetails}>
            <span className={styles.appointmentDate}>
              Fecha: {new Date(appointment.appointmentDate).toLocaleDateString()}
            </span>
            <span className={styles.appointmentTime}>
              Precio: ${appointment.appointmentPrice}
            </span>
          </div>
    </div>
  );
  };

export default ShowAppointment;
