import React, { useState } from "react";
import styles from "./login.module.css";
import { Link } from "react-router-dom";

function Login() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, clave }),
      });
      const text = await response.text();
      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          alert("Respuesta inválida del servidor");
          return;
        }
      } else {
        alert("El servidor no devolvió respuesta.");
        return;
      }
      if (response.ok) {
        alert(data.message || "Login exitoso");
        // Aquí puedes redirigir o guardar token, etc.
      } else {
        alert(data.message || "Error de login");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Error de conexión");
    }
  };

  return (
    <section id="about" className={styles.about}>
      <div className="container-fluid">
        <div className="row ">
          <div className="col-12">
            <form
              className={styles.form}
              autoComplete="on"
              onSubmit={handleSubmit}
            >
              <br />
              <br />
              <br />
              <h1>INICIO DE SESIÓN</h1>
              <br />
              <label>Correo electrónico:</label>
              <input
                className="form-control"
                type="email"
                name="email"
                placeholder="hola@ejemplo.com"
                maxLength={70}
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
              <label>Contraseña:</label>
              <input
                className="form-control"
                type="password"
                name="claveUsuario"
                pattern="[a-zA-Z0-9$@.-]{7,100}"
                maxLength={100}
                placeholder="********"
                required
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
              <p className="has-text-centered">
                <br />
                <button
                  type="submit"
                  className="btn btn-primary"
                  value="Ingresar"
                >
                  Confirmar
                </button>
                <br />
                <br />
                <Link to="/changePassword">¿Has olvidado la contraseña?</Link>
                <br />
                <br />
                <Link to="/signUp">Crear Cuenta</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Login;
