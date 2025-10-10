import { useEffect, useState, useRef } from "react";
import styles from "./appointmentsByBarber.module.css";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../login/AuthContext";
import { toast } from "react-hot-toast";

interface Turno {
    id: number;
    fecha: string;
    horaDesde: string;
    // `hora` is the normalized HH:MM string used by the UI
    hora?: string;
    fechaCancelacion?: string | null;
    barberId: string;
}

interface Barbero {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
}

const AppointmentsByBarber = () => {

    // Helper: ensure a date string or Date becomes "YYYY-MM-DD"
    const formatDateToYYYYMMDD = (input: string | Date | undefined | null): string => {
        if (!input) return new Date().toISOString().substring(0,10);
        if (typeof input === 'string') {
            const s = input.trim();
            // already in YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
            // try parsing other common formats
            const dt = new Date(s);
            if (!isNaN(dt.getTime())) return dt.toISOString().substring(0,10);
            // fallback: if string contains a date-like part
            const m = s.match(/(\d{4}-\d{2}-\d{2})/);
            if (m) return m[1];
            return new Date().toISOString().substring(0,10);
        }
        // Date
        if (input instanceof Date && !isNaN(input.getTime())) {
            return input.toISOString().substring(0,10);
        }
        return new Date().toISOString().substring(0,10);
    };

    const params = useParams<{ codBarbero?: string; barberId?: string }>();
    const barberId = params.codBarbero ?? params.barberId ?? "";
    const [appointments, setAppointments] = useState<Turno[]>([]);
    const [barbero, setBarbero] = useState<Barbero | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0,10));
    const [usedLocalSchedule, setUsedLocalSchedule] = useState(false);

    // today in YYYY-MM-DD for comparisons
    const todayYYYYMMDD = new Date().toISOString().substring(0,10);

    const [loadingBarber, setLoadingBarber] = useState(false);
    const [barberError, setBarberError] = useState<string | null>(null);
    // helpers: generate 30-min slots between 10:00 and 20:00 (last slot 19:30)
    const generateSlots = (fromHour = 10, toHour = 20, stepMinutes = 30): { hora: string }[] => {
        const slots: { hora: string }[] = [];
        const totalMinutesStart = fromHour * 60;
        const totalMinutesEnd = toHour * 60;
        for (let t = totalMinutesStart; t + stepMinutes <= totalMinutesEnd; t += stepMinutes) {
            const hh = Math.floor(t / 60).toString().padStart(2, '0');
            const mm = (t % 60).toString().padStart(2, '0');
            slots.push({ hora: `${hh}:${mm}` });
        }
        return slots;
    };

    // refreshAppointments: generate local slots and remove those occupied in DB
    const refreshAppointments = async (fecha?: string) => {
        if (!barberId) return;
        const targetDateRaw = fecha ?? selectedDate ?? new Date().toISOString().substring(0,10);
        const targetDate = formatDateToYYYYMMDD(targetDateRaw);
        // weekday check
        const d = new Date(targetDate + 'T00:00:00');
        const day = d.getDay();
        if (day < 1 || day > 5) {
            setAppointments([]);
            return;
        }
        const generated = generateSlots();
        try {
            const r = await fetch(`/appointments`);
            const all = r.ok ? await r.json() : [];
            const list = Array.isArray(all) ? all : [];

            const occupied = list.filter(a => {
                try {
                    const matchesBarber = String(a.codBarbero) === String(barberId);
                    const fechaTurnoRaw = a.fechaTurno || a.fecha || a.fecha_turno || '';
                    let fechaNormalized = '';
                    if (fechaTurnoRaw) {
                        const simpleDate = String(fechaTurnoRaw).match(/^\d{4}-\d{2}-\d{2}$/);
                        if (simpleDate) {
                            fechaNormalized = simpleDate[0];
                        } else {
                            const dt = new Date(fechaTurnoRaw);
                            if (!isNaN(dt.getTime())) {
                                fechaNormalized = dt.toISOString().substring(0,10);
                            }
                        }
                    }
                    const sameDate = fechaNormalized === targetDate;
                    const isCancelled = !!(a.fechaCancelacion && String(a.fechaCancelacion).trim() !== '');
                    return matchesBarber && sameDate && !isCancelled;
                } catch (e) {
                    return false;
                }
            });

            const occupiedSet = new Set<string>();
            for (const o of occupied) {
                if (o.horaDesde) {
                    try { const dt = new Date(o.horaDesde); if (!isNaN(dt.getTime())) { occupiedSet.add(dt.toTimeString().substring(0,5)); continue; } } catch {}
                }
                if (o.hora) {
                    const raw = String(o.hora);
                    const match = raw.match(/(\d{1,2}:\d{2})/);
                    if (match) { occupiedSet.add(match[1].padStart(5,'0')); continue; }
                }
                if (o.hora_desde) {
                    try { const d2 = new Date(o.hora_desde); if (!isNaN(d2.getTime())) { occupiedSet.add(d2.toTimeString().substring(0,5)); continue; } } catch {}
                }
            }

            const availableSlots = generated.filter((s:{hora:string}) => !occupiedSet.has(s.hora));
            const availAsAppointments = availableSlots.map((h:{hora:string}, i:number) => ({ id: 1000 + i, fecha: targetDate, horaDesde: h.hora, hora: h.hora, fechaCancelacion: null, barberId }));
            const sortedAvail = availAsAppointments.sort((a:any,b:any) => (a.hora || a.horaDesde).localeCompare(b.hora || b.horaDesde));
            setAppointments(sortedAvail);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            const availAsAppointments = generated.map((h:{hora:string}, i:number) => ({ id: 1000 + i, fecha: targetDate, horaDesde: h.hora, hora: h.hora, barberId }));
            setAppointments(availAsAppointments);
        }
    };

    useEffect(() => {
        // cargar turnos del barbero para la fecha seleccionada
        // El endpoint backend espera: /appointments/barber/:codBarbero/:fechaTurno
        if (barberId) {
            const fecha = selectedDate || new Date().toISOString().substring(0,10);
            setUsedLocalSchedule(true);
            // invoke refresh that is defined below
            refreshAppointments(fecha);
        } else {
            setAppointments([]);
        }

        // Fetch barber data from backend: GET /usuarios/:codUsuario
        setLoadingBarber(true);
        setBarberError(null);

        fetch(`/usuarios/${encodeURIComponent(barberId)}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
                return res.json();
            })
            .then((data) => {
                // The backend `show` route returns the user object directly
                const user = data.data || data; // accept both shapes
                if (!user) {
                    setBarbero(null);
                    setBarberError('Barbero no encontrado');
                    return;
                }

                // Normalize to our Barbero interface
                const fetchedBarber: Barbero = {
                    codUsuario: user.codUsuario ?? user.id ?? String(barberId),
                    nombre: user.nombre ?? "",
                    apellido: user.apellido ?? "",
                    telefono: user.telefono ?? undefined,
                    email: user.email ?? undefined,
                };

                setBarbero(fetchedBarber);
            })
            .catch((err) => {
                console.error('Error fetching barber:', err);
                setBarbero(null);
                setBarberError(err.message || 'Error al obtener datos del barbero');
            })
            .finally(() => setLoadingBarber(false));
    }, [barberId, selectedDate]);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const successTimer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (successTimer.current) window.clearTimeout(successTimer.current);
        };
    }, []);
    // pagination
    const [page, setPage] = useState(1);
    const perPage = 8;

    const auth = useAuth();
    const navigate = useNavigate();

    const handleReserveAppointment = (appointmentId: number) => {
        // Reserva real: hacemos POST a /appointments
    const appointmentReserved = appointments.find((t) => t.id === appointmentId) || null;
        if (!appointmentReserved) return;

        // obtener codCliente desde el usuario logueado
        if (!auth.isAuthenticated || !auth.user) {
            // show a toast and then navigate to login so user stays in SPA
            toast.error('Debes iniciar sesión para reservar un turno');
            setTimeout(() => navigate('/login'), 1000);
            return;
        }
        // const codCliente = auth.user.codUsuario; // usado cuando se realice el POST

        // normalize fecha to YYYY-MM-DD for backend
    // const fechaTurno = formatDateToYYYYMMDD(appointmentReserved.fecha ?? selectedDate); // usado en el payload POST

        // Prevent reservations for past dates
        const normalizedSelected = formatDateToYYYYMMDD(selectedDate);
        if (normalizedSelected < todayYYYYMMDD) {
            toast.error('No puedes reservar turnos para fechas anteriores a hoy');
            return;
        }
        // prefer `hora` (normalized HH:MM) but fall back to `horaDesde` if needed
        const horaDesde = appointmentReserved.hora ?? appointmentReserved.horaDesde;
        // calcular horaHasta sumando 30 minutos
        if (!horaDesde) {
            toast.error('No hay hora válida para este turno');
            return;
        }
    // const [hh, mm] = horaDesde.split(":").map(Number);
    // const date = new Date();
    // date.setHours(hh);
    // date.setMinutes(mm + 30);
    // const horaHasta = date.toTimeString().substring(0,5); // usado en payload POST

        // construir payload esperado por backend (comentado en demo)
        // const payload = {
        //     codCorte: null,
        //     codCliente,
        //     precioTurno: null,
        //     metodoPago: null,
        //     fechaCancelacion: null,
        //     codBarbero: barberId,
        //     fechaTurno,
        //     horaDesde,
        //     horaHasta,
        // };

        // Temporarily avoid making actual POST to backend.
        // Keep payload here commented for future use:
        // console.log('Would POST payload:', JSON.stringify(payload));
        // fetch('/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })...

        // Instead: persist reservation locally in AuthContext, show dismissible confirmation and remove the slot locally
        const barberLabel = barbero ? `${barbero.nombre} ${barbero.apellido || ''}`.trim() : barberId || '';
        setSuccessMessage(`Turno reservado con ${barberLabel} el ${appointmentReserved.fecha} a las ${horaDesde}`);
        if (successTimer.current) window.clearTimeout(successTimer.current);
        successTimer.current = window.setTimeout(() => setSuccessMessage(null), 5000);

        // create reservation object and add to global auth
        try {
            const reservation = {
                id: `${appointmentReserved.id}-${barberId}-${Date.now()}`,
                fecha: appointmentReserved.fecha,
                hora: horaDesde,
                codBarbero: barberId,
                barberNombre: barbero?.nombre ?? null,
                barberApellido: barbero?.apellido ?? null,
                codSucursal: null,
            };
            auth.addReservation(reservation);
        } catch (e) { /* ignore if auth missing */ }

        setAppointments((prev) => prev.filter(t => t.id !== appointmentId));
    };

    return (
        <div className={styles.appointmentsContainer}>
            {loadingBarber ? (
                <div className={styles.loadingState}>Cargando datos del barbero...</div>
            ) : barberError ? (
                <div className={styles.errorState}>Error: {barberError}</div>
            ) : barbero ? (
                <div className={styles.barberInfo}>
                    <h3>Datos del barbero</h3>
                    <div><strong>Nombre:</strong> {barbero.nombre} {barbero.apellido}</div>
                    {barbero.telefono && <div><strong>Teléfono:</strong> {barbero.telefono}</div>}
                    {barbero.email && <div><strong>Email:</strong> {barbero.email}</div>}
                </div>
            ) : (
                <div className={styles.emptyState}>No se encontró información del barbero.</div>
            )}
            <h2>Turnos disponibles</h2>
            <div style={{marginBottom: '12px'}}>
                <label htmlFor="fecha">Fecha: </label>
                <input id="fecha" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            {usedLocalSchedule}
            {successMessage && (
                <div className={styles.successMessage} style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                    <div>{successMessage}</div>
                    <div>
                        <button onClick={() => { setSuccessMessage(null); if (successTimer.current) window.clearTimeout(successTimer.current); }} style={{background:'transparent', border:'none', color:'#22543d', fontWeight:700, cursor:'pointer'}}>X</button>
                    </div>
                </div>
            )}
            {/* If user is not authenticated, show a small call-to-action to login */}
            {!auth.isAuthenticated && (
                <div style={{margin:'12px 0', padding:12, border:'1px solid #e2e8f0', borderRadius:6, background:'#fffaf0'}}>
                    <div style={{marginBottom:8}}>Para reservar un turno debes <strong>iniciar sesión</strong>.</div>
                    <div style={{display:'flex', gap:8}}>
                        <button onClick={() => { navigate('/login'); }} style={{background:'#2b6cb0', color:'#fff', padding:'8px 12px', borderRadius:4, border:'none', cursor:'pointer'}}>Ir a Iniciar Sesión</button>
                        <button onClick={() => { navigate('/signUp'); }} style={{background:'transparent', color:'#2b6cb0', padding:'8px 12px', borderRadius:4, border:'1px solid #2b6cb0', cursor:'pointer'}}>Crear cuenta</button>
                    </div>
                </div>
            )}
            <div className={styles.appointmentList}>
                {appointments.length === 0 ? (
                    <div className={styles.emptyState}>No hay turnos disponibles para este barbero.</div>
                ) : (
                    <>
                        <div className={styles.hoursGrid}>
                            {appointments.slice((page-1)*perPage, page*perPage).map((appointment) => (
                                <div key={appointment.id} className={`${styles.hourCard} ${styles.hourAvailable}`}>
                                    <div>
                                        <div className={styles.hourTime}>{appointment.hora ?? appointment.horaDesde}</div>
                                        <div className={styles.hourMeta}>{appointment.fecha}</div>
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
                                        {formatDateToYYYYMMDD(selectedDate) < todayYYYYMMDD ? (
                                            <div style={{color:'#888', fontSize:12}}>No se pueden reservar turnos para fechas pasadas</div>
                                        ) : (
                                            <button
                                                className={styles.reserveButton}
                                                onClick={() => handleReserveAppointment(appointment.id)}
                                            >
                                                Reservar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {appointments.length > perPage && (
                            <div className={styles.pagination}>
                                <button className={styles.pageButton} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
                                {Array.from({length: Math.ceil(appointments.length / perPage)}, (_,i) => (
                                    <button key={i} className={`${styles.pageButton} ${page===i+1 ? styles.pageActive : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                                ))}
                                <button className={styles.pageButton} onClick={() => setPage(p => Math.min(Math.ceil(appointments.length / perPage), p+1))} disabled={page===Math.ceil(appointments.length / perPage)}>Next</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AppointmentsByBarber;
