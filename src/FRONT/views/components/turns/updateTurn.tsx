import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./turns.module.css";

interface Turno {
  codTurno: number;
  fechaTurno: string;
}

const ModificarTurno: React.FC = () => {
  const { codTurno } = useParams<{ codTurno: string }>();
  const navigate = useNavigate();
  const [turno, setTurno] = useState<Turno | null>(null);
  const [fechaTurno, setFechaTurno] = useState("");

  useEffect(() => {
    const fetchTurno = async () => {
      try {
        const response = await fetch(`/turnos/${codTurno}`);
        if (response.ok) {
          const data = await response.json();
          setTurno(data);
          setFechaTurno(data.fechaTurno);
        } else {
          console.error("Failed to fetch turno");
        }
      } catch (error) {
        console.error("Error fetching turno:", error);
      }
    };

    fetchTurno();
  }, [codTurno]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/turnos/${turno?.codTurno}?_method=PUT`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fechaTurno }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/indexTurnos"); // Redirigir a la lista de turnos
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating turno:", error);
      alert("Error de conexión");
    }
  };

  if (!turno) {
    return <div className={styles.loadingState}>Cargando turno...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Turno</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="fechaTurno">
            Fecha del Turno:
          </label>
          <input
            className={styles.formInput}
            type="date"
            name="fechaTurno"
            id="fechaTurno"
            value={fechaTurno}
            onChange={(e) => setFechaTurno(e.target.value)}
            required
          />
        </div>
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default ModificarTurno;
