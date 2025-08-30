import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";

interface Barbero {
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

const UpdateBarber: React.FC = () => {
  const { cuil } = useParams<{ cuil: string }>();
  const navigate = useNavigate();
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [nuevoCuil, setNuevoCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    const fetchBarbero = async () => {
      // const toastId = toast.loading("Cargando datos del barbero...");

      try {
        const response = await fetch(`/barberos/${cuil}`);
        if (response.ok) {
          const data = await response.json();
          setBarbero(data);
          setNuevoCuil(data.cuil);
          setNombre(data.nombre);
          setApellido(data.apellido);
          setTelefono(data.telefono);                    
          toast.success("Datos cargados correctamente", {id: toastId,});
        } else {
          toast.error("Error al cargar los datos del barbero", { id: toastId });
        }
      } catch (error) {
        console.error("Error fetching barbero:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchBarbero();
  }, [cuil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Actualizando barbero...");

    try {
      const response = await fetch(`/barberos/${barbero?.cuil}?_method=PUT`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nuevoCuil, nombre, apellido, telefono }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Barbero actualizado exitosamente", { id: toastId });
        navigate("/barbers/indexBarbers"); // Redirigir a la lista de barberos
      } else {
        toast.error(data.message || "Error al actualizar barbero", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating barbero:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  if (!barbero) {
    return <div className={styles.loadingState}>Cargando barbero...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Barbero</h1>
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
            value={nuevoCuil}
            onChange={(e) => setNuevoCuil(e.target.value)}
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
          Guardar Cambios
        </button>
      </form>
    </div>
  );
};

export default UpdateBarber;
