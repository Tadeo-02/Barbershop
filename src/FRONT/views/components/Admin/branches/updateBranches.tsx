import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BranchSchema,
  BranchWithIdSchema,
} from "../../../../../BACK/Schemas/branchesSchema";
import {
  isAbortError,
  useAbortController,
} from "../../shared/useAbortController";

type Sucursal = z.infer<typeof BranchWithIdSchema>;

const UpdateBranchSchema = BranchSchema.extend({});
type UpdateBranchForm = z.infer<typeof UpdateBranchSchema>;

const getResponseMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object" || !("message" in data))
    return undefined;
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (message != null) return String(message);
  return undefined;
};

const UpdateBranches: React.FC = () => {
  const { codSucursal } = useParams<{ codSucursal: string }>();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const { renew: renewFetchAbort, abort: abortFetchAbort } =
    useAbortController();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateBranchForm>({
    resolver: zodResolver(UpdateBranchSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const controller = renewFetchAbort();
    const fetchSucursal = async () => {
      const toastId = toast.loading("Cargando datos de la sucursal...");
      try {
        const response = await fetch(`/sucursales/${codSucursal}`, {
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          setSucursal(data);
          // populate form
          reset({
            nombre: data.nombre || "",
            calle: data.calle || "",
            altura: data.altura ?? undefined,
          });
          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Sucursal no encontrado", { id: toastId });
          navigate("/BranchesPage");
        } else {
          toast.error("Error al cargar los datos de la sucursal", {
            id: toastId,
          });
        }
      } catch (error: unknown) {
        if (isAbortError(error)) {
          toast.dismiss(toastId);
          return;
        }
        console.error("🔍 Debug - Fetch error:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchSucursal();
    return abortFetchAbort;
  }, [codSucursal, navigate, reset, renewFetchAbort, abortFetchAbort]);

  const onSubmit = async (formValues: UpdateBranchForm) => {
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Actualizando sucursal...");

    try {
      const payload = { ...formValues };

      // Use POST with ?_method=PUT for compatibility with method-override backends
      const response = await fetch(
        `/sucursales/${sucursal?.codSucursal}?_method=PUT`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );

      // safe parse JSON (some responses may not include a JSON body)
      let data: unknown = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        // ignore parse errors; data remains null
      }

      if (response.ok) {
        toast.success("Sucursal actualizada exitosamente", { id: toastId });
        navigate("/Admin/BranchesPage");
      } else {
        const msg = getResponseMessage(data) ?? "Error al actualizar sucursal";
        toast.error(msg, { id: toastId });
      }
    } catch (error: unknown) {
      if (isAbortError(error)) {
        toast.dismiss(toastId);
        return;
      }
      console.error("🔍 Debug - Submit error:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  if (!sucursal) {
    return <div className={styles.loadingState}>Cargando sucursal...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Sucursal</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="nombre">
              Nombre:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="nombre"
              placeholder="Nombre"
              maxLength={50}
              required
              {...register("nombre")}
            />
            {errors.nombre && (
              <div className={styles.errorMessage}>
                {errors.nombre.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="calle">
              Calle:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="calle"
              placeholder="Calle"
              required
              {...register("calle")}
            />
            {errors.calle && (
              <div className={styles.errorMessage}>
                {errors.calle.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="altura">
              Altura:
            </label>
            <input
              className={styles.formInput}
              type="number"
              id="altura"
              placeholder="Altura"
              min={1}
              step={1}
              required
              {...register("altura", { valueAsNumber: true })}
            />
            {errors.altura && (
              <div className={styles.errorMessage}>
                {errors.altura.message as string}
              </div>
            )}
          </div>
          <div className={styles.detailsActionButtons}>
            <button
              className={`${styles.button} ${styles.buttonSuccess}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
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

export default UpdateBranches;
