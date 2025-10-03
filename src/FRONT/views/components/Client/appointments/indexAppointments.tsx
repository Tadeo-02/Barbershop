import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./appointments.module.css";

interface Turno {
  codTurno: number;
  fechaTurno: string;
}

const IndexAppointments = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  useEffect(() => {
    // llama al backend para obtener los turnos
    fetch("/appointments")
      .then((res) => res.json())
      .then((data) => {
        setTurnos(data); // data debe ser un array de turnos
        console.log("Turnos recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener turnos:", error);
      });
  }, []);

  const handleDelete = async (codTurno: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés borrar este turno?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/appointments/${codTurno}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Turno eliminado correctamente.");
        // actualizar la lista de turnos removiendo el turno eliminado
        setTurnos(turnos.filter((turno) => turno.codTurno !== codTurno));
      } else if (response.status === 404) {
        alert("Turno no encontrado.");
      } else {
        alert("Error al borrar el turno.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
  <div className={styles.indexAppointments}>
      <h2>Gestión de Turnos</h2>
      {turnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay turnos disponibles.</p>
        </div>
      ) : (
        <ul>
          {turnos.map((turno, idx) => (
            <li key={idx}>
              <div className={styles.appointmentInfo}>
                <div className={styles.appointmentTitle}>Turno #{turno.codTurno}</div>
                <div className={styles.appointmentCode}>Código: {turno.codTurno}</div>
                <div className={styles.appointmentDetails}>
                  <span className={styles.appointmentDate}>
                    Fecha: {new Date(turno.fechaTurno).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  to={`/appointments/${turno.codTurno}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Ver Detalles
                </Link>
                <Link
                  to={`/appointments/modificarTurno/${turno.codTurno}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <Link
                  to={`/appointments/cancelar/${turno.codTurno}`}
                  className={`${styles.button} ${styles.buttonDanger}`}
                >
                  Cancelar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(turno.codTurno)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexAppointments;
