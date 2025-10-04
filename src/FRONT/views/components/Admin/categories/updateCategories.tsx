import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";

interface Categoria {
  codCategoria: string;
  nombreCategoria: string;
  descCategoria: string;
  descuentoCorte: number;
  descuentoProducto: number;
}

const UpdateCategories: React.FC = () => {
  const { codCategoria } = useParams<{ codCategoria: string }>();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [descCategoria, setDescCategoria] = useState("");
  const [descuentoCorte, setDescuentoCorte] = useState("");
  const [descuentoProducto, setDescuentoProducto] = useState("");

  useEffect(() => {
    // Esta flag se usa para que no se vean 2 toast mientras cargan los datos
    //todo Solucion parcial
    let isMounted = true; // Flag para controlar si el componente está montado

    const fetchCategoria = async () => {
      const toastId = toast.loading("Cargando datos de la categoría...");

      try {
        const response = await fetch(`/categorias/${codCategoria}`);

        if (!isMounted) return; // Si el componente se desmontó, no continuar

        if (response.ok) {
          const data = await response.json();
          setCategoria(data);
          setNombreCategoria(data.nombreCategoria);
          setDescCategoria(data.descCategoria);
          setDescuentoCorte(data.descuentoCorte.toString());
          setDescuentoProducto(data.descuentoProducto.toString());
          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Categoría no encontrada", { id: toastId });
          navigate("/categorias/indexCategorias");
        } else {
          toast.error("Error al cargar los datos de la categoría", {
            id: toastId,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching categoria:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchCategoria();

    // Cleanup function para evitar duplicación
    return () => {
      isMounted = false;
    };
  }, [codCategoria, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Actualizando categoría...");

    try {
      const response = await fetch(`/categorias/${categoria?.codCategoria}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreCategoria,
          descCategoria,
          descuentoCorte: Number(descuentoCorte),
          descuentoProducto: Number(descuentoProducto),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Categoría actualizada exitosamente", {
          id: toastId,
        });
        navigate("/Admin/CategoriesPage");
      } else {
        toast.error(data.message || "Error al actualizar categoría", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error updating categoria:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  if (!categoria) {
    return <div className={styles.loadingState}>Cargando categoría...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Categoría</h1>
      <form onSubmit={handleSubmit}>
        {/* NOMBRE CATEGORIA */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="nombreCategoria">
            Nombre de la Categoría:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="nombreCategoria"
            id="nombreCategoria"
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            required
          />
        </div>
        {/* DESCRIPCION CATEGORIA */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="descCategoria">
            Descripción:
          </label>
          <textarea
            className={styles.formTextarea}
            name="descCategoria"
            id="descCategoria"
            value={descCategoria}
            onChange={(e) => setDescCategoria(e.target.value)}
            rows={4}
            required
          />
        </div>

        {/* DESCUENTO CORTES */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="descuentoCorte">
            Descuento en Cortes (%):
          </label>
          <input
            className={styles.formInput}
            type="number"
            name="descuentoCorte"
            id="descuentoCorte"
            value={descuentoCorte}
            onChange={(e) => setDescuentoCorte(e.target.value)}
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>
        {/* DESCUENTO PRODUCTO */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="descuentoProducto">
            Descuento en Productos (%):
          </label>
          <input
            className={styles.formInput}
            type="number"
            name="descuentoProducto"
            id="descuentoProducto"
            value={descuentoProducto}
            onChange={(e) => setDescuentoProducto(e.target.value)}
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.buttonSuccess}`}
            type="submit"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateCategories;
