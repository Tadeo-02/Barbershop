import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";
import { apiFetch } from "../../../lib/apiFetch";
import type { Category } from "../../../../types/category";
import logger from "../../../lib/logger";

const ShowCategories = () => {
  const { codCategoria } = useParams();
  const [categoria, setCategoria] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleBack = () => {
    // If there is previous browser history, go back.
    // Otherwise, navigate to the category list as a fallback. That page won't work for customers, but at least they won't be left on a blank page.
    if (
      typeof window !== "undefined" &&
      window.history &&
      window.history.length > 1
    ) {
      navigate(-1);
    } else {
      navigate("/Admin/CategoriesPage");
    }
  };

  useEffect(() => {
    const fetchCategoria = async () => {
      try {
        const res = await apiFetch(`/categorias/${codCategoria}`);
        const data = await res.json();
        setCategoria(data);
      } catch (err) {
        logger.error("Error al obtener la categoría:", err);
        toast.error("Error al cargar los datos de la categoría");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoria();
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
        <div className={styles.categoryDescription}>
          Descripción: {categoria.descCategoria}
        </div>
        <div className={styles.categoryDiscounts}>
          <div className={styles.discountItem}>
            <strong>Descuento en Cortes:</strong> {categoria.descuentoCorte}%
          </div>
          <div className={styles.createButtonWrapper}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary} ${styles.createButton}`}
              onClick={handleBack}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowCategories;
