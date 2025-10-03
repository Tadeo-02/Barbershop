import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./appointments.module.css";

interface Appointment {
    appointmentId: number;
    appointmentDate: string;
    appointmentPrice?: number;
}

const CancelAppointment: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await fetch(`/appointments/${appointmentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setAppointment(data);
                } else {
                    console.error("No se pudo obtener el turno para cancelar");
                }
            } catch (err) {
                console.error("Error al obtener el turno:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [appointmentId]);

    const handleCancel = async () => {
        if (!appointment) return;

        const confirmed = window.confirm(
            "¿Estás seguro de que querés cancelar este turno? Esta acción registrará la fecha de cancelación."
        );
        if (!confirmed) return;

        // generar fecha de cancelación en formato YYYY-MM-DD
        const now = new Date();
        const fechaCancelacion = now.toISOString().split("T")[0];

        try {
            const response = await fetch(
                `/appointments/${appointment.appointmentId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fechaCancelacion }),
                }
            );

            const text = await response.text();
            let data: any = { message: "" };
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    // no es JSON
                }
            }

            if (response.ok) {
                alert(data.message || "Fecha de cancelación registrada.");
                navigate("/indexAppointments");
            } else {
                alert(data.message || "Error al registrar la cancelación.");
            }
        } catch (error) {
            console.error("Error en la solicitud de cancelación:", error);
            alert("Error de conexión con el servidor.");
        }
    };

    if (loading)
        return <div className={styles.loadingState}>Cargando turno...</div>;

    if (!appointment)
        return (
            <div className={styles.emptyState}>
                No se encontró el turno seleccionado.
            </div>
        );

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.pageTitle}>Cancelar Turno</h1>
            <div className={styles.appointmentInfo}>
                <div className={styles.appointmentTitle}>
                    Turno #{appointment.appointmentId}
                </div>
                <div className={styles.appointmentCode}>
                    ID: {appointment.appointmentId}
                </div>
                <div className={styles.appointmentDetails}>
                    <span className={styles.appointmentDate}>
                        Fecha: {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </span>
                    {appointment.appointmentPrice !== undefined && (
                        <span className={styles.appointmentTime}>
                            Precio: ${appointment.appointmentPrice}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={handleCancel}
                >
                    Cancelar Turno
                </button>
                <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    onClick={() => navigate(-1)}
                    style={{ marginTop: 10 }}
                >
                    Volver
                </button>
            </div>
        </div>
    );
};

export default CancelAppointment;
