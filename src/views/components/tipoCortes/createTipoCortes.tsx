import React, { useState } from "react";
import styles from "./TipoCortes.module.css";

const CreateTipoCortes: React.FC = () => {
  const [nombreCorte, setNombreCorte] = useState("");
  const [valorBase, setValorBase] = useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/tipoCortes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombreCorte, valorBase }),
      });

      const text = await response.text();

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Error al parsear JSON:", parseError);
          alert("Respuesta inválida del servidor");
          return;
        }
      } else {
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        alert(data.message || "Tipo de corte creado correctamente.");
        setNombreCorte("");
        setValorBase("");
      } else {
        alert(data.message || "Error al crear el tipo de corte.");
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div className={styles.formContainer}>
      {" "}
      {/* Usando styles.formContainer (asumiendo que defines esta clase) */}
      <h2>Crear Tipo de Corte</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        {" "}
        {/* Usando styles.form */}
        <div className={styles.formGroup}>
          {" "}
          {/* Usando styles.formGroup */}
          <label className={styles.formLabel} htmlFor="nombreCorte">
            {" "}
            {/* Usando styles.formLabel */}
            Nombre del corte:
          </label>
          <input
            className={styles.formInput} // Usando styles.formInput
            type="text"
            name="nombreCorte"
            id="nombreCorte"
            value={nombreCorte}
            maxLength={50}
            required
            onChange={(e) => setNombreCorte(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          {" "}
          {/* Usando styles.formGroup */}
          <label className={styles.formLabel} htmlFor="valorBase">
            {" "}
            {/* Usando styles.formLabel */}
            Valor base:
          </label>
          <input
            className={styles.formInput} // Usando styles.formInput
            type="number"
            name="valorBase"
            id="valorBase"
            value={valorBase}
            min={0}
            required
            onChange={(e) =>
              setValorBase(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          type="submit"
        >
          {" "}
          {/* Combinando clases */}
          Guardar
        </button>
      </form>
    </div>
  );
};

export default CreateTipoCortes;
