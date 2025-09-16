import React, { useEffect, useState } from "react";
import styles from "./scheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";

interface Horario {
    id: number;
    fecha: string;
    hora: string;
    disponible: boolean;
}

// Simulación de horarios por sucursal
const horariosPorSucursal: Record<string, Horario[]> = {
    "1": [
        { id: 1, fecha: "2025-09-10", hora: "10:00", disponible: true },
        { id: 2, fecha: "2025-09-10", hora: "11:00", disponible: true },
    ],
    "2": [
        { id: 3, fecha: "2025-09-11", hora: "09:30", disponible: true },
    ],
    "3": [
        { id: 4, fecha: "2025-09-12", hora: "14:00", disponible: true },
    ],
};

const ScheduleByBranch = () => {
    const { branchId } = useParams();
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        setHorarios(horariosPorSucursal[branchId || ""] || []);
    }, [branchId]);

    const handleSelectHorario = (id: number) => {
        navigate(`/branches/${branchId}/schedule/${id}/barbers`);
    };

    return (
        <div className={styles.scheduleContainer}>
            <h2>Elige un horario</h2>
            <ul className={styles.scheduleList}>
                {horarios.length === 0 ? (
                    <li className={styles.emptyState}>No hay horarios disponibles en esta sucursal.</li>
                ) : (
                    horarios.map((horario) => (
                        <li key={horario.id} className={styles.scheduleItem} onClick={() => handleSelectHorario(horario.id)} style={{ cursor: 'pointer' }}>
                            <div className={styles.scheduleDate}>{horario.fecha}</div>
                            <div className={styles.scheduleHour}>{horario.hora}</div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default ScheduleByBranch;
