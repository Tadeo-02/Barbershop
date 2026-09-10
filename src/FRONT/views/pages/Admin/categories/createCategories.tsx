import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"; 
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CategorySchema } from "../../../../../BACK/Schemas/categoriesSchema";
import {
  useAbortController,
} from "../../../components/shared/useAbortController";
import { apiFetch } from "../../../lib/apiFetch";
import { createResolver } from "../../../lib/zodFormResolver";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";
import logger from "../../../lib/logger";

const CreateCategorySchema = CategorySchema.pick({
  nombreCategoria: true,
  descCategoria: true,
  descuentoCorte: true,
  descuentoProducto: true,
});

type CreateCategoryForm = z.infer<typeof CreateCategorySchema>;

const CreateCategories: React.FC = () => {
  const navigate = useNavigate();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryForm>({
    resolver: createResolver(CreateCategorySchema),
    mode: "onBlur",
    defaultValues: {
      descuentoCorte: 0,
      descuentoProducto: 0,
    },
  });

  const onSubmit = async (values: CreateCategoryForm) => {
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Creando Categoría...");
    try {
      const res = await apiFetch("/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      if (res.ok) {
        toast.success("Categoría creada exitosamente", {
          id: toastId,
          duration: 2000,
        });
        reset();
        setTimeout(() => navigate("/Admin/CategoriesPage"), 600);
      } else {
        toast.error("Error al crear categoría", {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (err: unknown) {
      if (handleAbortOrConnectionError(err, toastId, "Error de conexión con el servidor")) {
        return;
      }
      logger.error("Error en handleSubmit:", err);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Nueva Categoría</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset
          disabled={isSubmitting}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
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
              placeholder="Ej: Premium"
              required
            />
            {errors.nombreCategoria && (
              <div className={styles.errorMessage}>
                {errors.nombreCategoria.message}
              </div>
            )}
          </div>
          {/* DESCRIPTION */}
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
              <div className={styles.errorMessage}>
                {errors.descCategoria.message}
              </div>
            )}
          </div>

          {/* DISCOUNT ON CUTS */}
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
                {errors.descuentoCorte.message}
              </div>
            )}
          </div>

          <div className={styles.detailsActionButtons}>
            <button
              className={`${styles.button} ${styles.buttonSuccess}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Guardar Categoría"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonPrimary}`}
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

export default CreateCategories;
