import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";

const ModificarCategoria: React.FC = () => {
  const { codCategoria } = useParams<{ codCategoria: string }>();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<any | null>(null); // Use 'any' type
  const [nomCategoria, setNomCategoria] = useState("");
  const [descCategoria, setDescCategoria] = useState("");

  useEffect(() => {
    const fetchCategoria = async () => {
      try {
        const response = await fetch(`/categorias/${codCategoria}`);
        if (response.ok) {
          const data = await response.json();
          setCategoria(data);
          setNomCategoria(data.nomCategoria);
          setDescCategoria(data.descCategoria);
        } else {
          console.error("Failed to fetch categoria");
          alert("Error al cargar la categoría");
        }
      } catch (error) {
        console.error("Error fetching categoria:", error);
        alert("Error de conexión al cargar la categoría");
      }
    };

    if (codCategoria) {
      fetchCategoria();
    }
  }, [codCategoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/categorias/${codCategoria}?_method=PUT`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nomCategoria, descCategoria }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/categorias/indexCategorias");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating categoria:", error);
      alert("Error de conexión");
    }
  };

  if (!categoria) {
    return <div className={styles.loadingState}>Cargando categoría...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Categoría</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="nomCategoria">
            Nombre de la Categoría:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="nomCategoria"
            id="nomCategoria"
            value={nomCategoria}
            onChange={(e) => setNomCategoria(e.target.value)}
            required
          />
        </div>
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
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default ModificarCategoria;
