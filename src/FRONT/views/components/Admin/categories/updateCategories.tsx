import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const CategorySchema = z.object({
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

type CategoryForm = z.infer<typeof CategorySchema>;

const UpdateCategories: React.FC = () => {
  const { codCategoria } = useParams<{ codCategoria: string }>();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({ resolver: zodResolver(CategorySchema), mode: "onBlur" });

  useEffect(() => {
    const ctrl = new AbortController();
    const toastId = toast.loading("Cargando datos de la categoría...");

    const fetchCategoria = async () => {
      try {
        const response = await fetch(`/categorias/${codCategoria}`, { signal: ctrl.signal });

        if (response.ok) {
          const data = await response.json();
          // set form values
          reset({
            nombreCategoria: data.nombreCategoria || "",
            descCategoria: data.descCategoria || "",
            descuentoCorte: data.descuentoCorte ?? undefined,
            descuentoProducto: data.descuentoProducto ?? undefined,
          });
          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Categoría no encontrada", { id: toastId });
          navigate("/Admin/CategoriesPage");
        } else {
          toast.error("Error al cargar los datos de la categoría", { id: toastId });
        }
      } catch (err: any) {
        if (err && err.name === "AbortError") {
          toast.dismiss(toastId);
          return;
        }
        console.error("Error fetching categoria:", err);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchCategoria();
    return () => ctrl.abort();
  }, [codCategoria, navigate, reset]);

  const onSubmit = async (values: CategoryForm) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Actualizando categoría...");
    try {
      // Use POST with ?_method=PUT for compatibility with method-override backends
      const res = await fetch(`/categorias/${codCategoria}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Categoría actualizada exitosamente", { id: toastId });
        navigate("/Admin/CategoriesPage");
      } else {
        toast.error(data.message || "Error al actualizar categoría", { id: toastId });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error updating categoria:", err);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Categoría</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          {/* NOMBRE CATEGORIA */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="nombreCategoria">
              Nombre de la Categoría:
            </label>
            <input className={styles.formInput} type="text" id="nombreCategoria" {...register("nombreCategoria")} required />
            {errors.nombreCategoria && <div className={styles.errorMessage}>{errors.nombreCategoria.message as string}</div>}
          </div>
          {/* DESCRIPCION CATEGORIA */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="descCategoria">
              Descripción:
            </label>
            <textarea className={styles.formTextarea} id="descCategoria" rows={4} {...register("descCategoria")} required />
            {errors.descCategoria && <div className={styles.errorMessage}>{errors.descCategoria.message as string}</div>}
          </div>

          {/* DESCUENTO CORTES */}
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
            {errors.descuentoCorte && <div className={styles.errorMessage}>{errors.descuentoCorte.message as string}</div>}
          </div>
          {/* DESCUENTO PRODUCTO */}
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
            {errors.descuentoProducto && <div className={styles.errorMessage}>{errors.descuentoProducto.message as string}</div>}
          </div>

          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateCategories;
