import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";

interface Barbero {
  codUsuario: string;
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

const ShowBarbers = () => {
  const { codUsuario } = useParams();
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/barberos/${codUsuario}`)
      .then((res) => res.json())
      .then((data) => setBarbero(data))
      .catch((err) => {
        console.error("Error al obtener el barbero:", err);
        toast.error("Error al cargar los datos del barbero");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [codUsuario]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando barbero...</div>;
  }

  if (!barbero) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontró el barbero.</p>
      </div>
    );
  }

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
        <div className={styles.barberoEmail}>Email: {barbero.email}</div>
      </div>
    </div>
  );
};

export default ShowBarbers;
