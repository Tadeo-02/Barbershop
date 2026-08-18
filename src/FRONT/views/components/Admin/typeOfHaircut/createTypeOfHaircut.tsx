import React from "react";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { HaircutSchema } from "../../../../../BACK/Schemas/typeOfHaircutSchema";
import { useNavigate } from "react-router-dom";
import { useAbortController } from "../../shared/useAbortController";
import { getResponseMessage, readJsonSafely } from "../../../lib/apiResponse";
import { apiFetch } from "../../../lib/apiFetch";
import { createResolver } from "../../../lib/zodFormResolver";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";

type CreateTypeForm = z.infer<typeof HaircutSchema>;

const CreateTypeOfHaircut: React.FC = () => {
  const navigate = useNavigate();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTypeForm>({
    resolver: createResolver(HaircutSchema),
    mode: "onBlur",
    defaultValues: {
      valorBase: 0,
    },
  });

  const onSubmit = async (values: CreateTypeForm) => {
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Creando Tipo de Corte...");
    try {
      const res = await apiFetch("/tipoCortes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      const data = await readJsonSafely(res);

      if (res.ok) {
        toast.success("Tipo de corte creado exitosamente", { id: toastId });
        reset();
        setTimeout(() => navigate("/Admin/HaircutTypesPage"), 600);
      } else {
        const msg =
          getResponseMessage(data, "Error al crear tipo de corte") ??
          "Error al crear tipo de corte";
        toast.error(msg, { id: toastId });
      }
    } catch (err: unknown) {
      if (handleAbortOrConnectionError(err, toastId, "Error de conexión con el servidor")) {
        return;
      }
      console.error("Error en handleSubmit:", err);
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
