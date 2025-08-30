import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas

const CreateBarbers: React.FC = () => {
  const navigate = useNavigate();
  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creando Barbero..."); //alert de loading
    try {
      console.log(
        "Enviando POST a /barberos con datos barbero:",
        cuil,
        nombre,
        apellido,
        telefono
      );
      const response = await fetch("/barberos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cuil, nombre, apellido, telefono }),
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
          toast.error("Error al parsear JSON:", parseError);
          throw parseError;
        }
      } else {
        toast.error("Respuesta vacía del backend");
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        toast.success(data.message || "Barbero creado exitosamente", {id: toastId});
        setCuil("");
        setNombre("");
        setApellido("");
        setTelefono("");
        navigate("/barbers/indexBarbers");
      } else {
        toast.error(data.message || "Error al crear barbero", { id: toastId });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Barbero</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="cuil">
            CUIL:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="cuil"
            id="cuil"
            value={cuil}
            onChange={(e) => setCuil(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="nombre">
            Nombre:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="nombre"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="apellido">
            Apellido:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="apellido"
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="telefono">
            Teléfono:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="telefono"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Barbero
        </button>
      </form>
    </div>
  );
};

export default CreateBarbers;
