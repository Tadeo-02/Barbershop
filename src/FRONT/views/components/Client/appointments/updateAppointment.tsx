import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const AppointmentSchema = z.object({ appointmentDate: z.string().min(1, "Fecha requerida") });
type AppointmentForm = z.infer<typeof AppointmentSchema>;

const UpdateAppointment: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentForm>({ resolver: zodResolver(AppointmentSchema), mode: "onBlur" });

  useEffect(() => {
    const ctrl = new AbortController();
    const toastId = toast.loading("Cargando Turno...");

    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/appointments/${appointmentId}`, { signal: ctrl.signal });
        if (response.ok) {
          const data = await response.json();
          reset({ appointmentDate: data.appointmentDate || "" });
          toast.dismiss(toastId);
        } else {
          toast.error("No se pudo cargar el turno", { id: toastId });
        }
      } catch (err: any) {
        if (err && err.name === "AbortError") {
          toast.dismiss(toastId);
          return;
        }
        console.error("Error fetching appointment:", err);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchAppointment();
    return () => ctrl.abort();
  }, [appointmentId, reset]);

  const onSubmit = async (values: AppointmentForm) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Actualizando turno...");
    try {
      // Some backends expect form-overrides; send POST with ?_method=PUT to be compatible
      const res = await fetch(`/appointments/${appointmentId}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Turno actualizado", { id: toastId });
        navigate("/indexAppointments");
      } else {
        toast.error(data.message || "Error al actualizar turno", { id: toastId });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error updating appointment:", err);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Turno</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting} style={{ border: "none", padding: 0, margin: 0 }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="appointmentDate">
              Fecha del Turno:
            </label>
            <input className={styles.formInput} type="date" id="appointmentDate" {...register("appointmentDate")} required />
            {errors.appointmentDate && <p style={{ color: "red" }}>{errors.appointmentDate.message}</p>}
          </div>
          <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateAppointment;
