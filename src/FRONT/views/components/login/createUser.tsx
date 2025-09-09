//! TERMINAR
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import toast from "react-hot-toast"; // importar librería de alerts

const CreateUser: React.FC = () => {
  const navigate = useNavigate();

  // ESTADOS
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (contraseña !== confirmarContraseña) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const toastId = toast.loading("Creando Usuario..."); // loading

    try {
      console.log(
        "Enviando POST a /usuarios con datos:",
        dni,
        nombre,
        apellido,
        telefono,
        email
      );

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
        }),
      });

      console.log("Después de fetch, status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);
      console.log("Response.ok:", response.ok);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("Después de JSON.parse, data:", data);
        } catch (parseError) {
          toast.error("Error al parsear JSON", { id: toastId });
          throw parseError;
        }
      } else {
        toast.error("Respuesta vacía del backend", { id: toastId });
        return;
      }

      if (response.ok) {
        console.log("Entrando en response.ok, preparando toast de éxito...");

        // Probar directamente reemplazando el toast de loading
        toast.success(data.message || "Usuario creado exitosamente", {
          id: toastId, // Usar el mismo ID para reemplazar
          duration: 4000, // 4 segundos de duración
        });

        console.log(
          "Toast de éxito mostrado:",
          data.message || "Usuario creado exitosamente"
        );

        // Limpiar campos del formulario
        setDni("");
        setNombre("");
        setApellido("");
        setTelefono("");
        setEmail("");
        setContraseña("");
        setConfirmarContraseña("");

        // Esperar 4.5 segundos antes de navegar para que el usuario vea el toast completo
        setTimeout(() => {
          navigate("/login");
        }, 4500);
      } else {
        toast.error(data.message || "Error al crear usuario", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <section className={styles.about}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <form className={styles.form} onSubmit={handleSubmit}>
              <br />
              <br />
              <br />
              <h1>CREAR CUENTA</h1>
              <br />

              {/* DNI */}
              <label>DNI:</label>
              <input
                type="text"
                name="dni"
                placeholder="12345678"
                maxLength={8}
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />

              {/* NOMBRE */}
              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                placeholder="Juan"
                maxLength={50}
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />

              {/* APELLIDO */}
              <label>Apellido:</label>
              <input
                type="text"
                name="apellido"
                placeholder="Pérez"
                maxLength={50}
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />

              {/* TELÉFONO */}
              <label>Teléfono:</label>
              <input
                type="text"
                name="telefono"
                placeholder="+54 11 1234-5678"
                maxLength={20}
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />

              {/* EMAIL */}
              <label>Correo electrónico:</label>
              <input
                type="email"
                name="email"
                placeholder="juan@ejemplo.com"
                maxLength={50}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* CONTRASEÑA */}
              <label>Contraseña:</label>
              <input
                type="password"
                name="contraseña"
                placeholder="********"
                minLength={6}
                maxLength={50}
                required
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
              />

              {/* CONFIRMAR CONTRASEÑA */}
              <label>Confirmar contraseña:</label>
              <input
                type="password"
                name="confirmarContraseña"
                placeholder="********"
                minLength={6}
                maxLength={50}
                required
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
              />

              <p className="has-text-centered">
                <br />
                <button type="submit" className="btn btn-primary">
                  Crear Cuenta
                </button>
                <br />
                <br />
                <button type="button" onClick={() => navigate("/login")}>
                  Volver al Login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateUser;
