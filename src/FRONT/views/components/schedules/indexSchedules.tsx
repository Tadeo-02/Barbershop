import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./schedules.module.css";

interface Horario {
  codHorario: number;
  fecha: string;
  horaDesde: string;
  horaHasta: string;
  estado: string;
}

const IndexSchedules = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);

  useEffect(() => {
    // llama al backend para obtener los horarios
    fetch("/schedules")
      .then((res) => res.json())
      .then((data) => {
        setHorarios(data); // data debe ser un array de horarios
        console.log("Horarios recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener horarios:", error);
      });
  }, []);

  const handleDelete = async (codHorario: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés borrar este horario?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/schedules/${codHorario}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Horario eliminado correctamente.");
        // actualizar la lista de horarios removiendo el horario eliminado
        setHorarios(
          horarios.filter((horario) => horario.codHorario !== codHorario)
        );
      } else if (response.status === 404) {
        alert("Horario no encontrado.");
      } else {
        alert("Error al borrar el horario.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className={styles.indexSchedules}>
      <h2>Gestión de Horarios</h2>
      {horarios.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay horarios disponibles.</p>
        </div>
      ) : (
        <ul>
          {horarios.map((horario, idx) => (
            <li key={idx}>
              <div className={styles.scheduleInfo}>
                <div className={styles.scheduleTitle}>
                  Horario #{horario.codHorario}
                </div>
                <div className={styles.scheduleCode}>
                  Código: {horario.codHorario}
                </div>
                <div className={styles.scheduleDetails}>
                  <span className={styles.scheduleDate}>
                    Fecha: {new Date(horario.fecha).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  to={`/schedules/${horario.codHorario}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Ver Detalles
                </Link>
                <Link
                  to={`/schedules/updateSchedules/${horario.codHorario}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(horario.codHorario)}
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

export default IndexSchedules;
