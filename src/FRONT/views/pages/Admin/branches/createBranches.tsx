import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import styles from "./branches.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas
import { BranchSchema } from "../../../../../BACK/Schemas/branchesSchema";
import {
  isAbortError,
  useAbortController,
} from "../../../components/shared/useAbortController";
import { getResponseMessage, readJsonSafely } from "../../../components/Admin/apiResponse";
import { apiFetch } from "../../../lib/apiFetch";

const CreateBranchSchema = BranchSchema.extend({});

type CreateBranchFormData = z.infer<typeof CreateBranchSchema>;

const CreateBranches: React.FC = () => {
  const navigate = useNavigate();
  {
    /*add img?*/
  }
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBranchFormData>({
    resolver: zodResolver(CreateBranchSchema),
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<CreateBranchFormData> = async (data) => {
    // Cancel request if exists
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Creando Sucursal...");

    try {
      const response = await apiFetch("/sucursales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      const responseData = await readJsonSafely(response);
      const responseMessage =
        getResponseMessage(responseData, response.statusText) ??
        "Error al crear sucursal";

      if (response.ok) {
        // ÉXITO
        toast.success(responseMessage || "Sucursal creada exitosamente", {
          id: toastId,
          duration: 2000,
        });

        reset(); // clean form

        // redirect with delay to branches list
        setTimeout(() => {
          navigate("/Admin/BranchesPage");
        }, 1200);
      } else {
        //  BACKEND ERROR
        toast.error(responseMessage || "Error al crear sucursal", {
          id: toastId,
        });
      }
    } catch (error: unknown) {
      // ignore abort errors (they are intentional)
      if (isAbortError(error)) {
        toast.dismiss(toastId);
        // console.log("Request cancelado");
        return;
      }
      // Network or unexpected error
      console.error("Error en handleSubmit:", error);
      toast.error("No se pudo conectar con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Sucursal</h1>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <fieldset
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          style={{ border: "none", padding: 0, margin: 0 }}
        >
          <div className={styles.formGroup}>
           {/* PROPERTY TO DISABLE MULTIPLE SUBMISSIONS USING PURE HTML */}

            <label htmlFor="nombre" className={styles.formLabel}>
              NOMBRE:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="nombre"
              {...register("nombre")}
              autoFocus
              required
            />
            {errors.nombre && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>
                {errors.nombre.message}
              </p>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="calle" className={styles.formLabel}>
              CALLE:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="calle"
              {...register("calle")}
              required
            />
            {errors.calle && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>
                {errors.calle.message}
              </p>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="altura">
              ALTURA:
            </label>
            <input
              className={styles.formInput}
              type="number"
              id="altura"
              min={1}
              step={1}
              {...register("altura", { valueAsNumber: true })}
              required
            />
            {errors.altura && (
              <p style={{ color: "red", fontSize: "0.875rem" }}>
                {errors.altura.message}
              </p>
            )}
          </div>
          <div className={styles.detailsActionButtons}>
            <button
              className={`${styles.button} ${styles.buttonSuccess}`}
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Guardar Sucursal"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => navigate("/Admin/BranchesPage")}
            >
              Volver
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateBranches;
