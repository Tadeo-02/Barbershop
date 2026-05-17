import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  isAbortError,
  useAbortController,
} from "../../shared/useAbortController";

const CategorySchema = z.object({
  nombreCategoria: z.string().min(1, "Nombre requerido"),
  descCategoria: z.string().min(10, "Descripción requerida"),
  descuentoCorte: z.number().min(0, "Mínimo 0").max(100, "Máximo 100"),
  descuentoProducto: z.number().min(0, "Mínimo 0").max(100, "Máximo 100"),
});

type CategoryForm = z.infer<typeof CategorySchema>;

const UpdateCategories: React.FC = () => {
  const { codCategoria } = useParams<{ codCategoria: string }>();
  const navigate = useNavigate();
  const { renew: renewFetchAbort, abort: abortFetchAbort } =
    useAbortController();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({
    resolver: zodResolver(CategorySchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const controller = renewFetchAbort();
    const toastId = toast.loading("Cargando datos de la categoría...");

    const fetchCategoria = async () => {
      try {
        const response = await fetch(`/categorias/${codCategoria}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          // set form values
          reset({
            nombreCategoria: data.nombreCategoria || "",
            descCategoria: data.descCategoria || "",
            descuentoCorte: data.descuentoCorte ?? 0,
            descuentoProducto: data.descuentoProducto ?? 0,
          });
          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Categoría no encontrada", { id: toastId });
          navigate("/Admin/CategoriesPage");
        } else {
          toast.error("Error al cargar los datos de la categoría", {
            id: toastId,
          });
        }
      } catch (err: unknown) {
        if (isAbortError(err)) {
          toast.dismiss(toastId);
          return;
        }
        console.error("Error fetching categoria:", err);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchCategoria();
    return abortFetchAbort;
  }, [codCategoria, navigate, reset, renewFetchAbort, abortFetchAbort]);

  const onSubmit = async (values: CategoryForm) => {
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Actualizando categoría...");
    try {
      // Use PUT to update the category
      const res = await fetch(`/categorias/${codCategoria}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      await res.json();
      if (res.ok) {
        toast.success("Categoría actualizada exitosamente", { id: toastId });
        navigate("/Admin/CategoriesPage");
      } else {
        toast.error("Error al actualizar categoría", { id: toastId });
      }
    } catch (err: unknown) {
      if (isAbortError(err)) {
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
            <input
              className={styles.formInput}
              type="text"
              id="nombreCategoria"
              {...register("nombreCategoria")}
              required
            />
            {errors.nombreCategoria && (
              <div className={styles.errorMessage}>
                {errors.nombreCategoria.message as string}
              </div>
            )}
          </div>
          {/* DESCRIPCION CATEGORIA */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="descCategoria">
              Descripción:
            </label>
            <textarea
              className={styles.formTextarea}
              id="descCategoria"
              rows={4}
              {...register("descCategoria")}
              required
            />
            {errors.descCategoria && (
              <div className={styles.errorMessage}>
                {errors.descCategoria.message as string}
              </div>
            )}
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
            {errors.descuentoCorte && (
              <div className={styles.errorMessage}>
                {errors.descuentoCorte.message as string}
              </div>
            )}
          </div>


          <div className={styles.detailsActionButtons}>
            <button
              className={`${styles.button} ${styles.buttonSuccess} ${styles.createButton}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonPrimary} ${styles.createButton}`}
              onClick={() => navigate("/Admin/CategoriesPage")}
            >
              Volver
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateCategories;
