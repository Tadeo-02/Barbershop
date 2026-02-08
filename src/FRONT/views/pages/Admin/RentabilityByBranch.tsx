import { useEffect, useMemo, useState } from "react";
import styles from "./HomePageAdmin.module.css";
import localStyles from "./RentabilityByBranch.module.css";
import toast from "react-hot-toast";

interface Turno {
    codTurno?: string;
    codBarbero: string;
    precioTurno?: number | null;
    fechaTurno: string;
}

interface Barbero {
    codUsuario: string;
    codSucursal?: string | null;
}

interface Sucursal {
    codSucursal: string;
    nombre: string;
}

const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const RentabilityByBranch = () => {
    const today = new Date();
    const [month, setMonth] = useState<number>(today.getMonth());
    const [year, setYear] = useState<number>(today.getFullYear());

    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [barberos, setBarberos] = useState<Barbero[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [turnosRes, barberosRes, sucursalesRes] = await Promise.all([
                    fetch("/turnos"),
                    fetch("/usuarios?type=barber"),
                    fetch("/sucursales"),
                ]);

                const parseJsonOrThrow = async (res: Response, name = "resource") => {
                    const ct = res.headers.get("content-type") || "";
                    const text = await res.text();
                    if (!res.ok) {
                        // servidor devolvió una página de error o un error JSON
                        throw new Error(`${name} fetch failed: ${res.status} ${res.statusText} - ${text.substring(0, 300)}`);
                    }
                    if (ct.includes("application/json")) {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            throw new Error(`${name} returned invalid JSON: ${e}`);
                        }
                    }
                    throw new Error(`${name} did not return JSON. Response body: ${text.substring(0, 500)}`);
                };

                const turnosDataRaw = await parseJsonOrThrow(turnosRes, "turnos");
                const barberosData = await parseJsonOrThrow(barberosRes, "barberos");
                const sucursalesData = await parseJsonOrThrow(sucursalesRes, "sucursales");

                // Normalizar: algunos endpoints devuelven { success, data }
                const turnosData = turnosDataRaw && turnosDataRaw.data ? turnosDataRaw.data : turnosDataRaw;

                setTurnos(turnosData || []);
                setBarberos(barberosData || []);
                setSucursales(sucursalesData || []);
            } catch (error: any) {
                console.error(error);
                toast.error("No se pudieron cargar los datos. Revisa la consola y que el backend esté corriendo.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const barberoToSucursal = useMemo(() => {
        const map = new Map<string, string | undefined>();
        for (const b of barberos) {
            map.set(b.codUsuario, b.codSucursal || undefined);
        }
        return map;
    }, [barberos]);

    const sucursalNames = useMemo(() => {
        const map = new Map<string, string>();
        for (const s of sucursales) {
            map.set(s.codSucursal, s.nombre);
        }
        return map;
    }, [sucursales]);

    const revenueByBranch = useMemo(() => {
        // Inicializar con todas las sucursales a 0 para que se muestren
        const result = new Map<string, number>();
        for (const s of sucursales) {
            if (s && s.codSucursal) result.set(s.codSucursal, 0);
        }

        for (const t of turnos) {
            try {
                if (!t.fechaTurno) continue;
                const d = new Date(t.fechaTurno);
                if (d.getMonth() !== month || d.getFullYear() !== year) continue;

                const precio = t.precioTurno ? Number(t.precioTurno) : 0;
                if (!t.codBarbero) continue;

                const codSucursal = barberoToSucursal.get(t.codBarbero) || "_SIN_SUCURSAL_";
                const prev = result.get(codSucursal) || 0;
                result.set(codSucursal, prev + (isNaN(precio) ? 0 : precio));
            } catch (err) {
                // ignore parsing errors for individual records
                console.warn("Error procesando turno", err);
            }
        }

        return result;
    }, [turnos, barberoToSucursal, month, year]);

    if (loading) return <div className={styles.loadingState}>Cargando datos...</div>;

    return (
        <div className={styles.mainTurnos}>
            <h2 className={styles.pageTitle}>Rentabilidad por Sucursal</h2>

            <div className={localStyles.controlsRow}>
                <div> 
                <label className={localStyles.labelBold}>Mes: </label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {months.map((m, idx) => (
                        <option key={m} value={idx}>
                            {m}
                        </option>
                    ))}
                </select>
                </div>
                <div>
                <label className={localStyles.labelBold}>Año: </label>
                <input className={localStyles.smallInput} type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                </div>
            </div>
            <div className={localStyles.tableWrapper}>
                <table className={localStyles.rentTable}>
                    <thead>
                        <tr>
                            <th className={localStyles.thLeft}>Sucursal</th>
                            <th className={localStyles.thRight}>Ingresos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from(revenueByBranch.entries()).map(([codSucursal, total]) => (
                            <tr key={codSucursal}>
                                <td className={localStyles.tdCell}>
                                    {codSucursal === "_SIN_SUCURSAL_" ? "Sin sucursal asignada" : sucursalNames.get(codSucursal) || codSucursal}
                                </td>
                                <td className={localStyles.tdRight}>${total.toFixed(2)}</td>
                            </tr>
                        ))}

                        {revenueByBranch.size === 0 && (
                            <tr>
                                <td colSpan={2} className={localStyles.emptyRow}>
                                    No se encontraron turnos con precio para el mes seleccionado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RentabilityByBranch;
