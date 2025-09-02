import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"; // ✅ Importar toast

interface Categoria {
  codCategoria: string; // ✅ String según schema
  nombreCategoria: string; // ✅ Campo correcto
  descCategoria: string;
  descuentoCorte: number; // ✅ Campos nuevos
  descuentoProducto: number;
}

const ShowCategoria = () => {
  const { codCategoria } = useParams();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Estado de loading

  useEffect(() => {
    fetch(`/categorias/${codCategoria}`)
      .then((res) => res.json())
      .then((data) => setCategoria(data))
      .catch((err) => {
        console.error("Error al obtener la categoría:", err);
        toast.error("Error al cargar los datos de la categoría"); // ✅ Toast en lugar de console
      })
      .finally(() => {
        setLoading(false); // ✅ Terminar loading
      });
  }, [codCategoria]);

  // ✅ Estado de loading
  if (loading) {
    return <div className={styles.loadingState}>Cargando categoría...</div>;
  }

  // ✅ Estado de error/no encontrado
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
        {/* ✅ Usar campo correcto */}
        <div className={styles.categoryTitle}>{categoria.nombreCategoria}</div>
        <div className={styles.categoryCode}>
          Código: {categoria.codCategoria}
        </div>
        <div className={styles.categoryDescription}>
          Descripción: {categoria.descCategoria}
        </div>
        {/* ✅ Mostrar nuevos campos de descuentos */}
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

export default ShowCategoria;
