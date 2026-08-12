import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../../BACK/Schemas/branchesSchema";
import { showConfirmActionToast } from "../shared/confirmActionToast";
import { fetchPendingAppointmentsCount } from "../shared/pendingAppointments";
import { apiFetch } from "../../../lib/apiFetch";

type Sucursal = z.infer<typeof BranchWithIdSchema>;

const IndexBranches = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true); // loading inicial

  useEffect(() => {
    //alert de loading para carga inicial
    // const toastId = toast.loading("Cargando sucursales...");

    // Llama al backend para obtener las sucursales
    apiFetch("/sucursales/all")
      .then((res) => res.json())
      .then((data) => {
        setSucursales(data); // data debe ser un array de sucursales
        console.log("Sucursales recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener sucursales:", error);
        // toast.error("Error al cargar las sucursales", { id: toastId });
      })
      .finally(() => {
        setLoading(false); // Termina el loading
      });
  }, []);
  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando sucursales...</div>;
  }

  const updateBranchStatus = (codSucursal: string, activo: boolean) => {
    setSucursales((prevSucursales) =>
      prevSucursales.map((sucursal) =>
        sucursal.codSucursal === codSucursal
          ? { ...sucursal, activo }
          : sucursal,
      ),
    );
  };

  const handleDelete = async (codSucursal: string) => {
    try {
      const pendingCount = await fetchPendingAppointmentsCount(
        "branch",
        codSucursal,
      );

      if (pendingCount > 0) {
        toast.error(
          `No se puede dar de baja la sucursal. Tiene ${pendingCount} turno(s) pendiente(s).`,
          { duration: 4000 },
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pending appointments:", error);
      toast.error("Error al verificar turnos pendientes", { duration: 4000 });
      return;
    }

    showConfirmActionToast({
      title: "¿Estás seguro de que querés dar de baja esta sucursal?",
      confirmLabel: "Dar de baja",
      confirmColor: "danger",
      onConfirm: () => confirmedDelete(codSucursal),
    });
  };

  const confirmedDelete = async (codSucursal: string) => {
    const toastId = toast.loading("Dando de baja sucursal...");

    try {
      const response = await apiFetch(`/sucursales/${codSucursal}/deactivate`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast.success("Sucursal dada de baja correctamente", {
          id: toastId,
          duration: 2000,
        });
        updateBranchStatus(codSucursal, false);
      } else if (response.status === 404) {
        toast.error("Sucursal no encontrada", { id: toastId, duration: 2000 });
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || "Error al dar de baja la sucursal", {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", {
        id: toastId,
        duration: 2000,
      });
    }
  };

  const handleReactivate = async (codSucursal: string) => {
    const toastId = toast.loading("Reactivando sucursal...");

    try {
      const response = await apiFetch(`/sucursales/${codSucursal}/reactivate`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast.success("Sucursal reactivada correctamente", {
          id: toastId,
          duration: 2000,
        });
        updateBranchStatus(codSucursal, true);
      } else if (response.status === 404) {
        toast.error("Sucursal no encontrada", { id: toastId, duration: 2000 });
      } else {
        toast.error("Error al reactivar la sucursal", {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", {
        id: toastId,
        duration: 2000,
      });
    }
  };

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
