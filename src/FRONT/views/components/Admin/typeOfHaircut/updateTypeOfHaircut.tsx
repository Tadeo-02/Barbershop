import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { HaircutSchema } from "../../../../../BACK/Schemas/typeOfHaircutSchema";
import { zodResolver } from "@hookform/resolvers/zod";

interface TipoCorte {
  codCorte: string;
  nombre: string;
  valorBase: number;
}

type TypeForm = z.infer<typeof HaircutSchema>;

const UpdateTypeOfHaircut: React.FC = () => {
  const { codCorte } = useParams<{ codCorte: string }>();
  const navigate = useNavigate();
  const [corte, setCorte] = useState<TipoCorte | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TypeForm>({ resolver: zodResolver(HaircutSchema) as any, mode: "onBlur", defaultValues: { valorBase: 0 } });

  useEffect(() => {
    const ctrl = new AbortController();
    const toastId = toast.loading("Cargando datos del tipo de corte...");

    const fetchCorte = async () => {
      try {
        const response = await fetch(`/tipoCortes/${codCorte}`, { signal: ctrl.signal });
        if (response.ok) {
          const data = await response.json();
          setCorte(data);
          reset({ nombre: data.nombre || "", valorBase: data.valorBase ?? undefined });
          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Tipo de corte no encontrado", { id: toastId });
          navigate("/Admin/HaircutTypesPage");
        } else {
          toast.error("Error al cargar los datos del tipo de corte", { id: toastId });
        }
      } catch (err: any) {
        if (err && err.name === "AbortError") {
          toast.dismiss(toastId);
          return;
        }
        console.error("Error fetching tipo de corte:", err);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchCorte();
    return () => ctrl.abort();
  }, [codCorte, navigate, reset]);

  const onSubmit = async (values: TypeForm) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Actualizando tipo de corte...");
    try {
      // Use POST with ?_method=PUT for method-override compatibility
      const res = await fetch(`/tipoCortes/${codCorte}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: abortRef.current.signal,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        // ignore parse errors
      }

      if (res.ok) {
        toast.success("Tipo de corte actualizado", { id: toastId, duration: 2000 });
        navigate("/Admin/HaircutTypesPage");
      } else {
        const msg = data && data.message ? String(data.message) : "Error al actualizar tipo de corte";
        toast.error(msg, { id: toastId, duration: 2000 });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error modificando Tipo de Corte:", err);
      toast.error("Error de conexión", { id: toastId, duration: 2000 });
    }
    finally {
      // clear controller reference
      abortRef.current = null;
    }
  };

  // cleanup on unmount: abort any inflight submit
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  if (!corte) {
    return <div className={styles.loadingState}>Cargando tipo de corte...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Tipo de Corte</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="nombre">
              Nombre del corte:
            </label>
            <input className={styles.formInput} type="text" id="nombre" {...register("nombre")} maxLength={50} required />
            {errors.nombre && (<div className={styles.errorMessage}>{errors.nombre.message as string}</div>)}
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
            {errors.valorBase && (<div className={styles.errorMessage}>{errors.valorBase.message as string}</div>)}
          </div>
          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateTypeOfHaircut;
