//No se usa

import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentSchema as BackendAppointmentSchema } from "../../../../../BACK/Schemas/appointmentsSchema";

// Reusar el schema del backend y seleccionar sólo los campos necesarios para creación
const CreateAppointmentSchema = BackendAppointmentSchema.pick({
  codCliente: true,
  codBarbero: true,
  fechaTurno: true,
  horaDesde: true,
  horaHasta: true,
  estado: true,
});

type AppointmentForm = z.infer<typeof CreateAppointmentSchema>;

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AppointmentForm>({ resolver: zodResolver(CreateAppointmentSchema), mode: "onBlur" });

  const onSubmit = async (values: AppointmentForm) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Creando turno...");
    try {
      // Map the frontend form values to the backend expected payload
      const payload = {
        codCliente: values.codCliente,
        codBarbero: values.codBarbero,
        fechaTurno: values.fechaTurno,
        horaDesde: values.horaDesde,
        horaHasta: values.horaHasta,
        estado: values.estado || "Programado",
      };

      const res = await fetch("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      // parsear body sólo si es JSON (evita exceptions si el servidor retorna texto)
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;

      if (res.ok) {
        toast.success("Turno creado", { id: toastId, duration: 2000 });
        reset();
        navigate("/indexAppointments");
      } else {
        const message = data?.message || data?.error || "Error al crear turno";
        toast.error(message, { id: toastId, duration: 4000 });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error en handleSubmit:", err);
      toast.error("Error de conexión", { id: toastId, duration: 2000 });
    }
  };

  // Cleanup: abortar cualquier request pendiente si el componente se desmonta
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Turno</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset aria-busy={isSubmitting} disabled={isSubmitting} style={{ border: "none", padding: 0, margin: 0 }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="codCliente">
              Código Cliente:
            </label>
            <input className={styles.formInput} type="text" id="codCliente" {...register("codCliente")} required />
            {errors.codCliente && <p style={{ color: "red" }}>{errors.codCliente.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="codBarbero">
              Código Barbero:
            </label>
            <input className={styles.formInput} type="text" id="codBarbero" {...register("codBarbero")} required />
            {errors.codBarbero && <p style={{ color: "red" }}>{errors.codBarbero.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="fechaTurno">
              Fecha del Turno:
            </label>
            <input
              className={styles.formInput}
              type="date"
              id="fechaTurno"
              {...register("fechaTurno")}
              required
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.fechaTurno && <p style={{ color: "red" }}>{errors.fechaTurno.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="horaDesde">
              Hora Desde:
            </label>
            <input className={styles.formInput} type="time" id="horaDesde" {...register("horaDesde")} required />
            {errors.horaDesde && <p style={{ color: "red" }}>{errors.horaDesde.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="horaHasta">
              Hora Hasta:
            </label>
            <input className={styles.formInput} type="time" id="horaHasta" {...register("horaHasta")} required />
            {errors.horaHasta && <p style={{ color: "red" }}>{errors.horaHasta.message}</p>}
          </div>

          <input type="hidden" {...register("estado")} value={"Programado"} />

          <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Guardar Turno"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateAppointment;
