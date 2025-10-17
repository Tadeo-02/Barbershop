import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";

interface Barbero {
  codUsuario: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  contrase_a: string;
  cuil: string;
  sucursales?: string[];
}

interface Sucursal {
  codSucursal: string;
  nombre: string;
}

const UpdateBarber: React.FC = () => {
  const { codUsuario } = useParams<{ codUsuario: string }>();
  const navigate = useNavigate();
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [cuil, setCuil] = useState("");
  // Cambiar a string único
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>("");
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState<
    Sucursal[]
  >([]);

  useEffect(() => {
    // Cargar sucursales disponibles
    const fetchSucursales = async () => {
      try {
        const response = await fetch("/sucursales");
        if (response.ok) {
          const data = await response.json();
          setSucursalesDisponibles(data);
        }
      } catch (error) {
        console.error("Error fetching sucursales:", error);
      }
    };

    fetchSucursales();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchBarbero = async () => {
      const toastId = toast.loading("Cargando datos del barbero...");

      try {
        const response = await fetch(`/usuarios/${codUsuario}`);

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Debug - Data received from API:", data);

          setBarbero(data);
          setDni(data.dni || "");
          setCuil(data.cuil || "");
          setNombre(data.nombre || "");
          setApellido(data.apellido || "");
          setTelefono(data.telefono || "");
          setEmail(data.email || "");
          setContraseña("");
          // Cambiar para obtener la sucursal única
          setSucursalSeleccionada(data.codSucursal || "");

          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Barbero no encontrado", { id: toastId });
          navigate("/BarbersPage");
        } else {
          toast.error("Error al cargar los datos del barbero", { id: toastId });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("🔍 Debug - Fetch error:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchBarbero();

    return () => {
      isMounted = false;
    };
  }, [codUsuario, navigate]);

  // Cambiar handler para radio button
  const handleSucursalChange = (codSucursal: string) => {
    setSucursalSeleccionada(codSucursal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cambiar validación
    if (!sucursalSeleccionada) {
      toast.error("Debe seleccionar una sucursal");
      return;
    }

    const toastId = toast.loading("Actualizando barbero...");

    try {
      const requestData: any = {
        dni,
        nombre,
        apellido,
        telefono,
        email,
        cuil,
        codSucursal: sucursalSeleccionada, // Enviar como string único
      };

      if (contraseña.trim() !== "") {
        requestData.contraseña = contraseña;
      }

      console.log("🔍 Debug - Request data being sent:", requestData);

      const response = await fetch(`/usuarios/${barbero?.codUsuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("🔍 Debug - Response data:", data);

      if (response.ok) {
        toast.success(data.message || "Barbero actualizado exitosamente", {
          id: toastId,
        });
        navigate("/Admin/BarbersPage");
      } else {
        toast.error(data.message || "Error al actualizar barbero", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("🔍 Debug - Submit error:", error);
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
          <input //todo Arreglar el placeholder
            className={styles.formInput}
            type="password"
            name="contraseña"
            id="contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            placeholder="Ingrese nueva contraseña o deje vacío para mentener la actual"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="cuil">
            CUIL:
          </label>
          <input //todo Arreglar el input del cuil para que por defecto ponga los guiones o no lo exija y se pongan solos una vez enviados
            className={styles.formInput}
            type="text"
            name="cuil"
            id="cuil"
            value={cuil}
            onChange={(e) => setCuil(e.target.value)}
            required
          />
        </div>
        {/* ASIGNAR SUCURSAL - Cambiar a radio buttons */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sucursal:</label>
          <div className={styles.radioGroup}>
            {sucursalesDisponibles.map((sucursal) => (
              <div key={sucursal.codSucursal} className={styles.radioItem}>
                <input
                  type="radio"
                  id={`sucursal-${sucursal.codSucursal}`}
                  name="sucursal"
                  value={sucursal.codSucursal}
                  checked={sucursalSeleccionada === sucursal.codSucursal}
                  onChange={() => handleSucursalChange(sucursal.codSucursal)}
                  className={styles.radio}
                />
                <label
                  htmlFor={`sucursal-${sucursal.codSucursal}`}
                  className={styles.radioLabel}
                >
                  {sucursal.nombre}
                </label>
              </div>
            ))}
          </div>
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
