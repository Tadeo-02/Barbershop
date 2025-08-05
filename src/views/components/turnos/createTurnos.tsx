import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./turnos.module.css";

const CreateTurnos: React.FC = () => {
  const navigate = useNavigate();
  const [fechaTurno, setFechaTurno] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Enviando POST a /turnos con fechaTurno:", fechaTurno);
      const response = await fetch("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fechaTurno }),
      });
      console.log("Después de fetch, status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("Después de JSON.parse, data:", data);
        } catch (parseError) {
          console.error("Error al parsear JSON:", parseError);
          throw parseError;
        }
      } else {
        console.error("Respuesta vacía del backend");
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        alert(data.message);
        setFechaTurno("");
        navigate("/indexTurnos");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Turno</h1>
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
          Guardar Turno
        </button>
      </form>
    </div>
  );
};

export default CreateTurnos;
