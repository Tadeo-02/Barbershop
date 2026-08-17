import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./login.module.css";
import { apiFetch } from "../../lib/apiFetch";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const attemptedRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || attemptedRef.current) {
      return;
    }

    attemptedRef.current = true;
    setStatus("loading");

    void (async () => {
      try {
        const res = await apiFetch("/usuarios/email-verification/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verificado correctamente.");
          toast.success("Email verificado. Ya podés iniciar sesión.");
          return;
        }

        setStatus("error");
        setMessage(data.message || "No pudimos verificar el token.");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("No se pudo validar el enlace de verificación.");
      }
    })();
  }, [token]);

  return (
    <section className={styles.about}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className={styles.form}>
              <h1>Verificación de email</h1>
              {!token && <p>Falta el token de verificación en el enlace.</p>}
              {status === "loading" && <p>Verificando tu cuenta...</p>}
              {status === "success" && <p>{message}</p>}
              {status === "error" && <p>{message}</p>}
              {status !== "loading" && (
                <p>
                  <Link to="/login">Ir al login</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
