import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast";

interface Sucursal {
  codSucursal: string;
  nombre: string;
  calle: string;
  altura: number;
}

const ShowBranches = () => {
  const { codSucursal } = useParams();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/sucursales/${codSucursal}`)
      .then((res) => res.json())
      .then((data) => setSucursal(data))
      .catch((err) => {
        console.error("Error al obtener la sucursal:", err);
        toast.error("Error al cargar los datos de la sucursal");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [codSucursal]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando sucursal...</div>;
  }

  if (!sucursal) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontró la sucursal.</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Detalles de la sucursal</h1>
      <div className={styles.sucursalInfo}>
        <div className={styles.sucursalTitle}>
          {sucursal.nombre}
        </div>
        <div className={styles.sucursalCalle}>Calle: {sucursal.calle}</div>
        <div className={styles.sucursalAltura}>Altura: {sucursal.altura}</div>
      </div>
    </div>
  );
};

export default ShowBranches;
