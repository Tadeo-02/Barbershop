import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"; // ✅ Importar librería de alertas

const CreateCategorias: React.FC = () => {
  const navigate = useNavigate();
  // ✅ Estados actualizados según el schema
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [descCategoria, setDescCategoria] = useState("");
  const [descuentoCorte, setDescuentoCorte] = useState("");
  const [descuentoProducto, setDescuentoProducto] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creando Categoría..."); // ✅ Alert de loading

    try {
      console.log(
        "Enviando POST a /categorias con datos categoría:",
        nombreCategoria,
        descCategoria,
        descuentoCorte,
        descuentoProducto
      );

      const response = await fetch("/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreCategoria,
          descCategoria,
          descuentoCorte: Number(descuentoCorte), // ✅ Convertir a número
          descuentoProducto: Number(descuentoProducto), // ✅ Convertir a número
        }),
      });

      console.log("Después de fetch, status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("Después de JSON.parse, data:", data);
        } catch (parseError) {
          toast.error("Error al parsear JSON", { id: toastId }); // ✅ Toast en lugar de alert
          throw parseError;
        }
      } else {
        toast.error("Respuesta vacía del backend", { id: toastId }); // ✅ Toast consistente
        return;
      }

      if (response.ok) {
        toast.success(data.message || "Categoría creada exitosamente", {
          id: toastId,
        });
        setNombreCategoria("");
        setDescCategoria("");
        setDescuentoCorte("");
        setDescuentoProducto("");
        // ✅ CORREGIR: Usar la ruta correcta de App.tsx
        navigate("/categories/indexCategories");
      } else {
        toast.error(data.message || "Error al crear categoría", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Nueva Categoría</h1>
      <form onSubmit={handleSubmit}>
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
            placeholder="Ej: Premium"
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
            placeholder="Describe los beneficios y características de esta categoría..."
            rows={4}
            required
          />
        </div>

        {/* ✅ Nuevos campos según el schema */}
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
            placeholder="Ej: 15"
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>

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
            placeholder="Ej: 10"
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>

        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Categoría
        </button>
      </form>
    </div>
  );
};

export default CreateCategorias;
