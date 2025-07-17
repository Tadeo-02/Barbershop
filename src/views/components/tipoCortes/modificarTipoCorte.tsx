import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./TipoCortes.module.css";


const ModificarTipoCorte: React.FC = () => {
  const { codCorte } = useParams<{ codCorte: string }>();
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [corte, setCorte] = useState<any | null>(null); // Use 'any' type
  const [nombreCorte, setNombreCorte] = useState("");
  const [valorBase, setValorBase] = useState<number | "">("");

  useEffect(() => {
    const fetchCorte = async () => {
      try {
        const response = await fetch(`/tipoCortes/${codCorte}`);
        if (response.ok) {
          const data = await response.json();
          setCorte(data);
          setNombreCorte(data.nombreCorte);
          setValorBase(data.valorBase);
        } else {
          console.error("Failed to fetch turno");
        }
      } catch (error) {
        console.error("Error fetching turno:", error);
      }
    };

    fetchCorte();
  }, [codCorte]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/turnos/${corte?.codCorte}?_method=PUT`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombreCorte, valorBase }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/indexTipoCortes"); // Redirigir a la lista de tipo de cortes
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error modificando Tipo de Corte:", error);
      alert("Error de conexión");
    }
  };

  if (!corte) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.formContainer}>
      {" "}
      {/* Usando styles.formContainer (asumiendo que defines esta clase) */}
      <h1>Editar Tipo de Corte</h1>
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

export default ModificarTipoCorte;
