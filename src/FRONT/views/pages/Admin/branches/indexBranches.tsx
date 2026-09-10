import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./branches.module.css";
import { useEntityActivation } from "../../../components/Admin/useEntityActivation";
import { apiFetch } from "../../../lib/apiFetch";
import type { Sucursal } from "../../../../types/branch";
import logger from "../../../lib/logger";

const IndexBranches = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true); // inicial loading 

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await apiFetch("/sucursales/all");
        const data = await res.json();
        setSucursales(data);
      } catch (error) {
        logger.error("Error al obtener sucursales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  const { handleDelete, handleReactivate } = useEntityActivation({
    entityLabel: "sucursal",
    entityLabelCapitalized: "Sucursal",
    gender: "feminine",
    endpointBase: "/sucursales",
    pendingCheck: {
      scope: "branch",
      blockedMessage: (count) =>
        `No se puede dar de baja la sucursal. Tiene ${count} turno(s) pendiente(s).`,
      blockedMessageDuration: 4000,
    },
    onStatusChange: (codSucursal, activo) => {
      setSucursales((prevSucursales) =>
        prevSucursales.map((sucursal) =>
          sucursal.codSucursal === codSucursal
            ? { ...sucursal, activo }
            : sucursal,
        ),
      );
    },
  });

  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando sucursales...</div>;
  }

  return (
    <>
      <div className={styles.indexSucursales}>
        <h2>Gestión de Sucursales</h2>
        <div className={styles.createButtonWrapper}>
          <Link
            to="createBranches"
            className={`${styles.button} ${styles.buttonSuccess} ${styles.createButton}`}
          >
            CREAR SUCURSAL
          </Link>
        </div>
        {sucursales.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay sucursales disponibles.</p>
          </div>
        ) : (
          <ul>
            {sucursales.map((sucursal, idx) => (
              <li
                key={idx}
                className={!sucursal.activo ? styles.inactiveRow : undefined}
              >
                <div className={styles.sucursalInfo}>
                  <div className={styles.sucursalTitle}>
                    {sucursal.calle}, {sucursal.altura}
                  </div>
                  <div className={styles.statusRow}>
                    <span
                      className={`${styles.statusBadge} ${
                        sucursal.activo
                          ? styles.statusActive
                          : styles.statusInactive
                      }`}
                    >
                      {sucursal.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <Link
                    to={`/Admin/BranchesPage/${sucursal.codSucursal}`}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Ver Info
                  </Link>
                  <Link
                    to={`/Admin/BranchesPage/updateBranches/${sucursal.codSucursal}`}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Modificar
                  </Link>
                  {sucursal.activo ? (
                    <button
                      className={`${styles.button} ${styles.buttonDanger}`}
                      onClick={() => handleDelete(sucursal.codSucursal)}
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      className={`${styles.button} ${styles.buttonSuccess}`}
                      onClick={() => handleReactivate(sucursal.codSucursal)}
                    >
                      Reactivar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default IndexBranches;
