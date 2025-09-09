import React, { useEffect, useState } from "react";
import styles from "./barbersByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";

interface Barbero {
    id: number;
    nombre: string;
    apellido: string;
}

// Simulación de barberos por sucursal
const barberosPorSucursal: Record<string, Barbero[]> = {
    "1": [
        { id: 1, nombre: "Juan", apellido: "Pérez" },
        { id: 2, nombre: "Carlos", apellido: "Gómez" },
    ],
    "2": [
        { id: 3, nombre: "Luis", apellido: "Martínez" },
    ],
    "3": [
        { id: 4, nombre: "Pedro", apellido: "López" },
        { id: 5, nombre: "Jorge", apellido: "Ramírez" },
    ],
};

const BarbersByBranch = () => {
    const { branchId } = useParams();
    const [barberos, setBarberos] = useState<Barbero[]>([]);

    useEffect(() => {
        setBarberos(barberosPorSucursal[branchId || ""] || []);
    }, [branchId]);

    const navigate = useNavigate();
    const handleSelectBarber = (id: number) => {
        navigate(`/barbers/${id}/turns`);
    };
    return (
        <div className={styles.barbersContainer}>
            <h2>Elige un barbero</h2>
            <ul className={styles.barberList}>
                {barberos.length === 0 ? (
                    <li className={styles.emptyState}>No hay barberos disponibles en esta sucursal.</li>
                ) : (
                    barberos.map((barbero) => (
                        <li key={barbero.id} className={styles.barberItem} onClick={() => handleSelectBarber(barbero.id)} style={{ cursor: 'pointer' }}>
                            <div className={styles.barberName}>{barbero.apellido}, {barbero.nombre}</div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default BarbersByBranch;
