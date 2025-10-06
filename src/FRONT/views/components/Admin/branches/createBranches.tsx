import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas


const CreateBranches: React.FC = () => {
  const navigate = useNavigate();
  const [calle, setCalle] = useState("");
  const [altura, setAltura] = useState("");
  {/*agregar atributos linkMap e img?*/}


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creando Sucursal..."); //alert de loading
    try {
      console.log(
        "Enviando POST a /sucursales con datos sucursal:",
        calle,
        altura
      );
      const response = await fetch("/sucursales/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calle, altura }),
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
          toast.error("Error al parsear JSON:");
          throw parseError;
        }
      } else {
        toast.error("Respuesta vacía del backend");
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        toast.success(data.message || "Sucursal creada exitosamente", {id: toastId});
        setCalle("");
        setAltura("");
        navigate("/branches/indexBranches");
      } else {
        toast.error(data.message || "Error al crear sucursal", { id: toastId });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Sucursal</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="calle" className={styles.formLabel}>
            CALLE:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="calle"
            id="calle"
            value={calle}
            onChange={(e) => setCalle(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="altura">
            ALTURA:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="altura"
            id="altura"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            required
          />
        </div>
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Sucursal
        </button>
      </form>
    </div>
  );
};

export default CreateBranches;
