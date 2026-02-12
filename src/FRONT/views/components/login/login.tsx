import React, { useState } from "react";
import styles from "./login.module.css";
import { PASSWORD_MAX_LENGTH } from "../../lib/passwordConstants.ts";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.tsx";
import {useUserRedirect} from "../Redirect.tsx";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const { login } = useAuth();
  const { redirectUser } = useUserRedirect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contraseña }),
      });
      const text = await response.text();
      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          toast.error("Respuesta inválida del servidor");
          return;
        }
      } else {
        toast.error("El servidor no devolvió respuesta.");
        return;
      }
      if (response.ok) {
        console.log("✅ Login successful, server response:", data);

        // usar el contexto para manejar el login
        if (data.user) {
          console.log("User data received:", data.user);
          console.log("User cuil:", data.user.cuil);

          login(data.user);

          // gancho de redirección
          redirectUser(data.user, data.message || "Login exitoso");
        } else {
          console.log("No user data in response");
          toast.error("Datos de usuario no encontrados");
        }
      } else {
        console.log("Login failed, server response:", data);
        toast.error(data?.message || "Error de login");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Error de conexión");
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Contraseña:</label>
              <input
                className="form-control"
                type="password"
                name="claveUsuario"
                maxLength={PASSWORD_MAX_LENGTH}
                placeholder="********"
                required
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
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