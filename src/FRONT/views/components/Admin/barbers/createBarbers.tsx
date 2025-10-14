import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";

interface Sucursal {
  codSucursal: string;
  nombre: string;
}

const CreateBarbers: React.FC = () => {
  const navigate = useNavigate();

  // ESTADOS
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [cuil, setCuil] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<
    string[]
  >([]);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState<
    Sucursal[]
  >([]);

  // Cargar sucursales al montar el componente
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await fetch("/sucursales");
        if (response.ok) {
          const data = await response.json();
          setSucursalesDisponibles(data);
        } else {
          toast.error("Error al cargar las sucursales");
        }
      } catch (error) {
        console.error("Error fetching sucursales:", error);
        toast.error("Error de conexión al cargar sucursales");
      }
    };

    fetchSucursales();
  }, []);

  //funcion para darle formato cuil al input
  const formatCuil = (value: string) => {
    const numbersOnly = value.replace(/\D/g, "");
    const limited = numbersOnly.slice(0, 11);
    // Aplicar formato XX-XXXXXXXX-X
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 10) {
      return `${limited.slice(0, 2)}-${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}-${limited.slice(2, 10)}-${limited.slice(
        10
      )}`;
    }
  };

  // Función para validar CUIL con DNI
  const validateCUILWithDNI = (
    cuilValue: string,
    dniValue: string
  ): boolean => {
    if (!cuilValue || !dniValue) return true;

    const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuilRegex.test(cuilValue)) return false;

    const dniFromCuil = cuilValue.substring(3, 11);
    return dniFromCuil === dniValue;
  };

  const handleCuilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCuil(e.target.value);
    setCuil(formattedValue);
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 8) {
      setDni(value);
    }
  };

  const handleSucursalChange = (codSucursal: string) => {
    setSucursalesSeleccionadas((prev) => {
      if (prev.includes(codSucursal)) {
        return prev.filter((id) => id !== codSucursal);
      } else {
        return [...prev, codSucursal];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contraseña !== confirmarContraseña) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (cuil && !validateCUILWithDNI(cuil, dni)) {
      toast.error("El DNI en el CUIL no coincide con el DNI proporcionado");
      return;
    }

    if (sucursalesSeleccionadas.length === 0) {
      toast.error("Debe seleccionar al menos una sucursal");
      return;
    }

    const toastId = toast.loading("Creando Usuario...");

    try {
      const response = await fetch("/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dni,
          nombre,
          apellido,
          telefono,
          email,
          contraseña,
          cuil,
          sucursales: sucursalesSeleccionadas,
        }),
      });

      const text = await response.text();

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          toast.error("Error al parsear JSON", { id: toastId });
          throw parseError;
        }
      } else {
        toast.error("Respuesta vacía del backend", { id: toastId });
        return;
      }

      if (response.ok) {
        toast.success(data.message || "Usuario creado exitosamente", {
          id: toastId,
          duration: 4000,
        });

        // Limpiar campos del formulario
        setDni("");
        setNombre("");
        setApellido("");
        setTelefono("");
        setEmail("");
        setCuil("");
        setContraseña("");
        setConfirmarContraseña("");
        setSucursalesSeleccionadas([]);

        // Navegar de vuelta a la página de barberos
        navigate("/Admin/BarbersPage");
      } else {
        toast.error(data.message || "Error al crear usuario", { id: toastId });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.pageTitle}>Crear Barbero</h2>

      <form onSubmit={handleSubmit}>
        {/* DNI */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>DNI:</label>
          <input
            className={styles.formInput}
            type="text"
            name="dni"
            placeholder="40300123"
            maxLength={8}
            required
            value={dni}
            onChange={handleDniChange}
          />
        </div>

        {/* NOMBRE */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nombre:</label>
          <input
            className={styles.formInput}
            type="text"
            name="nombre"
            placeholder="Juan"
            maxLength={50}
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        {/* APELLIDO */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Apellido:</label>
          <input
            className={styles.formInput}
            type="text"
            name="apellido"
            placeholder="Pérez"
            maxLength={50}
            required
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>

        {/* TELÉFONO */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Teléfono:</label>
          <input
            className={styles.formInput}
            type="text"
            name="telefono"
            placeholder="+54 11 1234-5678"
            maxLength={20}
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>

        {/* EMAIL */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Correo electrónico:</label>
          <input
            className={styles.formInput}
            type="email"
            name="email"
            placeholder="juan@ejemplo.com"
            maxLength={50}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* CUIL */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>CUIL:</label>
          <input
            className={styles.formInput}
            type="text"
            name="cuil"
            id="cuil"
            placeholder="20-40300123-4"
            value={cuil}
            onChange={handleCuilChange}
            required
          />
          {cuil && !validateCUILWithDNI(cuil, dni) && dni && (
            <div className={styles.errorMessage}>
              El DNI en el CUIL debe coincidir con el DNI proporcionado
            </div>
          )}
        </div>

        {/* CONTRASEÑA */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Contraseña:</label>
          <input
            className={styles.formInput}
            type="password"
            name="contraseña"
            placeholder="********"
            minLength={6}
            maxLength={50}
            required
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
          />
        </div>

        {/* CONFIRMAR CONTRASEÑA */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Confirmar contraseña:</label>
          <input
            className={styles.formInput}
            type="password"
            name="confirmarContraseña"
            placeholder="********"
            minLength={6}
            maxLength={50}
            required
            value={confirmarContraseña}
            onChange={(e) => setConfirmarContraseña(e.target.value)}
          />
        </div>

        {/* ASIGNAR SUCURSALES */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sucursales:</label>
          <div className={styles.checkboxGroup}>
            {sucursalesDisponibles.map((sucursal) => (
              <div key={sucursal.codSucursal} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id={`sucursal-${sucursal.codSucursal}`}
                  checked={sucursalesSeleccionadas.includes(
                    sucursal.codSucursal
                  )}
                  onChange={() => handleSucursalChange(sucursal.codSucursal)}
                  className={styles.checkbox}
                />
                <label
                  htmlFor={`sucursal-${sucursal.codSucursal}`}
                  className={styles.checkboxLabel}
                >
                  {sucursal.nombre}
                </label>
              </div>
            ))}
          </div>
          {sucursalesSeleccionadas.length === 0 && (
            <div className={styles.errorMessage}>
              Debe seleccionar al menos una sucursal
            </div>
          )}
        </div>

        <div className={styles.actionButtons}>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Crear Barbero
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSuccess}`}
            onClick={() => navigate("/Admin/BarbersPage")}
          >
            Volver
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBarbers;
