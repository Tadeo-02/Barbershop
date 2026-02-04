import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"; // importar librería de alerts
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const CreateCategorySchema = z.object({
  nombreCategoria: z.string().min(1, "Nombre requerido"),
  descCategoria: z.string().min(1, "Descripción requerida"),
  descuentoCorte: z.coerce
    .number()
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
  descuentoProducto: z.coerce
    .number()
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
});

type CreateCategoryForm = z.infer<typeof CreateCategorySchema>;

const CreateCategories: React.FC = () => {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryForm>({
    resolver: zodResolver(CreateCategorySchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: CreateCategoryForm) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const toastId = toast.loading("Creando Categoría...");
    try {
      const res = await fetch("/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Categoría creada exitosamente", { id: toastId });
        reset();
        setTimeout(() => navigate("/Admin/CategoriesPage"), 600);
      } else {
        toast.error(data.message || "Error al crear categoría", { id: toastId });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error en handleSubmit:", err);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Nueva Categoría</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting} style={{ border: "none", padding: 0, margin: 0 }}>
          {/* NOMBRE CATEGORIA */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="nombreCategoria">
              Nombre de la Categoría:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="nombreCategoria"
              {...register("nombreCategoria")}
              placeholder="Ej: Premium"
              required
            />
            {errors.nombreCategoria && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>{errors.nombreCategoria.message}</p>
            )}
          </div>
          {/* DESCRIPCIÓN */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="descCategoria">
              Descripción:
            </label>
            <textarea
              className={styles.formTextarea}
              id="descCategoria"
              {...register("descCategoria")}
              placeholder="Describe los beneficios y características de esta categoría..."
              rows={4}
              required
            />
            {errors.descCategoria && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>{errors.descCategoria.message}</p>
            )}
          </div>

          {/* DESCUENTO EN CORTES*/}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="descuentoCorte">
              Descuento en Cortes (%):
            </label>
            <input
              className={styles.formInput}
              type="number"
              id="descuentoCorte"
              min={0}
              max={100}
              step={0.01}
              {...register("descuentoCorte", { valueAsNumber: true })}
              required
            />
            {errors.descuentoCorte && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>{errors.descuentoCorte.message}</p>
            )}
          </div>
          {/* DESCUENTO EN PRODUCTOS */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="descuentoProducto">
              Descuento en Productos (%):
            </label>
            <input
              className={styles.formInput}
              type="number"
              id="descuentoProducto"
              min={0}
              max={100}
              step={0.01}
              {...register("descuentoProducto", { valueAsNumber: true })}
              required
            />
            {errors.descuentoProducto && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>{errors.descuentoProducto.message}</p>
            )}
          </div>

          <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Guardar Categoría"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateCategories;
