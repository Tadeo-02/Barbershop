import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from './turnos.module.css';

interface Turno {
  codTurno: number;
  fechaTurno: string;
}

const IndexTurnos = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  useEffect(() => {
    // Llama al backend para obtener los turnos
    fetch("/turnos")
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
      const response = await fetch(`/turnos/${codTurno}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Turno eliminado correctamente.");
        // Actualizar la lista de turnos removiendo el turno eliminado
        setTurnos(turnos.filter(turno => turno.codTurno !== codTurno));
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
    <div className={styles.indexTurnos}>
      <h2>Gestión de Turnos</h2>
      {turnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay turnos disponibles.</p>
        </div>
      ) : (
        <ul>
          {turnos.map((turno, idx) => (
            <li key={idx}>
              <div className={styles.turnoInfo}>
                <div className={styles.turnoTitle}>
                  Turno #{turno.codTurno}
                </div>
                <div className={styles.turnoCode}>
                  Código: {turno.codTurno}
                </div>
                <div className={styles.turnoDetails}>
                  <span className={styles.turnoFecha}>
                    Fecha: {new Date(turno.fechaTurno).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Link 
                  to={`/turnos/${turno.codTurno}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Ver Detalles
                </Link>
                <Link 
                  to={`/turnos/modificarTurno/${turno.codTurno}`} 
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
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

export default IndexTurnos;


