import React, { useState } from "react";
import styles from "./login.module.css";
import { PASSWORD_MAX_LENGTH } from "../../lib/passwordConstants.ts";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/user/AuthContext.tsx";
import { useUserRedirect } from "../../components/useUserRedirect.ts";
import { deriveRole } from "../../lib/roles.ts";
import toast from "react-hot-toast";
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import { parseBackendResponse } from "../../lib/backendResponse";
import type { User } from "../../components/user/AuthContext.tsx";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function Login() {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { redirectUser } = useUserRedirect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contraseña }),
      });
      const parsed = await parseBackendResponse<{ user?: User; token?: string; message?: string }>(response);
      
      if (!parsed.ok && parsed.message) {
        toast.error(parsed.message);
        return;
      }
      if (response.ok) {
        if (parsed.data?.user) {
          const role = deriveRole(parsed.data.user.cuil);
          login(parsed.data.user, role);
          redirectUser(parsed.data.user, parsed.message || "Login exitoso");
        } else {
          toast.error("Datos de usuario no encontrados");
        }
      } else {
        toast.error(parsed.message || "Error de login");
      }

    } catch (error) {
      if (handleAbortOrConnectionError(error, undefined, "Error de conexión")) {
        return;
      }
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
              <div className={styles.inputWithIcon}>
                <input
                  className="form-control"
                  type={showPassword ? "text" : "password"}
                  name="claveUsuario"
                  maxLength={PASSWORD_MAX_LENGTH}
                  placeholder="********"
                  required
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.inputIconButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                >
                  <svg
                    className={styles.inputIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
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
