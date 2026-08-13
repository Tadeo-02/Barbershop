import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";
import { CategorySchema } from "../../../../../BACK/Schemas/categoriesSchema";
import type { z } from "zod";
import { apiFetch } from "../../../lib/apiFetch";

// Inferir tipo desde el schema existente en BACK y mapear a los nombres que usa el frontend
type Categoria = z.infer<typeof CategorySchema>;

const ShowCategories = () => {
  const { codCategoria } = useParams();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleBack = () => {
    // Si hay un historial previo en el navegador, ir atrás.
    // Si no, navegar a la lista de categorías como fallback. Esa página no va a funcionar para los clientes, pero al menos no se van a quedar en una página vacía.
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
        console.error("Error al obtener la categoría:", err);
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
