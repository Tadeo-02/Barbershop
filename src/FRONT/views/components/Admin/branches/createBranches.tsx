import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import styles from "./branches.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas
import { BranchSchema } from "../../../../../BACK/Schemas/branchesSchema";

const CreateBranchSchema = BranchSchema.extend({});

type CreateBranchFormData = z.infer<typeof CreateBranchSchema>;

const CreateBranches: React.FC = () => {
  const navigate = useNavigate();
  {
    /*agregar atributos linkMap e img?*/
  }
  const abortControllerRef = useRef<AbortController | null>(null);

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
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    const toastId = toast.loading("Creando Sucursal...");

    try {
      const response = await fetch("/sucursales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: abortControllerRef.current!.signal,
      });

      // Intentar parsear JSON; si falla, crear mensaje fallback
      let responseData: any = { message: response.statusText };
      try {
        responseData = await response.json();
      } catch (parseErr) {
        // leave responseData as fallback
        // console.warn("No JSON en la respuesta:", parseErr);
      }

      if (response.ok) {
        // ÉXITO
        toast.success(responseData.message || "Sucursal creada exitosamente", {
          id: toastId,
          duration: 2000,
        });

        reset(); // Limpiar formulario

        // Redirección con delay a listado de sucursales
        setTimeout(() => {
          navigate("/Admin/BranchesPage");
        }, 1200);
      } else {
        // ERROR DEL BACKEND
        toast.error(responseData.message || "Error al crear sucursal", {
          id: toastId,
        });
      }
    } catch (error: any) {
      // Ignorar errores de abort (son intencionales)
      if (error && (error.name === "AbortError" || (error instanceof DOMException && error.name === "AbortError"))) {
        toast.dismiss(toastId);
        // console.log("Request cancelado");
        return;
      }
      // ERROR DE RED u otro
      console.error("Error en handleSubmit:", error);
      toast.error("No se pudo conectar con el servidor", { id: toastId });
    } finally {
      // clear the controller reference so future requests start fresh
      abortControllerRef.current = null;
    }
  };

  // cleanup on unmount: abort any inflight request
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

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
          {/*PROPIEDAD PARA DESHABILITAR ENVÍOS MULIPLES MEDIANTE HTML PURO  */}
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
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? "Creando..." : "Guardar Sucursal"}
        </button>
      </fieldset>
    </form>
    </div >
  );
};

export default CreateBranches;
