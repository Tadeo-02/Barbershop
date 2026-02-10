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
  descCategoria: z.string().min(10, "Descripción requerida. Mínimo 10 caracteres."),
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

const CreateCategories: React.FC = () => {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCategoryForm>({
    resolver: (async (values, context, options) => {
      // traducir mensajes de error de Zod para campos numéricos a algo más amigable en español
      const zodRes = (await (zodResolver(CreateCategorySchema) as any)(values, context, options)) as any;
      if (zodRes && zodRes.errors) {
        const normalizeMessage = (msg: any) => {
          if (!msg) return msg;
          const s = String(msg).toLowerCase();
          if (s.includes("invalid input") || s.includes("received nan") || s.includes("expected number")) {
            return "Ingrese un número válido";
          }
          return msg;
        };
        const keys = Object.keys(zodRes.errors);
        for (const k of keys) {
          const e = zodRes.errors[k];
          if (e && e.message) {
            e.message = normalizeMessage(e.message);
          }
        }
      }
      return zodRes;
    }) as Resolver<CreateCategoryForm>,
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
        toast.success("Categoría creada exitosamente", { id: toastId, duration: 2000 });
        reset();
        setTimeout(() => navigate("/Admin/CategoriesPage"), 600);
      } else {
        toast.error("Error al crear categoría", { id: toastId, duration: 2000 });
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
              <div className={styles.errorMessage}>{errors.nombreCategoria.message}</div>
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
              <div className={styles.errorMessage}>{errors.descCategoria.message}</div>
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
              <div className={styles.errorMessage}>{errors.descuentoCorte.message}</div>
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
              <div className={styles.errorMessage}>{errors.descuentoProducto.message}</div>
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
