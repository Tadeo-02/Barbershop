import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"; // importar librería de alerts
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const CreateCategorySchema = z.object({
  nombreCategoria: z.string().min(1, "Nombre requerido"),
  descCategoria: z
    .string()
    .min(10, "Descripción requerida. Mínimo 10 caracteres."),
  descuentoCorte: z.coerce
    .number()
    .refine((v) => !Number.isNaN(v), { message: "Ingrese un número." })
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
  descuentoProducto: z.coerce
    .number()
    .refine((v) => !Number.isNaN(v), { message: "Ingrese un número." })
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
});

type CreateCategoryForm = z.infer<typeof CreateCategorySchema>;

const baseResolver = zodResolver(CreateCategorySchema);

const normalizeMessage = (msg: unknown): string | undefined => {
  if (!msg) return undefined;
  const s = String(msg).toLowerCase();
  if (
    s.includes("invalid input") ||
    s.includes("received nan") ||
    s.includes("expected number")
  ) {
    return "Ingrese un número válido";
  }
  return String(msg);
};

const createCategoryResolver: Resolver<CreateCategoryForm> = async (
  values,
  context,
  options,
) => {
  const result = await baseResolver(values, context, options);

  if (result.errors) {
    const errors = result.errors;
    for (const key of Object.keys(errors)) {
      const err = errors[key as keyof typeof errors];
      if (!err || typeof err !== "object" || !("message" in err)) continue;
      const normalized = normalizeMessage(
        (err as { message?: unknown }).message,
      );
      if (normalized) {
        (err as { message?: unknown }).message = normalized;
      }
    }
  }

  return result;
};

const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "AbortError");

const CreateCategories: React.FC = () => {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryForm>({
    resolver: createCategoryResolver,
    mode: "onBlur",
    defaultValues: {
      descuentoCorte: 0,
      descuentoProducto: 0,
    },
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
      if (isAbortError(err)) {
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
        <fieldset
          disabled={isSubmitting}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
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
              <div className={styles.errorMessage}>
                {errors.nombreCategoria.message}
              </div>
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
              <div className={styles.errorMessage}>
                {errors.descCategoria.message}
              </div>
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
              <div className={styles.errorMessage}>
                {errors.descuentoCorte.message}
              </div>
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
              <div className={styles.errorMessage}>
                {errors.descuentoProducto.message}
              </div>
            )}
          </div>

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
        </fieldset>
      </form>
    </div>
  );
};

export default CreateCategories;
