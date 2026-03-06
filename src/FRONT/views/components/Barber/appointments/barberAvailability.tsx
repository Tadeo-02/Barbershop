import React, { useState } from "react";
import styles from "./barberAvailability.module.css";

const BarberAvailability: React.FC = () => {
  const [desdeFecha, setDesdeFecha] = useState("");
  const [desdeHora, setDesdeHora] = useState("");
  const [hastaFecha, setHastaFecha] = useState("");
  const [hastaHora, setHastaHora] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrar con backend
    console.log({
      desdeFecha,
      desdeHora,
      hastaFecha,
      hastaHora,
      motivo,
    });
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
              <label className={styles.label} htmlFor="desdeFecha">Fecha</label>
              <input
                id="desdeFecha"
                type="date"
                className={styles.input}
                value={desdeFecha}
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
