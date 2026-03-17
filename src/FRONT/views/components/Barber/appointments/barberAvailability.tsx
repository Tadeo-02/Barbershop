import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../login/AuthContext";
import toast from "react-hot-toast";
import styles from "./barberAvailability.module.css";

const BarberAvailability: React.FC = () => {
  const [desdeFecha, setDesdeFecha] = useState("");
  const [desdeHora, setDesdeHora] = useState("");
  const [hastaFecha, setHastaFecha] = useState("");
  const [hastaHora, setHastaHora] = useState("");
  const [motivo, setMotivo] = useState("");

  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesión como barbero");
      return;
    }

    // Validar orden de fechas
    const desdeIso = `${desdeFecha}T${desdeHora}`;
    const hastaIso = `${hastaFecha}T${hastaHora}`;
    const fechaDesde = new Date(desdeIso);
    const fechaHasta = new Date(hastaIso);

    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      toast.error("Fecha u hora inválida");
      return;
    }

    if (fechaDesde >= fechaHasta) {
      toast.error("La fecha/hora 'Desde' debe ser anterior a 'Hasta'");
      return;
    }

    const payload = {
      codBarbero: user.codUsuario,
      // Backend espera 'YYYY-MM-DD HH:MM:SS'
      fechaHoraDesde: `${desdeFecha} ${desdeHora}:00`,
      fechaHoraHasta: `${hastaFecha} ${hastaHora}:00`,
      motivo,
    };

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const toastId = toast.loading("Registrando ausencia...");
    setIsSubmitting(true);

    try {
      const res = await fetch("/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : null;

      if (res.ok) {
        toast.success("Ausencia registrada", { id: toastId });
        // reset form
        setDesdeFecha("");
        setDesdeHora("");
        setHastaFecha("");
        setHastaHora("");
        setMotivo("");
      } else {
        const message =
          data?.message || data?.error || "Error al registrar ausencia";
        toast.error(message, { id: toastId });
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }

      if (err instanceof Error) {
        console.error("Error registrando ausencia:", err.message);
      } else {
        console.error("Error registrando ausencia:", err);
      }

      toast.error("Error de conexión", { id: toastId });
    } finally {
      setIsSubmitting(false);
      abortRef.current = null;
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Registrar Ausencia</h1>
      </div>

      <p className={styles.subtitle}>
        Bloquea tu agenda para descansos o imprevistos.
      </p>

      {/* ── Form ── */}
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Desde */}
        <div className={styles.rangeSection}>
          <h2 className={styles.sectionTitle}>Desde</h2>
          <div className={styles.fieldsRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="desdeFecha">
                Fecha
              </label>
              <input
                id="desdeFecha"
                type="date"
                className={styles.input}
                value={desdeFecha}
                max={hastaFecha}
                onChange={(e) => setDesdeFecha(e.target.value)}
                required
              />
            </div>

            {/* Hora */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="desdeHora">
                Hora
              </label>
              <input
                id="desdeHora"
                type="time"
                className={styles.input}
                value={desdeHora}
                onChange={(e) => setDesdeHora(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Hasta */}
        <div className={styles.rangeSection}>
          <h2 className={styles.sectionTitle}>Hasta</h2>
          <div className={styles.fieldsRow}>
            {/* Fecha */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="hastaFecha">
                Fecha
              </label>
              <input
                id="hastaFecha"
                type="date"
                className={styles.input}
                value={hastaFecha}
                min={desdeFecha}
                onChange={(e) => setHastaFecha(e.target.value)}
                required
              />
            </div>

            {/* Hora */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="hastaHora">
                Hora
              </label>
              <input
                id="hastaHora"
                type="time"
                className={styles.input}
                value={hastaHora}
                onChange={(e) => setHastaHora(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Motivo */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="motivo">
            Motivo
          </label>
          <textarea
            id="motivo"
            className={styles.textarea}
            placeholder="Ej: Vacaciones"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <button type="submit" className={styles.submitButton}>
          Registrar Ausencia
        </button>
      </form>
    </div>
  );
};

export default BarberAvailability;
