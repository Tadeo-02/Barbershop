import { useEffect, useState } from "react";
import styles from "./HomePageAdmin.module.css";
import localStyles from "./RentabilityByBranch.module.css";
import toast from "react-hot-toast";
import { apiFetch } from "../../lib/apiFetch";
import logger from "../../lib/logger";

interface RevenueEntry {
  codSucursal: string;
  nombre: string;
  totalRevenue: number;
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

  const [revenueData, setRevenueData] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(
          `/sucursales/rentability?month=${month}&year=${year}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRevenueData(json?.data ?? json ?? []);
      } catch (error) {
        logger.error(error);
        toast.error(
          "No se pudieron cargar los datos de rentabilidad.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);

  if (loading)
    return <div className={styles.loadingState}>Cargando datos...</div>;

  return (
    <div className={styles.mainTurnos}>
      <h2 className={styles.pageTitle}>Rentabilidad por Sucursal</h2>

      <div className={localStyles.controlsRow}>
        <div>
          <label className={localStyles.labelBold}>Mes: </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={localStyles.labelBold}>Año: </label>
          <input
            className={localStyles.smallInput}
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
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
            {revenueData.map((item) => (
              <tr key={item.codSucursal}>
                <td className={localStyles.tdCell}>{item.nombre}</td>
                <td className={localStyles.tdRight}>
                  ${item.totalRevenue.toFixed(2)}
                </td>
              </tr>
            ))}

            {revenueData.length === 0 && (
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
