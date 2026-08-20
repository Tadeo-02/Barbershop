import React, { useState, useEffect } from "react";
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
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import { parseBackendResponse } from "../../lib/backendResponse";
import logger from "../../lib/logger";

const ResetSecurity: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [step, setStep] = useState<"email" | "password">(
    tokenFromUrl ? "password" : "email",
  );
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep("password");
    }
  }, [tokenFromUrl]);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Ingresá un correo válido");
      return;
    }
    try {
      const res = await apiFetch("/usuarios/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const parsed = await parseBackendResponse(res);
      if (parsed.ok) {
        toast.success(
          parsed.message || "Si el email existe, enviamos un enlace para restablecer la contraseña.",
        );
      } else {
        toast.error(parsed.message || "Error al solicitar restablecimiento");
      }
    } catch (err) {
      if (handleAbortOrConnectionError(err, undefined, "Error de conexión")) {
        return;
      }
      logger.error(err);
    }
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.trim();
    if (!cleanToken) {
      toast.error("Token inválido");
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
      const res = await apiFetch("/usuarios/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleanToken, nuevaContraseña }),
      });
      const parsed = await parseBackendResponse(res);
      if (parsed.ok) {
        toast.success(parsed.message || "Contraseña actualizada");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(parsed.message || "Error al actualizar");
      }
    } catch (err) {
      if (handleAbortOrConnectionError(err, undefined, "Error de conexión")) {
        return;
      }
      logger.error(err);
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

                {!tokenFromUrl && (
                  <>
                    <label>Token de restablecimiento:</label>
                    <input
                      type="text"
                      required
                      placeholder="Pegá el token de tu email"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </>
                )}

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
