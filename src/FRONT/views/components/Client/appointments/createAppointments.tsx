import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const AppointmentSchema = z.object({
  appointmentDate: z.string().min(1, "Fecha requerida"),
});

type AppointmentForm = z.infer<typeof AppointmentSchema>;

const CreateAppointment: React.FC = () => {
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AppointmentForm>({ resolver: zodResolver(AppointmentSchema), mode: "onBlur" });

  const onSubmit = async (values: AppointmentForm) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Creando turno...");
    try {
      const res = await fetch("/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Turno creado", { id: toastId });
        reset();
        navigate("/indexAppointments");
      } else {
        toast.error(data.message || "Error al crear turno", { id: toastId });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error en handleSubmit:", err);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Turno</h1>
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
            {isSubmitting ? "Creando..." : "Guardar Turno"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateAppointment;
