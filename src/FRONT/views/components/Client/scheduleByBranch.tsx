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
          )}</div>)}
{/* import { useEffect, useState } from "react";
import styles from "./scheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { useAuth } from "../login/AuthContext.tsx";

interface Horario {
  hora: string; // Solo hora, simplificado
}

interface HorarioResponse {
  hora: string;
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Inicio del día de mañana
  // console.log("Hoy:", today.toDateString());
  // console.log("Mañana (minDate):", tomorrow.toDateString());
  return tomorrow;
};

const ScheduleByBranch = () => {
  const params = useParams();
  const { codSucursal, codBarbero } = params;
  const { user, isAuthenticated } = useAuth(); // Agregar isAuthenticated

  // Determinar qué código usar y el tipo
  const codigo = codSucursal || codBarbero;
  const isBarbero = !!codBarbero;

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(getTomorrowDate());
  const [fechaTurno, setFechaTurno] = useState<string>(selectedDate.toISOString().split("T")[0]);
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Función para calcular horaHasta (30 minutos después)
  const calculateHoraHasta = (horaDesde: string): string => {
    if (!horaDesde) return "";

    const [hours, minutes] = horaDesde.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + 30; // Agregar 30 minutos

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    console.log("Código from params:", codigo, "- Es barbero:", isBarbero);

    if (!codigo) {
      setError("No se encontró el código");
      setLoading(false);
      return;
    }

    // Mostrar loading de horarios al cambiar fecha/código
    if (!loading) {
      setLoadingHorarios(true);
    }

    // Ir directamente al endpoint correcto según el tipo
    const endpoint = isBarbero
      ? `/turnos/barber/${codigo}/${fechaTurno || tomorrow()}`
      : `/turnos/available/${fechaTurno || tomorrow()}/${codigo}`;

    console.log("Llamando a endpoint:", endpoint);

    fetch(endpoint)
      .then(async (res) => {
        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.get("content-type"));

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Expected JSON but received:", text.substring(0, 100));
          throw new Error("El servidor no devolvió datos JSON válidos");
        }

        return res.json();
      })
      .then((response) => {
        // console.log("Fetched response:", response);

        let horariosData: Horario[] = [];

        if (response.success && Array.isArray(response.data)) {
          // Si viene en formato { success: true, data: [...] }
          horariosData = response.data.filter(
            (item: HorarioResponse) => item && item.hora
          );
        } else if (Array.isArray(response)) {
          // Si viene directamente como array
          horariosData = response.filter(
            (item: HorarioResponse) => item && item.hora
          );
        } else {
          console.error("Unexpected response format:", response);
          horariosData = [];
        }

        // console.log("Processed horariosData:", horariosData);
        setHorarios(horariosData);
        setLoading(false);
        setLoadingHorarios(false);
      })
      .catch((error) => {
        console.error("Error fetching horarios:", error);
        setError(error.message || "Error al obtener horarios");
        setLoading(false);
        setLoadingHorarios(false);
      });
  }, [codigo, fechaTurno, loading, isBarbero]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      setFechaTurno(formattedDate);
      setSelectedHorario(null);
    }
  };

  const handleHorarioClick = (hora: string) => {
    setSelectedHorario(hora);
  };

  const handleNavigateToBarbers = () => {
      navigate(
        `/branches/${codigo}/schedule/${fechaTurno}/${selectedHorario}/barbers`
      );
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar autenticación
    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesión para reservar un turno");
      navigate("/login");
      return;
    }

    // Validar selecciones
    if (!selectedHorario || !fechaTurno) {
      toast.error("Por favor selecciona fecha y horario");
      return;
    }

    // Validar que tenemos el código del barbero
    if (!isBarbero || !codBarbero) {
      toast.error("Error: No se encontró el código del barbero");
      return;
    }

    const toastId = toast.loading("Creando Turno...");

    try {
      // Calcular horaHasta
      const horaHasta = calculateHoraHasta(selectedHorario);

      console.log("Enviando POST a /turnos con datos:", {
        codCliente: user.codUsuario,
        codBarbero: codBarbero,
        fechaTurno: fechaTurno,
        horaDesde: selectedHorario,
        horaHasta: horaHasta,
      });

      const response = await fetch("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codCliente: user.codUsuario,
          codBarbero: codBarbero,
          fechaTurno: fechaTurno,
          horaDesde: selectedHorario,
          horaHasta: horaHasta,
        }),
      });

      console.log("Response status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          toast.error("Error al procesar respuesta del servidor", {
            id: toastId,
          });
          return;
        }
      } else {
        toast.error("Respuesta vacía del servidor", { id: toastId });
        return;
      }

      if (response.ok) {
        toast.success("Turno reservado exitosamente", {
          id: toastId,
        });
        setSelectedHorario(null);
        setFechaTurno(tomorrow());
        setSelectedDate(getTomorrowDate());

        navigate("/");
      } else {
        toast.error("Error al reservar turno", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando horarios...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Error: {error}</div>;
  }

  return (
    <div className={styles.scheduleContainer}>
      <h2>
        {isBarbero ? "Horarios disponibles del barbero" : "Elige un horario"}
      </h2>

      <div className={styles.datePickerContainer}>
        <label htmlFor="datepicker">Selecciona una fecha:</label>
        <DatePicker
          id="datepicker"
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={getTomorrowDate()}
          dateFormat="yyyy-MM-dd"
          placeholderText="Selecciona una fecha"
          className={styles.datePicker}
        />
      </div>

      <ul className={styles.scheduleList}>
        <label>Selecciona una hora:</label>
        {loadingHorarios ? (
          <li key="loading-horarios" className={styles.emptyState}>
            Cargando horarios...
          </li>
        ) : horarios.length === 0 ? (
          <li key="empty-state" className={styles.emptyState}>
            No hay horarios disponibles este día.
          </li>
        ) : (
          horarios.map((horario, index) => {
            if (!horario || !horario.hora) {
              console.warn("Invalid horario object:", horario);
              return null;
            }
            return (
              <li
                key={`${horario.hora}-${index}`}
                className={`${styles.scheduleItem} ${
                  selectedHorario === horario.hora ? styles.selected : ""
                }`}
                onClick={() => handleHorarioClick(horario.hora)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.scheduleHour}>{horario.hora}</div>
              </li>
            );
          })
        )}
      </ul>

      {horarios.length > 0 && (
        <div>
          {isBarbero ? (
            <button
              className={styles.backButton}
              onClick={handleSubmit}
              disabled={!selectedHorario}
            >
              Confirmar Turno
            </button>
          ) : (
            <button
              className={styles.backButton}
              onClick={handleNavigateToBarbers}
              disabled={!selectedHorario}
            >
              Seleccionar Barbero
            </button>
          )} 
          
        </div>
      )}
    </div>
  );
}; */}

export default ScheduleByBranch;
