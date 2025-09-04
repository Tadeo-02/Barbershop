import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas

const CreateBarbers: React.FC = () => {
  const navigate = useNavigate();
  const [dni, setDni] = useState("");
  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creando Barbero..."); //alert de loading
    try {
      console.log(
        "Enviando POST a /barberos con datos barbero:",
        dni,
        cuil,
        nombre,
        apellido,
        telefono,
        email,
        contraseña
      );
      const response = await fetch("/barberos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dni, cuil, nombre, apellido, telefono, email, contraseña }),
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
        toast.success(data.message || "Barbero creado exitosamente", {id: toastId});
        setDni("");
        setCuil("");
        setNombre("");
        setApellido("");
        setTelefono("");
        setEmail("");
        setContraseña("");
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
          <label htmlFor="dni" className={styles.formLabel}>
            DNI:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="dni"
            id="dni"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            required
          />
        </div>
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
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="email">
            Email:
          </label>
          <input
            className={styles.formInput}
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="contraseña">
            Contraseña:
          </label>
          <input
            className={styles.formInput}
            type="password"
            name="contraseña"
            id="contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
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
