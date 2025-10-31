import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./endAppointments.module.css";
import { useAuth } from "../../login/AuthContext.tsx";
import { toast } from "react-hot-toast";

interface TurnoRaw {
    codTurno: string;
    fechaTurno: string;
    codBarbero: string;
    codCliente: string;
    // may include related objects depending on backend
    usuarios_turnos_codClienteTousuarios?: {
        codUsuario: string;
        nombre?: string;
        apellido?: string;
        dni?: string;
    } | null;
}

interface Turno extends TurnoRaw {
    clienteNombre?: string;
    clienteDni?: string;
    estado?: string;
    metodoPago?: string;
    codCorte?: string;
    nombreCorte?: string;
    horario?: string;
    codSucursal?: string;
}

// Generador de turnos ficticios para testing/preview
const createMockTurnos = (codBarbero: string, count = 3, codSucursal?: string): Turno[] => {
    const mockNames = [
        { nombre: "Chris", apellido: "Paul", dni: "35.123.456" },
        { nombre: "María", apellido: "Pérez", dni: "23456789" },
        { nombre: "Lucía", apellido: "Ramírez", dni: "34567890" },
        { nombre: "Pedro", apellido: "López", dni: "45678901" },
        { nombre: "Ana", apellido: "García", dni: "56789012" },
        { nombre: "José", apellido: "Fernández", dni: "67890123" },
    ];

    const today = new Date();
    const turnos: Turno[] = [];

    // Empezar la asignación de clientes desde un offset aleatorio para evitar
    // que múltiples llamadas consecutivas a createMockTurnos (p. ej. todayMock + mock)
    // asignen el mismo cliente en las primeras posiciones.
    const startIdx = Math.floor(Math.random() * mockNames.length);

    const fmtTime = (d: Date) => {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    for (let i = 0; i < count; i++) {
        // Si es el primer turno, forzamos que sea Chris Paul el 31/10/2025 a las 13:00
        if (i === 0) {
            const fecha = new Date(2025, 9, 31, 13, 0, 0); // meses 0-index (9 = octubre)
            const cliente = mockNames[0]; // Chris Paul está en la posición 0
            turnos.push({
                codTurno: `${Date.now()}-${Math.floor(Math.random() * 1e6)}-0`,
                fechaTurno: fecha.toISOString(),
                horario: fmtTime(fecha),
                codBarbero,
                codSucursal: codSucursal || `sucursal-mock-1`,
                codCliente: `mock-chris-paul`,
                usuarios_turnos_codClienteTousuarios: {
                    codUsuario: `mock-chris-paul`,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    dni: cliente.dni,
                },
                clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
                clienteDni: cliente.dni,
            });
            continue;
        }

        const fecha = new Date(today);
        // Hacer que los turnos siguientes sean en días futuros
        const diaOffset = i + 1;
        fecha.setDate(today.getDate() + diaOffset);
    // Normalizar hora para evitar problemas de comparación (ej.: 09:00)
    fecha.setHours(9 + (i % 8), 0, 0, 0);
        // Evitar que el segundo turno (i === 1) coincida con Chris (índice 0)
        let idx = (startIdx + i) % mockNames.length;
        if (i === 1 && idx === 0) {
            idx = (idx + 1) % mockNames.length; // mover al siguiente cliente
        }
        const cliente = mockNames[idx];

        turnos.push({
            // Generar un identificador único más robusto para evitar duplicados
            // incluso si la función se llama varias veces en el mismo milisegundo.
            codTurno: `${Date.now()}-${Math.floor(Math.random() * 1e6)}-${i}`,
            fechaTurno: fecha.toISOString(),
            horario: fmtTime(fecha),
            codBarbero,
            codSucursal: codSucursal || `sucursal-mock-${(i % 3) + 1}`,
            codCliente: `mock-cliente-${i}`,
            usuarios_turnos_codClienteTousuarios: {
                codUsuario: `mock-cliente-${i}`,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                dni: cliente.dni,
            },
            clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
            clienteDni: cliente.dni,
        });
    }

    return turnos;
};

const IndexAppointments = () => {
    const { user } = useAuth();
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [query, setQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, Partial<Turno>>>({});
    const successRef = useRef<HTMLDivElement | null>(null);
    const redirectRef = useRef<HTMLDivElement | null>(null);
    const [successTurno, setSuccessTurno] = useState<string | null>(null);
    const [redirectingTurno, setRedirectingTurno] = useState<string | null>(null);

    const tiposCorte = [
        { codCorte: "corte-1", nombreCorte: "Corte clásico" },
        { codCorte: "corte-2", nombreCorte: "Degrade" },
        { codCorte: "corte-3", nombreCorte: "Barba" },
    ];
    const metodosPago = ["Efectivo", "Tarjeta", "Billetera virtual"];
    const estados = ["No asistido", "Cobrado", "Sin cobrar"];

    // Usar siempre datos ficticios (sin fetch al backend)
    useEffect(() => {
        const key = `mock_turnos_${user?.codUsuario || 'mock'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
        try {
            let parsed: Turno[] = JSON.parse(saved);
            const fmtTimeLocal = (d: Date) => {
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                return `${h}:${m}`;
            };
            // Asegurar que los turnos cargados desde localStorage tengan 'horario'
            parsed = parsed.map(p => ({ ...p, horario: p.horario || (p.fechaTurno ? fmtTimeLocal(new Date(p.fechaTurno)) : undefined) }));

                // Si la mayoría de los turnos están en el pasado, regenerar nuevos turnos futuros
                const ahora = new Date();
                const pastCount = parsed.reduce((acc, t) => acc + (new Date(t.fechaTurno) < ahora ? 1 : 0), 0);
                if (parsed.length > 0 && pastCount / parsed.length > 0.5) {
                    const mock = createMockTurnos(user?.codUsuario || "mock-barbero", 8);
                    setTurnos(mock);
                    localStorage.setItem(key, JSON.stringify(mock));
                    return;
                }

                // Si no hay ningún turno para hoy entre los guardados, añadir uno para hoy
                const hasToday = parsed.some((t) => {
                    try {
                        return new Date(t.fechaTurno).toDateString() === ahora.toDateString();
                    } catch {
                        return false;
                    }
                });
                if (!hasToday) {
                    // Crear un turno para hoy pero forzar que pertenezca a OTRO barbero
                    const todayMock = createMockTurnos(user?.codUsuario || "mock-barbero", 1, user?.codSucursal || undefined)[0];
                    todayMock.codBarbero = user ? `other-${user.codUsuario}` : "other-mock-barbero";
                    // Forzar fecha exactamente a hoy (manteniendo hora razonable)
                    const f = new Date();
                    f.setHours(10, 0, 0, 0);
                    todayMock.fechaTurno = f.toISOString();
                    todayMock.horario = fmtTimeLocal(f);
                    const next = [...parsed, todayMock];
                    setTurnos(next);
                    localStorage.setItem(key, JSON.stringify(next));
                    return;
                }

                setTurnos(parsed);
                return;
            } catch {}
        }

    const mock = createMockTurnos(user?.codUsuario || "mock-barbero", 8, user?.codSucursal || undefined);
        setTurnos(mock);
        localStorage.setItem(key, JSON.stringify(mock));
    }, [user]);

    // Cuando se establece redirectingTurno, hacemos scroll al banner de redirección
    useEffect(() => {
        if (!redirectingTurno) return;
        if (redirectRef.current) {
            try { redirectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
        }
    }, [redirectingTurno]);

    // Cuando se establece successTurno, hacemos scroll al mensaje y lo ocultamos luego
    useEffect(() => {
        if (!successTurno) return;
        if (successRef.current) {
            try {
                successRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch {}
        }
        const t = setTimeout(() => setSuccessTurno(null), 4000);
        return () => clearTimeout(t);
    }, [successTurno]);

    // helpers para edición local
    const startEdit = (t: Turno) => {
        // Validar antes de navegar. No abrimos modal, navegamos a la vista de detalles

        setEditingId(t.codTurno);
        setDrafts((d) => ({
            ...d,
            [t.codTurno]: {
                estado: t.estado || estados[0],
                metodoPago: t.metodoPago || metodosPago[0],
                codCorte: t.codCorte || tiposCorte[0].codCorte,
                nombreCorte: t.nombreCorte || tiposCorte[0].nombreCorte,
            },
        }));
    };

    // Función de utilidad para regenerar y persistir turnos demo (útil para testing)
    const regenerateMocks = (count = 8) => {
        const key = `mock_turnos_${user?.codUsuario || 'mock'}`;
        const mock = createMockTurnos(user?.codUsuario || "mock-barbero", count, user?.codSucursal || undefined);
        // Añadir explicitamente un turno para hoy que pertenezca a otro barbero
    const f = new Date();
        f.setHours(10, 0, 0, 0);
        const fmtTimeLocal = (d: Date) => {
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        };
        // Crear todayMock manualmente y asegurarnos que NO sea Chris Paul
        const todayMock: Turno = {
            codTurno: `${Date.now()}-${Math.floor(Math.random() * 1e6)}-today`,
            fechaTurno: f.toISOString(),
            horario: fmtTimeLocal(f),
            codBarbero: user ? `other-${user.codUsuario}` : "other-mock-barbero",
            codSucursal: user?.codSucursal || `sucursal-mock-1`,
            codCliente: `mock-maria-perez`,
            usuarios_turnos_codClienteTousuarios: {
                codUsuario: `mock-maria-perez`,
                nombre: "María",
                apellido: "Pérez",
                dni: "23456789",
            },
            clienteNombre: `María Pérez`,
            clienteDni: `23456789`,
        };
        // Añadir al final para que el primer turno generado por createMockTurnos siga siendo Chris Paul
        mock.push(todayMock);
        setTurnos(mock);
        try { localStorage.setItem(key, JSON.stringify(mock)); } catch {}
    };

    // Eliminar todos los turnos demo almacenados en localStorage (keys: mock_turnos_*)
    const clearMocks = () => {
        try {
            const prefix = "mock_turnos_";
            const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
            keys.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            // ignore
        }
        // Vaciar la lista en pantalla
        setTurnos([]);
        toast.success("Turnos demo eliminados");
    };

    const changeDraft = (codTurno: string, field: keyof Turno, value: any) => {
        setDrafts((d) => ({ ...d, [codTurno]: { ...(d[codTurno] || {}), [field]: value } }));
    };

    const cancelEdit = (codTurno: string) => {
        setEditingId(null);
        setDrafts((d) => {
            const next = { ...d };
            delete next[codTurno];
            return next;
        });
    };

    const saveEdit = (codTurno: string) => {
        const draft = drafts[codTurno];
        if (!draft) return;
        setTurnos((prev) => {
            const next = prev.map((t) => t.codTurno === codTurno ? { ...t, ...draft } : t);
            try {
                const key = `mock_turnos_${user?.codUsuario || 'mock'}`;
                localStorage.setItem(key, JSON.stringify(next));
            } catch {}
            return next;
        });
        // Si el método es Billetera virtual, primero mostramos un banner de redirección
        // para realizar el pago externo y luego simulamos la recepción en nuestro sistema.
        if (draft.metodoPago === "Billetera virtual") {
            setRedirectingTurno(codTurno);

            // Simular un proceso de pago externo: después de 3s marcamos como recibido
            const key = `mock_turnos_${user?.codUsuario || 'mock'}`;
            setTimeout(() => {
                setTurnos((prev) => {
                    const next2 = prev.map((tr) => tr.codTurno === codTurno ? { ...tr, ...draft, estado: 'Cobrado', metodoPago: 'Billetera virtual' } : tr);
                    try { localStorage.setItem(key, JSON.stringify(next2)); } catch {}
                    return next2;
                });
                setRedirectingTurno(null);
                setSuccessTurno(codTurno);
            }, 7000);

            // Permitimos cancelar/limpiar si el usuario navegara (no almacenamos timer para este demo)
        } else {
            // Para otros métodos, mostrar directamente el mensaje de éxito si aplica
            if (draft.estado === "Cobrado") setSuccessTurno(codTurno);
        }

        cancelEdit(codTurno);
    };

    const filtered = useMemo(() => {
        if (!query) return turnos;
        const q = query.toLowerCase();
        return turnos.filter((t) => {
            const cod = String(t.codTurno || "").toLowerCase();
            const nombre = String(t.clienteNombre || "").toLowerCase();
            const dni = String(t.clienteDni || t.usuarios_turnos_codClienteTousuarios?.dni || "").toLowerCase();
            return cod.includes(q) || nombre.includes(q) || dni.includes(q);
        });
    }, [query, turnos]);

    return (
        <div className={styles.indexAppointments}>
            <h2>Turnos Pendientes</h2>

            <div style={{ marginBottom: 12 }}>


                <input
                    className={styles.searchInput}
                    placeholder="Buscar por código, nombre o DNI"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

            </div>

            {/* success message is rendered inline inside the matching list item */}

            {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                    {query ? (
                        <p>No se encuentran turnos con ese código.</p>
                    ) : (
                        <p>No hay turnos disponibles.</p>
                    )}
                </div>
            ) : (
                <ul>
                    {filtered.map((turno) => {
                        const isEditing = editingId === turno.codTurno;
                        const draft = drafts[turno.codTurno] || {};
                        return (
                            <li key={turno.codTurno}>
                                <div className={styles.appointmentInfo}>
                                    <div className={styles.appointmentTitle}>Turno #{turno.codTurno}</div>
                                    <div className={styles.appointmentCode}>Código: {turno.codTurno}</div>
                                    <div className={styles.appointmentDetails}>
                                        <span className={styles.appointmentDate}>
                                            Fecha: {new Date(turno.fechaTurno).toLocaleDateString()} 
                                        </span>
                                        <div className={styles.appointmentDate}>
                                            Hora: {turno.horario ?? new Date(turno.fechaTurno).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </div>
                                        {turno.clienteNombre && (
                                            <div>Cliente: {turno.clienteNombre}</div>
                                        )}
                                        {turno.clienteDni && (
                                            <div>DNI: {turno.clienteDni}</div>
                                        )}
                                        {turno.estado && <div>Estado: {turno.estado}</div>}
                                        {turno.metodoPago && <div>Método: {turno.metodoPago}</div>}
                                        {turno.nombreCorte && <div>Corte: {turno.nombreCorte}</div>}
                                    </div>
                                </div>

                                {redirectingTurno === turno.codTurno && (
                                    <div ref={redirectRef} className={styles.redirectMessage}>
                                        Redirigiendo a Billetera virtual para realizar el pago... (esperando confirmación de pago)
                                    </div>
                                )}

                                {successTurno === turno.codTurno && (
                                    <div ref={successRef} className={styles.successMessage}>
                                        Cobro con billetera virtual realizado para el turno #{turno.codTurno}.
                                    </div>
                                )}

                                <div className={styles.actionButtons}>
                                    {!isEditing ? (
                                        <>
                                            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => startEdit(turno)}>Finalizar Turno</button>
                                            <Link to={`/appointments/${turno.codTurno}`} className={`${styles.button} ${styles.buttonPrimary}`}>Ver Detalles</Link>
                                        </>
                                    ) : (
                                        <div className={styles.editControls}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                                                <select className={styles.editSelect} value={String(draft.estado || '')} onChange={(e) => changeDraft(turno.codTurno, 'estado', e.target.value)}>
                                                    <option value=''>Seleccionar estado</option>
                                                    {estados.map((s) => <option key={s} value={s}>{s}</option>)}
                                                </select>

                                                <select className={styles.editSelect} value={String(draft.metodoPago || '')} onChange={(e) => changeDraft(turno.codTurno, 'metodoPago', e.target.value)}>
                                                    <option value=''>Seleccionar método</option>
                                                    {metodosPago.map((m) => <option key={m} value={m}>{m}</option>)}
                                                </select>

                                                <select className={styles.editSelect} value={String(draft.codCorte || '')} onChange={(e) => {
                                                    const sel = tiposCorte.find(tc => tc.codCorte === e.target.value);
                                                    changeDraft(turno.codTurno, 'codCorte', e.target.value);
                                                    changeDraft(turno.codTurno, 'nombreCorte', sel?.nombreCorte || '');
                                                }}>
                                                    <option value=''>Seleccionar corte</option>
                                                    {tiposCorte.map((tc) => <option key={tc.codCorte} value={tc.codCorte}>{tc.nombreCorte}</option>)}
                                                </select>
                                            </div>

                                            <div className={styles.actionButtons}>
                                                <button className={`${styles.button} ${styles.buttonSuccess}`} onClick={() => saveEdit(turno.codTurno)}>Guardar</button>
                                                <button className={`${styles.button} ${styles.buttonDanger}`} onClick={() => cancelEdit(turno.codTurno)}>Cancelar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default IndexAppointments;
