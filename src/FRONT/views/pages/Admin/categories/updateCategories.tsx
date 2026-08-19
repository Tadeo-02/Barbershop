import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAbortController } from "../../../components/shared/useAbortController";
import { apiFetch } from "../../../lib/apiFetch";
import { createResolver } from "../../../lib/zodFormResolver";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";
import { parseBackendResponse } from "../../../lib/backendResponse";

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
    resolver: createResolver(CategorySchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const controller = renewFetchAbort();
    const toastId = toast.loading("Cargando datos de la categoría...");

    const fetchCategoria = async () => {
      try {
        const response = await apiFetch(`/categorias/${codCategoria}`, {
          signal: controller.signal,
        });

        const parsed = await parseBackendResponse<{
          nombreCategoria?: string;
          descCategoria?: string;
          descuentoCorte?: number;
          descuentoProducto?: number;
        }>(response);

        if (parsed.ok) {
          // set form values
          reset({
            nombreCategoria: parsed.data?.nombreCategoria || "",
            descCategoria: parsed.data?.descCategoria || "",
            descuentoCorte: parsed.data?.descuentoCorte ?? 0,
            descuentoProducto: parsed.data?.descuentoProducto ?? 0,
          });
          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Categoría no encontrada", { id: toastId });
          navigate("/Admin/CategoriesPage");
        } else {
          toast.error(
            parsed.message || "Error al cargar los datos de la categoría",
            { id: toastId },
          );
        }
      } catch (err: unknown) {
        if (handleAbortOrConnectionError(err, toastId, "Error de conexión")) {
          return;
        }
        console.error("Error fetching categoria:", err);
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
      const res = await apiFetch(`/categorias/${codCategoria}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      const parsed = await parseBackendResponse(res);
      if (parsed.ok) {
        toast.success(parsed.message || "Categoría actualizada exitosamente", {
          id: toastId,
        });
        navigate("/Admin/CategoriesPage");
      } else {
        toast.error(parsed.message || "Error al actualizar categoría", {
          id: toastId,
        });
      }
    } catch (err: unknown) {
      if (handleAbortOrConnectionError(err, toastId, "Error de conexión")) {
        return;
      }
      console.error("Error updating categoria:", err);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Categoría</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          {/* category name */}
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
          {/* category description */}
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

          {/* hair cut discount */}
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
