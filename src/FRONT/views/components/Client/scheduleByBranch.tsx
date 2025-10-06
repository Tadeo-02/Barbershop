import { useEffect, useState, useRef } from "react";
import { useAuth } from "../login/AuthContext";
import barberStyles from "./appointmentsByBarber.module.css";
import { useParams } from "react-router-dom";

interface HorarioLocal {
    id: number;
    fecha: string;
    hora: string;
}

interface BarberShort {
    codUsuario: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
    email?: string;
}

const ScheduleByBranch = () => {
    const params = useParams<{ codSucursal?: string; branchId?: string; sucursalId?: string }>();
    const branchId = params.codSucursal ?? params.branchId ?? params.sucursalId ?? '';
    const [branchName, setBranchName] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const successTimer = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (successTimer.current) window.clearTimeout(successTimer.current);
        };
    }, []);
    const [fecha, setFecha] = useState<string>(new Date().toISOString().substring(0,10));
    const [horarios, setHorarios] = useState<HorarioLocal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedSlot, setSelectedSlot] = useState<HorarioLocal | null>(null);
    const [availableBarbers, setAvailableBarbers] = useState<BarberShort[]>([]);
    const [loadingBarbers, setLoadingBarbers] = useState(false);
    // pagination
    const [page, setPage] = useState(1);
    const perPage = 8;

    const auth = useAuth();


    // generate 30-min slots from 09:00 to 19:30
    const generateSlots = (fromHour = 9, toHour = 20, stepMinutes = 30) => {
        const slots: { hora: string }[] = [];
        const start = fromHour * 60;
        const end = toHour * 60;
        for (let t = start; t + stepMinutes <= end; t += stepMinutes) {
            const hh = Math.floor(t / 60).toString().padStart(2, '0');
            const mm = (t % 60).toString().padStart(2, '0');
            slots.push({ hora: `${hh}:${mm}` });
        }
        return slots;
    };

    // fetch appointments and filter by branch and date to compute available slots
    const loadHorarios = async (targetDate: string) => {
        if (!branchId) return setHorarios([]);
        setLoading(true);
        setError(null);
        try {
            // fetch users to determine which barberos belong to this branch
            const ru = await fetch('/usuarios');
            const ud = ru.ok ? await ru.json() : [];
            const users = Array.isArray(ud) ? ud : (ud.data && Array.isArray(ud.data) ? ud.data : []);

            // identify barberos of this branch
            const branchBarbers = new Set<string>();
            for (const u of users) {
                try {
                    const belongsBranch = String(u.codSucursal || u.sucursalId || u.branchId || '') === String(branchId);
                    // determine barber by cuil: must exist and be different from '1'
                    const cuil = u.cuil ?? u.CUIL ?? u.cuilNumber ?? null;
                    const isBarber = cuil !== null && cuil !== undefined && String(cuil).trim() !== '' && String(cuil).trim() !== '1';
                    // only consider users who both belong to the branch AND are barbers (cuil rule)
                    if (belongsBranch && isBarber) {
                        const cod = String(u.codUsuario || u.id || '');
                        if (cod) branchBarbers.add(cod);
                    }
                } catch (e) {}
            }

            if (branchBarbers.size === 0) {
                // no barberos in this branch -> no slots
                setHorarios([]);
                return;
            }

            // fetch appointments to see who is occupied
            const ra = await fetch('/appointments');
            const ad = ra.ok ? await ra.json() : [];
            const appList = Array.isArray(ad) ? ad : [];
            // cached in local variable only

            // build map: time -> set of occupied barbero codes (only those in branchBarbers)
            const occupiedByTime = new Map<string, Set<string>>();
            for (const a of appList) {
                try {
                    const fechaRaw = a.fechaTurno || a.fecha || a.fecha_turno || '';
                    let fechaNorm = '';
                    if (fechaRaw) {
                        const m = String(fechaRaw).match(/^(\d{4}-\d{2}-\d{2})/);
                        if (m) fechaNorm = m[1];
                        else { const dt = new Date(fechaRaw); if (!isNaN(dt.getTime())) fechaNorm = dt.toISOString().substring(0,10); }
                    }
                    if (fechaNorm !== targetDate) continue;

                    let horaStr = '';
                    if (a.horaDesde) {
                        try { const d = new Date(a.horaDesde); if (!isNaN(d.getTime())) horaStr = d.toTimeString().substring(0,5); } catch {}
                    }
                    if (!horaStr && a.hora) {
                        const m2 = String(a.hora).match(/(\d{1,2}:\d{2})/);
                        if (m2) horaStr = m2[1].padStart(5,'0');
                    }
                    if (!horaStr && a.hora_desde) {
                        try { const d2 = new Date(a.hora_desde); if (!isNaN(d2.getTime())) horaStr = d2.toTimeString().substring(0,5); } catch {}
                    }
                    if (!horaStr) continue;

                    const cod = String(a.codBarbero || a.barberId || a.codBarbero || '');
                    if (!cod) continue;
                    if (!branchBarbers.has(cod)) continue;

                    const setFor = occupiedByTime.get(horaStr) || new Set<string>();
                    setFor.add(cod);
                    occupiedByTime.set(horaStr, setFor);
                } catch (e) { }
            }

            const generated = generateSlots();
            const available: HorarioLocal[] = [];
            for (let i = 0; i < generated.length; i++) {
                const s = generated[i];
                const occupiedSet = occupiedByTime.get(s.hora) || new Set<string>();
                // if there exists at least one barber in branchBarbers not in occupiedSet, the slot is available
                let hasFree = false;
                for (const b of branchBarbers) {
                    if (!occupiedSet.has(b)) { hasFree = true; break; }
                }
                if (hasFree) {
                    available.push({ id: 1000 + i, fecha: targetDate, hora: s.hora });
                }
            }

            setHorarios(available);
        } catch (err:any) {
            console.error('Error loading appointments', err);
            setError('No se pudieron cargar los horarios.');
            // fallback: still show generated slots (best-effort, but we cannot guarantee barber availability)
            const generated = generateSlots();
            const available = generated.map((s,i) => ({ id: 1000 + i, fecha: targetDate, hora: s.hora }));
            setHorarios(available);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHorarios(fecha);
    }, [branchId, fecha]);

    // load branch name for header
    useEffect(() => {
        let cancelled = false;
        if (!branchId) {
            setBranchName(null);
            return;
        }
        fetch(`/sucursales/${encodeURIComponent(branchId)}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (cancelled) return;
                const b = data && (data.data || data) ? (data.data || data) : null;
                if (b && (b.nombre || b.name)) setBranchName(b.nombre || b.name || String(branchId));
                else setBranchName(String(branchId));
            })
            .catch(() => setBranchName(String(branchId)));
        return () => { cancelled = true; };
    }, [branchId]);

    // clamp page when horarios changes
    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(horarios.length / perPage));
        if (page > maxPage) setPage(maxPage);
        if (horarios.length > 0 && page === 0) setPage(1);
    }, [horarios]);

    // when selecting a slot, fetch barbers and filter those who are free at that date/time and belong to branch
    const handleSelectHorario = async (slot: HorarioLocal) => {
        setSelectedSlot(slot);
        setAvailableBarbers([]);
        setLoadingBarbers(true);
        try {
            // fetch all users - backend may expose /usuarios
            const r = await fetch('/usuarios');
            const data = r.ok ? await r.json() : [];
            const users = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);

            // fetch appointments to find who is occupied at that time
            const ar = await fetch('/appointments');
            const allApp = ar.ok ? await ar.json() : [];
            const appList = Array.isArray(allApp) ? allApp : [];

            const occupiedBarbers = new Set<string>();
            for (const a of appList) {
                try {
                    const fechaRaw = a.fechaTurno || a.fecha || a.fecha_turno || '';
                    let fechaNorm = '';
                    if (fechaRaw) {
                        const m = String(fechaRaw).match(/^(\d{4}-\d{2}-\d{2})/);
                        if (m) fechaNorm = m[1];
                        else { const dt = new Date(fechaRaw); if (!isNaN(dt.getTime())) fechaNorm = dt.toISOString().substring(0,10); }
                    }
                    if (fechaNorm !== slot.fecha) continue;

                    // determine time string
                    let horaStr = '';
                    if (a.horaDesde) {
                        try { const d = new Date(a.horaDesde); if (!isNaN(d.getTime())) horaStr = d.toTimeString().substring(0,5); } catch {}
                    }
                    if (!horaStr && a.hora) {
                        const m2 = String(a.hora).match(/(\d{1,2}:\d{2})/);
                        if (m2) horaStr = m2[1].padStart(5,'0');
                    }
                    if (!horaStr && a.hora_desde) {
                        try { const d2 = new Date(a.hora_desde); if (!isNaN(d2.getTime())) horaStr = d2.toTimeString().substring(0,5); } catch {}
                    }
                    if (horaStr === slot.hora) {
                        const cod = String(a.codBarbero || a.barberId || a.codBarbero || '');
                        if (cod) occupiedBarbers.add(cod);
                    }
                } catch (e) { /* ignore */ }
            }

            // filter users: those with role 'barbero' or that belong to branch. Heuristic: field 'codSucursal' or 'sucursalId'
            const candidates: BarberShort[] = [];
            for (const u of users) {
                try {
                    // determine barber by cuil: must exist and be different from '1'
                    const cuil = u.cuil ?? u.CUIL ?? u.cuilNumber ?? null;
                    const isBarber = cuil !== null && cuil !== undefined && String(cuil).trim() !== '' && String(cuil).trim() !== '1';
                    const belongsBranch = String(u.codSucursal || u.sucursalId || u.branchId || '') === String(branchId);
                    // require both barber (cuil) and belonging to branch
                    if (!(isBarber && belongsBranch)) continue;
                    const cod = String(u.codUsuario || u.id || '');
                    if (!cod) continue;
                    if (occupiedBarbers.has(cod)) continue;
                    candidates.push({ codUsuario: cod, nombre: u.nombre, apellido: u.apellido, telefono: u.telefono ?? u.phone ?? undefined, email: u.email ?? undefined });
                } catch (e) { /* ignore malformed user */ }
            }

            setAvailableBarbers(candidates);
        } catch (err) {
            console.error('Error fetching barbers', err);
            setAvailableBarbers([]);
        } finally {
            setLoadingBarbers(false);
        }
    };

    const handleReserve = (barberCod: string, barberNombre?: string, barberApellido?: string) => {
        // Temporarily perform local reservation and remove slot from list
        if (!selectedSlot) return;
    // show confirmation message (dismissible) using barber name when available
    const barberLabel = barberNombre || barberApellido ? `${barberNombre ?? ''} ${barberApellido ?? ''}`.trim() : barberCod;
    setSuccessMessage(`Turno reservado con ${barberLabel} el ${selectedSlot.fecha} a las ${selectedSlot.hora}`);
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => setSuccessMessage(null), 5000);

        // remove the barber from the available list for this slot
        setAvailableBarbers(prev => {
            const remaining = prev.filter(b => b.codUsuario !== barberCod);

            // if after removing there are no barberos left, remove the slot from horarios
            if (remaining.length === 0) {
                setHorarios(prevSlots => prevSlots.filter(h => h.id !== selectedSlot.id));
                // clear selection (slot no longer available)
                setSelectedSlot(null);
                // persist reservation to global context
                try {
                    const reservation = {
                        id: `${selectedSlot.id}-${barberCod}-${Date.now()}`,
                        fecha: selectedSlot.fecha,
                        hora: selectedSlot.hora,
                        codBarbero: barberCod,
                        barberNombre: barberNombre ?? null,
                        barberApellido: barberApellido ?? null,
                        codSucursal: branchId,
                    };
                    auth.addReservation(reservation);
                } catch (e) { /* ignore if auth missing */ }
                return [];
            }

            // otherwise keep the slot and update available barbers shown
            // also persist reservation but without removing slot
            try {
                const reservation = {
                    id: `${selectedSlot.id}-${barberCod}-${Date.now()}`,
                    fecha: selectedSlot.fecha,
                    hora: selectedSlot.hora,
                    codBarbero: barberCod,
                    barberNombre: barberNombre ?? null,
                    barberApellido: barberApellido ?? null,
                    codSucursal: branchId,
                };
                auth.addReservation(reservation);
            } catch (e) {}
            return remaining;
        });
    };

    return (
        <div className={barberStyles.appointmentsContainer}>
            <h2>Elige un horario en la sucursal {branchName ?? branchId}</h2>
            {successMessage && (
                <div className={barberStyles.successMessage} style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                    <div>{successMessage}</div>
                    <div>
                        <button onClick={() => { setSuccessMessage(null); if (successTimer.current) window.clearTimeout(successTimer.current); }} style={{background:'transparent', border:'none', color:'#22543d', fontWeight:700, cursor:'pointer'}}>X</button>
                    </div>
                </div>
            )}

            <div style={{marginBottom:12}}>
                <label htmlFor="fecha">Fecha: </label>
                <input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            {loading ? <div>Calculando horarios...</div> : null}
            {error ? <div style={{color:'red'}}>{error}</div> : null}

            {horarios.length === 0 ? (
                <div className={barberStyles.emptyState}>No hay horarios disponibles en esta sucursal para la fecha seleccionada.</div>
            ) : (
                <>
                <div className={barberStyles.hoursGrid}>
                    {horarios.slice((page-1)*perPage, page*perPage).map((h) => (
                        <div
                            key={h.id}
                            className={`${barberStyles.hourCard} ${barberStyles.hourAvailable}`}
                            onClick={() => handleSelectHorario(h)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div>
                                <div className={barberStyles.hourTime}>{h.hora}</div>
                                <div className={barberStyles.hourMeta}>{h.fecha}</div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8}}>
                                <button className={barberStyles.reserveButton} onClick={(e) => { e.stopPropagation(); handleSelectHorario(h); }}>
                                    Seleccionar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {horarios.length > perPage && (
                    <div className={barberStyles.pagination} style={{marginTop:12}}>
                        <button className={barberStyles.pageButton} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
                        {Array.from({length: Math.ceil(horarios.length / perPage)}, (_,i) => (
                            <button key={i} className={`${barberStyles.pageButton} ${page===i+1 ? barberStyles.pageActive : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                        ))}
                        <button className={barberStyles.pageButton} onClick={() => setPage(p => Math.min(Math.ceil(horarios.length / perPage), p+1))} disabled={page===Math.ceil(horarios.length / perPage)}>Next</button>
                    </div>
                )}
                </>
            )}

            {selectedSlot && (
                <div style={{marginTop:16}}>
                    <h3>Barberos disponibles para {selectedSlot.fecha} a las {selectedSlot.hora}</h3>
                    {loadingBarbers ? <div>Cargando barberos...</div> : (
                        availableBarbers.length === 0 ? <div>No hay barberos disponibles para ese horario.</div> : (
                            <div className={barberStyles.appointmentList}>
                                {availableBarbers.map(b => (
                                    <div key={b.codUsuario} className={barberStyles.appointmentItem} style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                                        <div>
                                            <div className={barberStyles.appointmentDate}>{b.nombre} {b.apellido}</div>
                                            {b.telefono && <div className={barberStyles.appointmentHour}>Tel: {b.telefono}</div>}
                                            {b.email && <div className={barberStyles.appointmentHour}>Email: {b.email}</div>}
                                        </div>
                                        <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                                            <button className={barberStyles.reserveButton} onClick={() => handleReserve(b.codUsuario, b.nombre, b.apellido)}>Reservar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                    <div style={{marginTop:8}}>
                        <button onClick={() => { setSelectedSlot(null); setAvailableBarbers([]); }}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleByBranch;
