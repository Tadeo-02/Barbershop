import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./login.module.css";
import { apiFetch } from "../../lib/apiFetch";
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import { parseBackendResponse } from "../../lib/backendResponse";
import logger from "../../lib/logger";

type VerifyStatus = "idle" | "loading" | "success" | "error";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const sentRef = useRef(false);

  const confirmToken = useCallback(async (rawToken: string) => {
    const cleanToken = rawToken.trim();
    if (!cleanToken) {
      setStatus("error");
      setMessage("Token inválido o expirado.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const res = await apiFetch("/usuarios/email-verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleanToken }),
      });
      const parsed = await parseBackendResponse(res);
      if (parsed.ok) {
        setStatus("success");
        setMessage(parsed.message || "Email verificado correctamente.");
        toast.success(parsed.message || "Email verificado correctamente.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setStatus("error");
        setMessage(parsed.message || "Token inválido o expirado.");
      }
    } catch (err) {
      if (handleAbortOrConnectionError(err, undefined, "Error de conexión")) {
        return;
      }
      setStatus("error");
      setMessage("Error de conexión, intentá nuevamente.");
      logger.error(err);
    }
  }, [navigate]);

  useEffect(() => {
    if (sentRef.current) return;
    if (tokenFromUrl) {
      sentRef.current = true;
      confirmToken(tokenFromUrl);
    }
  }, [tokenFromUrl, confirmToken]);

  const handleRetry = (e: React.FormEvent) => {
    e.preventDefault();
    sentRef.current = true;
    confirmToken(token);
  };

  const resendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Ingresá un correo válido");
      return;
    }
    setResending(true);
    try {
      const res = await apiFetch("/usuarios/email-verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const parsed = await parseBackendResponse(res);
      if (parsed.ok) {
        toast.success(
          parsed.message ||
            "Si el email existe y necesita verificación, enviamos un enlace para activar la cuenta.",
        );
        setStatus("idle");
        setMessage("");
      } else {
        toast.error(parsed.message || "Error al reenviar la verificación");
      }
    } catch (err) {
      if (handleAbortOrConnectionError(err, undefined, "Error de conexión")) {
        return;
      }
      logger.error(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <section id="about" className={styles.about}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <form className={styles.form} onSubmit={handleRetry}>
              <h1>VERIFICAR EMAIL</h1>

              {status === "loading" && (
                <p>Verificando tu cuenta...</p>
              )}

              {status === "success" && (
                <>
                  <p style={{ color: "var(--color-success)" }}>{message}</p>
                  <p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate("/login")}
                    >
                      Ir al Login
                    </button>
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <p style={{ color: "var(--color-danger-bright)" }}>{message}</p>
                  <label>Token de verificación:</label>
                  <input
                    type="text"
                    required
                    placeholder="Pegá el token de tu email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <p>
                    <button type="submit" className="btn btn-primary">
                      Reintentar
                    </button>
                  </p>
                  <hr />
                  <h2>¿Token expirado?</h2>
                  <label>Correo electrónico:</label>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={resending}
                  />
                  <p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={resendVerification}
                      disabled={resending}
                    >
                      {resending ? "Enviando..." : "Reenviar enlace"}
                    </button>
                  </p>
                </>
              )}

              {status === "idle" && (
                <>
                  <p>Ingresá el token de verificación de tu email.</p>
                  <label>Token de verificación:</label>
                  <input
                    type="text"
                    required
                    placeholder="Pegá el token de tu email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <p>
                    <button type="submit" className="btn btn-primary">
                      Verificar
                    </button>
                  </p>
                </>
              )}

              <p>
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

export default VerifyEmail;