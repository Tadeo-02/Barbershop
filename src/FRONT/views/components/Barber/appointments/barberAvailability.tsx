import React, { useState } from "react";
import { useAuth } from "../../login/AuthContext";
import toast from "react-hot-toast";
import styles from "./barberAvailability.module.css";
import AvailabilityForm from "./AvailabilityForm";
import type { AvailabilityFormValues } from "./AvailabilityForm";
import {
  isAbortError,
  useAbortController,
} from "../../shared/useAbortController";

const BarberAvailability: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const { renew: renewSubmitAbort } = useAbortController();

  const handleCreateSubmit = async (values: AvailabilityFormValues) => {
    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesion como barbero");
      return;
    }

    const payload = {
      codBarbero: user.codUsuario,
      // Backend espera 'YYYY-MM-DD HH:MM:SS'
      fechaHoraDesde: `${values.desdeFecha} ${values.desdeHora}:00`,
      fechaHoraHasta: `${values.hastaFecha} ${values.hastaHora}:00`,
      motivo: values.motivo,
    };

    const controller = renewSubmitAbort();

    const toastId = toast.loading("Registrando ausencia...");
    setIsSubmitting(true);

    try {
      const res = await fetch("/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : null;

      if (res.ok) {
        toast.success("Ausencia registrada", { id: toastId });
        setResetKey((prev) => prev + 1);
      } else {
        const message =
          data?.message || data?.error || "Error al registrar ausencia";
        toast.error(message, { id: toastId });
      }
    } catch (err: unknown) {
      if (isAbortError(err)) {
        toast.dismiss(toastId);
        return;
      }

      if (err instanceof Error) {
        console.error("Error registrando ausencia:", err.message);
      } else {
        console.error("Error registrando ausencia:", err);
      }

      toast.error("Error de conexion", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Registrar Ausencia</h1>
      </div>

      <p className={styles.subtitle}>
        Bloquea tu agenda para descansos o imprevistos.
      </p>

      <AvailabilityForm
        onSubmit={handleCreateSubmit}
        disabled={isSubmitting}
        resetKey={resetKey}
        confirmTitle="Registrar ausencia"
        confirmConfirmLabel="Registrar"
      />
    </div>
  );
};

export default BarberAvailability;
