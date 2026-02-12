import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./login.module.css";

const ResetSecurity: React.FC = () => {
    const [step, setStep] = useState<"email" | "answer">("email");
    const [email, setEmail] = useState("");
    const [pregunta, setPregunta] = useState<string | null>(null);
    const [respuesta, setRespuesta] = useState("");
    const [nuevaContraseña, setNuevaContraseña] = useState("");
    const [confirmarContraseña, setConfirmarContraseña] = useState("");
    const navigate = useNavigate();

    const askQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/usuarios/security-question/${encodeURIComponent(email)}`);
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
        if (nuevaContraseña !== confirmarContraseña) {
            toast.error("Las contraseñas no coinciden");
            return;
        }
        try {
            const res = await fetch(`/usuarios/verify-security-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, respuestaSeguridad: respuesta, nuevaContraseña }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Contraseña actualizada");
                setTimeout(() => navigate("/login"), 1500);
            } else {
                toast.error(data.message || "Error al verificar");
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

                                <label>Nueva contraseña:</label>
                                <input
                                    type="password"
                                    required
                                    minLength={10}
                                    value={nuevaContraseña}
                                    onChange={(e) => setNuevaContraseña(e.target.value)}
                                />

                                <label>Confirmar nueva contraseña:</label>
                                <input
                                    type="password"
                                    required
                                    minLength={10}
                                    value={confirmarContraseña}
                                    onChange={(e) => setConfirmarContraseña(e.target.value)}
                                />

                                <p>
                                    <button type="submit" className="btn btn-primary">Cambiar contraseña</button>
                                    <button type="button" onClick={() => setStep("email")}>Volver</button>
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
