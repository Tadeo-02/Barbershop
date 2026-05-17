import React from "react";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { HaircutSchema } from "../../../../../BACK/Schemas/typeOfHaircutSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  isAbortError,
  useAbortController,
} from "../../shared/useAbortController";

type CreateTypeForm = z.infer<typeof HaircutSchema>;

const getResponseMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object" || !("message" in data))
    return undefined;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (message != null) return String(message);
  return undefined;
};

const CreateTypeOfHaircut: React.FC = () => {
  const navigate = useNavigate();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTypeForm>({
    // use the global Zod error map (applied in main.tsx) and the normal resolver
    resolver: zodResolver(HaircutSchema) as Resolver<CreateTypeForm>,
    mode: "onBlur",
    // valores por defecto
    defaultValues: {
      valorBase: 0,
    },
  });

  const onSubmit = async (values: CreateTypeForm) => {
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Creando Tipo de Corte...");
    try {
      const res = await fetch("/tipoCortes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      // parse JSON safely (some responses may not include a JSON body)
      let data: unknown = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        // ignore parse errors; data stays null
      }

      if (res.ok) {
        toast.success("Tipo de corte creado exitosamente", { id: toastId });
        reset();
        setTimeout(() => navigate("/Admin/HaircutTypesPage"), 600);
      } else {
        // if server returned JSON with message, show it; otherwise show generic
        const msg = getResponseMessage(data) ?? "Error al crear tipo de corte";
        toast.error(msg, { id: toastId });
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
      <h1 className={styles.pageTitle}>Crear Tipo de Corte</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset
          disabled={isSubmitting}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
          <div className={styles.formGroup}>
            <label htmlFor="nombre" className={styles.formLabel}>
              Nombre del corte:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="nombre"
              {...register("nombre")}
              maxLength={50}
              required
            />
            {errors.nombre && (
              <div className={styles.errorMessage}>{errors.nombre.message}</div>
            )}
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
            {errors.valorBase && (
              <div className={styles.errorMessage}>
                {errors.valorBase.message}
              </div>
            )}
          </div>
          <div className={styles.detailsActionButtons}>
          <button
            className={`${styles.button} ${styles.buttonSuccess}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando..." : "Guardar Tipo de Corte"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => navigate("/Admin/HaircutTypesPage")}
          >
            Volver
          </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateTypeOfHaircut;
