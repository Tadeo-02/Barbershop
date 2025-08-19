import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./barberos.module.css";

interface Barbero {
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

const ShowBarbero = () => {
  const { cuil } = useParams(); // si lo pasás como parámetro de URL
  const [barbero, setBarbero] = useState<Barbero | null>(null);

  useEffect(() => {
    fetch(`/barberos/${cuil}`)
      .then((res) => res.json())
      .then((data) => setBarbero(data))
      .catch((err) => console.error("Error al obtener el barbero:", err));
  }, [cuil]);

  if (!barbero)
    return <div className={styles.loadingState}>Cargando barbero...</div>;

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Detalles del Barbero</h1>
      <div className={styles.barberoInfo}>
        <div className={styles.barberoTitle}>
          {barbero.apellido}, {barbero.nombre}
        </div>
        <div className={styles.barberoCode}>CUIL: {barbero.cuil}</div>
        <div className={styles.barberoDisponibilidad}>
          Teléfono: {barbero.telefono}
        </div>
      </div>
    </div>
  );
};

export default ShowBarbero;
