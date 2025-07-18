import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from './turnos.module.css';

interface Turno {
  codTurno: number;
  fechaTurno: string;
  precioTurno: number;
}

const ShowTurno = () => {
  const { codTurno } = useParams(); // si lo pasás como parámetro de URL
  const [turno, setTurno] = useState<Turno | null>(null);

  useEffect(() => {
    fetch(`/turnos/${codTurno}`)
      .then((res) => res.json())
      .then((data) => setTurno(data))
      .catch((err) => console.error("Error al obtener el turno:", err));
  }, [codTurno]);

  if (!turno) return (
    <div className={styles.loadingState}>
      Cargando turno...
    </div>
  );

  return (
    <div className={styles.formContainer}>
      <h1>Detalles del Turno</h1>
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
          <br />
          <span className={styles.turnoHora}>
            Precio: ${turno.precioTurno}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShowTurno;
