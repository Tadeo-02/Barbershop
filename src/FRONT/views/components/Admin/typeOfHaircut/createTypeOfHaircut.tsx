import React, { useState } from "react";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas

const CreateTypeOfHaircut: React.FC = () => {
  const [nombreCorte, setNombreCorte] = useState("");
  const [valorBase, setValorBase] = useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that valorBase is not empty
    if (valorBase === "" || valorBase <= 0) {
      toast.error("El valor base debe ser mayor a 0");
      return;
    }

    const toastId = toast.loading("Creando Tipo de Corte..."); //alert de loading
    try {
      console.log(
        "Enviando POST a /tipoCortes con datos tipo de corte:",
        nombreCorte,
        valorBase
      );
      const response = await fetch("/tipoCortes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombreCorte, valorBase: valorBase.toString() }),
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
        toast.error("Respuesta vacía del backend");
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        toast.success(data.message || "Tipo de corte creado exitosamente", {
          id: toastId,
        });
        setNombreCorte("");
        setValorBase("");
      } else {
        toast.error(data.message || "Error al crear tipo de corte", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Tipo de Corte</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="nombreCorte" className={styles.formLabel}>
            Nombre del corte:
          </label>
          <input
            className={styles.formInput}
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
          <label className={styles.formLabel} htmlFor="valorBase">
            Valor base:
          </label>
          <input
            className={styles.formInput}
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
          Guardar Tipo de Corte
        </button>
      </form>
    </div>
  );
};

export default CreateTypeOfHaircut;
