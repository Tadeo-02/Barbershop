import React, { useRef } from "react";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

const CreateTypeSchema = z.object({
  nombreCorte: z.string().min(1, "Nombre requerido"),
  valorBase: z.coerce.number().min(0.01, "Debe ser mayor a 0"),
});

type CreateTypeForm = z.infer<typeof CreateTypeSchema>;

const CreateTypeOfHaircut: React.FC = () => {
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTypeForm>({ resolver: zodResolver(CreateTypeSchema), mode: "onBlur" });

  const onSubmit = async (values: CreateTypeForm) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Creando Tipo de Corte...");
    try {
      const res = await fetch("/tipoCortes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Tipo de corte creado exitosamente", { id: toastId });
        reset();
        setTimeout(() => navigate("/Admin/HaircutTypesPage"), 600);
      } else {
        toast.error(data.message || "Error al crear tipo de corte", { id: toastId });
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
      <h1 className={styles.pageTitle}>Crear Tipo de Corte</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting} style={{ border: "none", padding: 0, margin: 0 }}>
          <div className={styles.formGroup}>
            <label htmlFor="nombreCorte" className={styles.formLabel}>
              Nombre del corte:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="nombreCorte"
              {...register("nombreCorte")}
              maxLength={50}
              required
            />
            {errors.nombreCorte && <p style={{ color: "red" }}>{errors.nombreCorte.message}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="valorBase">
              Valor base:
            </label>
            <input
              className={styles.formInput}
              type="number"
              id="valorBase"
              min={0}
              step={0.01}
              {...register("valorBase", { valueAsNumber: true })}
              required
            />
            {errors.valorBase && <p style={{ color: "red" }}>{errors.valorBase.message}</p>}
          </div>
          <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Guardar Tipo de Corte"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateTypeOfHaircut;
