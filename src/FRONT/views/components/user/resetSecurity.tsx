import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./login.module.css";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../lib/passwordConstants.ts";
import { apiFetch } from "../../lib/apiFetch";
import { getPasswordMissing } from "../../lib/passwordRules";

const ResetSecurity: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [step, setStep] = useState<"email" | "password">(
    initialToken ? "password" : "email",
  );
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Ingresá un correo válido");
      return;
    }
    try {
      const res = await apiFetch(`/usuarios/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.message ||
            "Si el correo existe, enviamos un enlace para restablecer la contraseña.",
        );
        setStep("password");
      } else {
        toast.error(data.message || "No se pudo iniciar la recuperación");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) {
      toast.error("Ingresá el token o abrí el enlace de tu email");
      return;
    }
    const missing = getPasswordMissing(nuevaContraseña);
    if (missing.length > 0) {
      toast.error(`Falta: ${missing.join(", ")}`);
      return;
    }
    if (nuevaContraseña !== confirmarContraseña) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    try {
      const res = await apiFetch(`/usuarios/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: cleanToken,
          nuevaContraseña,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Contraseña actualizada");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(data?.message || "Error al actualizar");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    }
  };

  return (
    <section className={styles.about}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            {step === "email" && (
              <form className={styles.form} onSubmit={requestReset}>
                <h1>Recuperar contraseña</h1>
                <label>Correo electrónico:</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p>Te enviaremos un enlace con un token temporal.</p>
                <p>
                  <button type="submit" className="btn btn-primary">
                    Enviar enlace
                  </button>
                  <button type="button" onClick={() => navigate("/login")}>
                    Volver
                  </button>
                </p>
              </form>
            )}

            {step === "password" && (
              <form className={styles.form} onSubmit={submitNewPassword}>
                <h1>Nueva contraseña</h1>

                <label>Token de recuperación:</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Pegá aquí el token"
                />

                <label>Nueva contraseña:</label>
                <div className={styles.inputWithIcon}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    pattern={PASSWORD_PATTERN}
                    title={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres; debe incluir mayúsculas, minúsculas, números y símbolos`}
                    value={nuevaContraseña}
                    onChange={(e) => setNuevaContraseña(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.inputIconButton}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={
                      showNewPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showNewPassword}
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
                {nuevaContraseña &&
                  getPasswordMissing(nuevaContraseña).length > 0 && (
                    <div className={styles.passwordHints}>
                      <strong>Falta:</strong>
                      <ul>
                        {getPasswordMissing(nuevaContraseña).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <label>Confirmar nueva contraseña:</label>
                <div className={styles.inputWithIcon}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={confirmarContraseña}
                    onChange={(e) => setConfirmarContraseña(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.inputIconButton}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={showConfirmPassword}
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

                <p>
                  <button type="submit" className="btn btn-primary">
                    Cambiar contraseña
                  </button>
                  <button type="button" onClick={() => setStep("email")}>
                    Volver
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetSecurity;
