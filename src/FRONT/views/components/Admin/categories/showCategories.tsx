import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"; 

interface Categoria {
  codCategoria: string;
  nombreCategoria: string;
  descCategoria: string;
  descuentoCorte: number;
  descuentoProducto: number;
}

const ShowCategories = () => {
  const { codCategoria } = useParams();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/categorias/${codCategoria}`)
      .then((res) => res.json())
      .then((data) => setCategoria(data))
      .catch((err) => {
        console.error("Error al obtener la categoría:", err);
        toast.error("Error al cargar los datos de la categoría");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [codCategoria]);

  
  if (loading) {
    return <div className={styles.loadingState}>Cargando categoría...</div>;
  }

  if (!categoria) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontró la categoría.</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Detalles de la Categoría</h1>
      <div className={styles.categoryInfo}>
        <div className={styles.categoryTitle}>{categoria.nombreCategoria}</div>
        <div className={styles.categoryCode}>
          Código: {categoria.codCategoria}
        </div>
        <div className={styles.categoryDescription}>
          Descripción: {categoria.descCategoria}
        </div>
        <div className={styles.categoryDiscounts}>
          <div className={styles.discountItem}>
            <strong>Descuento en Cortes:</strong> {categoria.descuentoCorte}%
          </div>
          <div className={styles.discountItem}>
            <strong>Descuento en Productos:</strong>{" "}
            {categoria.descuentoProducto}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowCategories;
