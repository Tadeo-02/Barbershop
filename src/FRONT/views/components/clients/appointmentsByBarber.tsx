import React, { useEffect, useState } from "react";
import styles from "./appointmentsByBarber.module.css";
import { useParams } from "react-router-dom";

interface Turno {
    id: number;
    fecha: string;
    hora: string;
    disponible: boolean;
}

interface Barbero {
    id: number;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
}

// Simulación de datos de barberos
const barberos: Record<string, Barbero> = {
    "1": { id: 1, nombre: "Juan", apellido: "Pérez", telefono: "123456789", email: "juan.perez@email.com" },
    "2": { id: 2, nombre: "Carlos", apellido: "Gómez", telefono: "987654321", email: "carlos.gomez@email.com" },
    "3": { id: 3, nombre: "Luis", apellido: "Martínez", telefono: "555555555", email: "luis.martinez@email.com" },
    "4": { id: 4, nombre: "Pedro", apellido: "López", telefono: "444444444", email: "pedro.lopez@email.com" },
    "5": { id: 5, nombre: "Jorge", apellido: "Ramírez", telefono: "333333333", email: "jorge.ramirez@email.com" },
};

// Simulación de turnos por barbero
const turnosPorBarbero: Record<string, Turno[]> = {
    "1": [
        { id: 1, fecha: "2025-09-10", hora: "10:00", disponible: true },
        { id: 2, fecha: "2025-09-10", hora: "11:00", disponible: false },
    ],
    "2": [
        { id: 3, fecha: "2025-09-11", hora: "09:30", disponible: true },
    ],
    "3": [
        { id: 4, fecha: "2025-09-12", hora: "14:00", disponible: true },
    ],
    "4": [
        { id: 5, fecha: "2025-09-13", hora: "16:00", disponible: true },
    ],
    "5": [
        { id: 6, fecha: "2025-09-14", hora: "12:00", disponible: false },
        { id: 7, fecha: "2025-09-14", hora: "13:00", disponible: true },
    ],
};

const AppointmentsByBarber = () => {
    const { barberId } = useParams();
    const [appointments, setAppointments] = useState<Turno[]>([]);
    const [barbero, setBarbero] = useState<Barbero | null>(null);

    useEffect(() => {
        setAppointments(turnosPorBarbero[barberId || ""] || []);
        setBarbero(barberos[barberId || ""] || null);
    }, [barberId]);

    const [reserved, setReserved] = useState<Turno | null>(null);

    const handleReserveAppointment = (appointmentId: number) => {
        setAppointments((prevAppointments) =>
            prevAppointments.map((t) =>
                t.id === appointmentId ? { ...t, disponible: false } : t
            )
        );
        const appointmentReserved = appointments.find((t) => t.id === appointmentId) || null;
        setReserved(appointmentReserved);
    };

    return (
        <div className={styles.appointmentsContainer}>
            {barbero && (
                <div className={styles.barberInfo}>
                    <h3>Datos del barbero</h3>
                    <div><strong>Nombre:</strong> {barbero.nombre} {barbero.apellido}</div>
                    {barbero.telefono && <div><strong>Teléfono:</strong> {barbero.telefono}</div>}
                    {barbero.email && <div><strong>Email:</strong> {barbero.email}</div>}
                </div>
            )}
            <h2>Turnos disponibles</h2>
            {reserved && (
                <div className={styles.successMessage}>
                    ¡Turno reservado para el {reserved.fecha} a las {reserved.hora}!
                </div>
            )}
            <ul className={styles.appointmentList}>
                {appointments.length === 0 ? (
                    <li className={styles.emptyState}>No hay turnos disponibles para este barbero.</li>
                ) : (
                    appointments.map((appointment) => (
                        <li key={appointment.id} className={styles.appointmentItem + (!appointment.disponible ? ' ' + styles.appointmentUnavailable : '')}>
                            <div className={styles.appointmentDate}>{appointment.fecha}</div>
                            <div className={styles.appointmentHour}>{appointment.hora}</div>
                            <div className={styles.appointmentStatus}>{appointment.disponible ? "Disponible" : "No disponible"}</div>
                            {appointment.disponible && (
                                <button className={styles.reserveButton} onClick={() => handleReserveAppointment(appointment.id)}>
                                    Reservar appointment
                                </button>
                            )}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default AppointmentsByBarber;
