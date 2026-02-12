//No se usa

import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentSchema as BackendAppointmentSchema } from "../../../../../BACK/Schemas/appointmentsSchema";

// Use the backend Appointment schema but pick only the fields needed by this form
const AppointmentFormSchema = BackendAppointmentSchema.pick({
  fechaTurno: true,
  horaDesde: true,
  horaHasta: true,
}).refine((obj) => {
  // ensure fechaTurno is today or later
  const val = (obj as any).fechaTurno;
  const selected = new Date(val);
  const today = new Date();
  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return selected >= today;
}, { message: "La fecha debe ser hoy o posterior", path: ["fechaTurno"] });

type AppointmentForm = z.infer<typeof AppointmentFormSchema>;

const UpdateAppointment: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentForm>({ resolver: zodResolver(AppointmentFormSchema), mode: "onBlur" });

  useEffect(() => {
    const ctrl = new AbortController();
    const toastId = toast.loading("Cargando Turno...");

    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/appointments/${appointmentId}`, { signal: ctrl.signal });
        if (response.ok) {
          const data = await response.json();
          // map backend fields to form fields
          const horaDesde = data.horaDesde ? new Date(data.horaDesde).toISOString().substring(11, 16) : "";
          const horaHasta = data.horaHasta ? new Date(data.horaHasta).toISOString().substring(11, 16) : "";
          reset({ fechaTurno: data.fechaTurno ? data.fechaTurno.split("T")[0] : "", horaDesde, horaHasta });
          toast.dismiss(toastId);
        } else {
          toast.error("No se pudo cargar el turno", { id: toastId, duration: 2000 });
        }
      } catch (err: any) {
        if (err && err.name === "AbortError") {
          toast.dismiss(toastId);
          return;
        }
        console.error("Error fetching appointment:", err);
        toast.error("Error de conexión", { id: toastId, duration: 2000 });
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
      // send update payload expected by backend
      const payload = {
        fechaTurno: values.fechaTurno,
        horaDesde: values.horaDesde,
        horaHasta: values.horaHasta,
      };

      const res = await fetch(`/appointments/${appointmentId}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : null;
      if (res.ok) {
        toast.success("Turno actualizado", { id: toastId, duration: 2000 });
        navigate("/indexAppointments");
      } else {
        toast.error(data?.message || "Error al actualizar turno", { id: toastId, duration: 2000 });
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error updating appointment:", err);
      toast.error("Error de conexión", { id: toastId, duration: 2000 });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Turno</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting} style={{ border: "none", padding: 0, margin: 0 }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="fechaTurno">
              Fecha del Turno:
            </label>
            <input className={styles.formInput} type="date" id="fechaTurno" {...register("fechaTurno")} required min={new Date().toISOString().split("T")[0]} />
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

          <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateAppointment;
