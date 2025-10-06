import React, { useState } from "react";
import { useAuth } from "../login/AuthContext";
import barberStyles from "./appointmentsByBarber.module.css";

const MyReservations: React.FC = () => {
    const auth = useAuth();
    const { reservations, removeReservation } = auth;
    const [toCancel, setToCancel] = useState<any | null>(null);

    if (!reservations || reservations.length === 0) {
        return (
            <div className={barberStyles.emptyState}>No tenés turnos reservados.</div>
        );
    }

    // defensive: deduplicate reservations by id or by key fields (fecha,hora,codBarbero,codSucursal)
    const deduped: any[] = [];
    const seen = new Set<string>();
    for (const r of reservations) {
        try {
            const key = r && r.id ? `id:${r.id}` : `k:${r.fecha}|${r.hora}|${r.codBarbero}|${r.codSucursal}`;
            if (seen.has(key)) continue;
            seen.add(key);
            deduped.push(r);
        } catch (e) {
            // on error, still push
            deduped.push(r);
        }
    }

    const confirmCancel = () => {
        if (!toCancel) return;
        removeReservation(toCancel.id);
        setToCancel(null);
    };

    return (
        <div className={barberStyles.appointmentsContainer}>
            <h2>Mis turnos</h2>
            <div className={barberStyles.appointmentList}>
                {deduped.map((r: any) => (
                    <div key={r.id} className={barberStyles.appointmentItem}>
                        <div className={barberStyles.appointmentDate}>
                            {r.fecha} - {r.hora}
                        </div>
                        <div className={barberStyles.appointmentHour}>
                            {r.barberNombre
                                ? `${r.barberNombre} ${r.barberApellido || ""}`
                                : r.codBarbero}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button
                                className={barberStyles.pageButton}
                                onClick={() => setToCancel(r)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {toCancel && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                    }}
                    onClick={() => setToCancel(null)}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: 20,
                            borderRadius: 8,
                            minWidth: 300,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Confirmar cancelación</h3>
                        <p>
                            ¿Estás seguro que querés cancelar el turno del {toCancel.fecha} a
                            las {toCancel.hora} con{" "}
                            {toCancel.barberNombre
                                ? `${toCancel.barberNombre} ${toCancel.barberApellido || ""}`
                                : toCancel.codBarbero}
                            ?
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                                marginTop: 12,
                            }}
                        >
                            <button
                                className={barberStyles.pageButton}
                                onClick={() => setToCancel(null)}
                            >
                                Cerrar
                            </button>
                            <button
                                className={barberStyles.pageButton}
                                onClick={confirmCancel}
                                style={{ background: "#e53e3e", color: "#fff" }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyReservations;
