import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";

interface Barbero {
  codUsuario: string;
  dni: string;
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  contrase_a: string;
}

const UpdateBarber: React.FC = () => {
  const { codUsuario } = useParams<{ codUsuario: string }>();
  const navigate = useNavigate();
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [dni, setDni] = useState("");
  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState(""); // Cambiar de contrase_a a contraseña

  useEffect(() => {
  let isMounted = true; // Flag para controlar si el componente está montado

  const fetchBarbero = async () => {
    const toastId = toast.loading("Cargando datos del barbero...");

    try {
      const response = await fetch(`/usuarios/${codUsuario}`);

      if (!isMounted) return; // Si el componente se desmontó, no continuar

      if (response.ok) {
        const data = await response.json();
        setBarbero(data);
        setDni(data.dni);
        setCuil(data.cuil);
        setNombre(data.nombre);
        setApellido(data.apellido);
        setTelefono(data.telefono);
        setEmail(data.email);
        setContraseña(data.contrase_a);
        toast.dismiss(toastId); // Solo dismiss
      } else if (response.status === 404) {
        toast.error("Barbero no encontrado", { id: toastId });
        navigate("/indexBarbers");
      } else {
        toast.error("Error al cargar los datos del barbero", { id: toastId });
      }
    } catch (error) {
      if (!isMounted) return;
      console.error("Error fetching barbero:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  fetchBarbero();

  // Cleanup function para evitar duplicación
  return () => {
    isMounted = false;
  };
}, [codUsuario, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Actualizando barbero...");

    try {
      const response = await fetch(`/usuarios/${barbero?.codUsuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dni,
          cuil,
          nombre,
          apellido,
          telefono,
          email,
          contraseña, // Usar la variable renombrada
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Barbero actualizado exitosamente", {
          id: toastId,
        });
        navigate("/indexBarbers");
      } else {
        toast.error(data.message || "Error al actualizar barbero", {
          id: toastId,
        });
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
          <label className={styles.formLabel} htmlFor="dni">
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
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.buttonSuccess}`}
            type="submit"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateBarber;
