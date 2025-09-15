import React, { useEffect, useState } from "react";
import styles from "./barbersByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";

interface Barbero {
    id: number;
    nombre: string;
    apellido: string;
}

// Los barberos se obtendrán del backend

const BarbersByBranch = () => {
    const { branchId } = useParams();
    const [barberos, setBarberos] = useState<Barbero[]>([]);

    useEffect(() => {
        if (!branchId) return;
        fetch(`/barbers?branchId=${branchId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Error al obtener barberos");
                return res.json();
            })
            .then((data) => setBarberos(data))
            .catch((err) => {
                setBarberos([]);
                // Puedes mostrar un mensaje de error si lo deseas
            });
    }, [branchId]);

    const navigate = useNavigate();
    const handleSelectBarber = (id: number) => {
    navigate(`/barbers/${id}/appointments`);
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
