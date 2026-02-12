import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./login.module.css";
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_PATTERN,
} from "../../lib/passwordConstants.ts";
import { getPasswordMissing } from "../../lib/passwordRules";

const ResetSecurity: React.FC = () => {
    const [step, setStep] = useState<"email" | "answer" | "password">("email");
    const [email, setEmail] = useState("");
    const [pregunta, setPregunta] = useState<string | null>(null);
    const [respuesta, setRespuesta] = useState("");
    const [nuevaContraseña, setNuevaContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const navigate = useNavigate();


    const askQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            toast.error("Ingresá un correo válido");
            return;
        }
        try {
            const res = await fetch(`/usuarios/security-question/${encodeURIComponent(cleanEmail)}`);
            const data = await res.json();
            if (res.ok) {
                if (data.pregunta) {
                    setPregunta(data.pregunta);
                    setStep("answer");
                } else {
                    toast.error("No se encontró pregunta para ese correo");
                }
            } else {
                toast.error(data.message || "Error al obtener la pregunta");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error de conexión");
        }
    };

    const submitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanEmail = email.trim();
        const cleanRespuesta = respuesta.trim();
        if (!cleanEmail || !cleanRespuesta) {
            toast.error("Email y respuesta son requeridos");
            return;
        }
        try {
            const res = await fetch(`/usuarios/verify-security-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail, respuestaSeguridad: cleanRespuesta }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Respuesta verificada");
                setStep("password");
            } else {
                toast.error(data?.message || "Error al verificar la respuesta");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error de conexión");
        }
    };

    const submitNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanEmail = email.trim();
        const cleanRespuesta = respuesta.trim();
        if (!cleanEmail || !cleanRespuesta) {
            toast.error("Email y respuesta son requeridos");
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
            const res = await fetch(`/usuarios/verify-security-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail, respuestaSeguridad: cleanRespuesta, nuevaContraseña }),
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
                            <form className={styles.form} onSubmit={askQuestion}>
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
                                        Siguiente
                                    </button>
                                    <button type="button" onClick={() => navigate("/login")}>Volver</button>
                                </p>
                            </form>
                        )}

                        {step === "answer" && (
                            <form className={styles.form} onSubmit={submitAnswer}>
                                <h1>Responder pregunta</h1>
                                <p><strong>{pregunta}</strong></p>
                                <label>Respuesta:</label>
                                <input
                                    type="text"
                                    required
                                    value={respuesta}
                                    onChange={(e) => setRespuesta(e.target.value)}
                                />
                                <p>
                                    <button type="submit" className="btn btn-primary">Verificar respuesta</button>
                                    <button type="button" onClick={() => setStep("email")}>Volver</button>
                                </p>
                            </form>
                        )}

                        {step === "password" && (
                            <form className={styles.form} onSubmit={submitNewPassword}>
                                <h1>Nueva contraseña</h1>

                                <label>Nueva contraseña:</label>
                                <input
                                    type="password"
                                    required
                                    minLength={PASSWORD_MIN_LENGTH}
                                    maxLength={PASSWORD_MAX_LENGTH}
                                    pattern={PASSWORD_PATTERN}
                                    title={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres; debe incluir mayúsculas, minúsculas, números y símbolos`}
                                    value={nuevaContraseña}
                                    onChange={(e) => setNuevaContraseña(e.target.value)}
                                />
                                {nuevaContraseña && getPasswordMissing(nuevaContraseña).length > 0 && (
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
                                <input
                                    type="password"
                                    required
                                    minLength={PASSWORD_MIN_LENGTH}
                                    maxLength={PASSWORD_MAX_LENGTH}
                                    value={confirmarContraseña}
                                    onChange={(e) => setConfirmarContraseña(e.target.value)}
                                />

                                <p>
                                    <button type="submit" className="btn btn-primary">Cambiar contraseña</button>
                                    <button type="button" onClick={() => setStep("answer")}>Volver</button>
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
