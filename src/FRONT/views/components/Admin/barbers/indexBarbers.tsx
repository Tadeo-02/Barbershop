import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../../BACK/Schemas/branchesSchema";
import { BarberResponseSchema } from "../../../../../BACK/Schemas/usersSchema";
import { showConfirmActionToast } from "../shared/confirmActionToast";
import { apiFetch } from "../../../lib/apiFetch";

// Usamos el schema exportado desde el backend como single source of truth
type Barbero = z.infer<typeof BarberResponseSchema>;
type Sucursal = z.infer<typeof BranchWithIdSchema>;

const IndexBarbers = () => {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<{ [key: string]: Sucursal }>({});

  const parseJsonResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Unexpected response (${response.status} ${response.statusText}): ${text.slice(0, 200)}`,
      );
    }
    return response.json();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar barberos y sucursales en paralelo
        const [barberosResponse, sucursalesResponse] = await Promise.all([
          apiFetch("/usuarios?type=barber"),
          apiFetch("/sucursales"),
        ]);

        if (barberosResponse.ok) {
          const barberosData = await barberosResponse.json();
          console.log("Raw data from API:", barberosData);
          // Validar y parsear con el schema derivado
          const parsed = BarberResponseSchema.array().safeParse(barberosData);
          if (parsed.success) {
            // parsed data comes from backend and doesn't include contraseña (password)
            setBarberos(parsed.data);
            console.log("Barberos recibidos:", parsed.data);
          } else {
            console.error(
              "Barberos invalidos - Schema validation error:",
              parsed.error,
            );
            console.error(
              "Error details:",
              JSON.stringify(parsed.error, null, 2),
            );
            toast.error("Datos de barberos inválidos");
            setBarberos([]);
          }
        } else {
          toast.error("Error al cargar los barberos");
        }

        if (sucursalesResponse.ok) {
          const sucursalesData = await sucursalesResponse.json();
          // Validar sucursales con el schema importado
          const parsedSuc =
            BranchWithIdSchema.array().safeParse(sucursalesData);
          if (parsedSuc.success) {
            // Convertir array a objeto para búsqueda rápida
            const sucursalesMap = parsedSuc.data.reduce(
              (acc: { [key: string]: Sucursal }, sucursal: Sucursal) => {
                if (sucursal.codSucursal) acc[sucursal.codSucursal] = sucursal;
                return acc;
              },
              {},
            );
            setSucursales(sucursalesMap);
            console.log("Sucursales recibidas:", parsedSuc.data);
          } else {
            console.error("Sucursales invalidas:", parsedSuc.error);
            toast.error("Datos de sucursales inválidos");
            setSucursales({});
          }
        } else {
          toast.error("Error al cargar las sucursales");
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para obtener el nombre de la sucursal
  const getSucursalNombre = (codSucursal?: string | null): string => {
    if (!codSucursal) return "Sucursal no encontrada";
    return sucursales[codSucursal]?.nombre || "Sucursal no encontrada";
  };

  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando barberos...</div>;
  }

  const handleDelete = async (codUsuario: string) => {
    // Check for pending appointments before showing confirmation dialog
    try {
      const response = await apiFetch(`/turnos/pending/barber/${codUsuario}`);
      if (!response.ok) {
        throw new Error(
          `Failed to check pending appointments: ${response.status}`,
        );
      }

      const payload = await parseJsonResponse(response);
      const pendingAppointments = payload?.data ?? [];

      if (pendingAppointments && pendingAppointments.length > 0) {
        toast.error(
          `No se puede dar de baja al barbero. Tiene ${pendingAppointments.length} turno(s) vigente(s) sin atender.`,
          { duration: 2000 },
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pending appointments:", error);
      toast.error("Error al verificar turnos pendientes");
      return;
    }

    showConfirmActionToast({
      title: "¿Estás seguro de que querés dar de baja este barbero?",
      confirmLabel: "Dar de baja",
      confirmColor: "danger",
      onConfirm: () => confirmedDelete(codUsuario),
    });
  };

  const confirmedDelete = async (codUsuario: string) => {
    const toastId = toast.loading("Dando de baja barbero...");

    try {
      const response = await apiFetch(`/usuarios/${codUsuario}/deactivate`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast.success("Barbero dado de baja correctamente", {
          id: toastId,
          duration: 2000,
        });
        // Actualizar el estado del barbero a inactivo en lugar de eliminarlo de la lista
        setBarberos(
          barberos.map((barbero) =>
            barbero.codUsuario === codUsuario
              ? { ...barbero, activo: false }
              : barbero,
          ),
        );
      } else if (response.status === 404) {
        toast.error("Barbero no encontrado", { id: toastId, duration: 2000 });
      } else {
        toast.error("Error al dar de baja el barbero", {
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

  const handleReactivate = async (codUsuario: string) => {
    showConfirmActionToast({
      title: "¿Estás seguro de que querés reactivar este barbero?",
      confirmLabel: "Reactivar",
      confirmColor: "success",
      onConfirm: () => confirmedReactivate(codUsuario),
    });
  };

  const confirmedReactivate = async (codUsuario: string) => {
    const toastId = toast.loading("Reactivando barbero...");

    try {
      const response = await apiFetch(`/usuarios/${codUsuario}/reactivate`, {
        method: "PATCH",
      });

      if (response.ok) {
        toast.success("Barbero reactivado correctamente", {
          id: toastId,
          duration: 2000,
        });
        // Actualizar el estado del barbero a activo
        setBarberos(
          barberos.map((barbero) =>
            barbero.codUsuario === codUsuario
              ? { ...barbero, activo: true }
              : barbero,
          ),
        );
      } else if (response.status === 404) {
        toast.error("Barbero no encontrado", { id: toastId, duration: 2000 });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Error al reactivar el barbero", {
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
      <div className={styles.indexBarberos}>
        <h2>Gestión de Barberos</h2>
        <div className={styles.createButtonWrapper}>
          <Link
            to="createBarbers"
            className={`${styles.button} ${styles.buttonSuccess} ${styles.createButton}`}
          >
            CREAR BARBERO
          </Link>
        </div>
        {barberos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay barberos disponibles.</p>
          </div>
        ) : (
          <ul>
            {barberos.map((barbero) => (
              <li
                key={barbero.codUsuario}
                className={!barbero.activo ? styles.inactiveRow : undefined}
              >
                <div className={styles.barberoInfo}>
                  <div className={styles.barberoTitle}>
                    {barbero.apellido}, {barbero.nombre}
                  </div>
                  <div className={styles.statusRow}>
                    <span
                      className={`${styles.statusBadge} ${
                        barbero.activo
                          ? styles.statusActive
                          : styles.statusInactive
                      }`}
                    >
                      {barbero.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className={styles.barberoCode}>CUIL: {barbero.cuil}</div>
                  <div className={styles.barberoSucursal}>
                    Sucursal: {getSucursalNombre(barbero.codSucursal)}
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <Link
                    to={`/Admin/BarbersPage/${barbero.codUsuario}`}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Ver Info
                  </Link>
                  <Link
                    to={`/Admin/BarbersPage/updateBarber/${barbero.codUsuario}`}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Modificar
                  </Link>
                  {barbero.activo ? (
                    <button
                      className={`${styles.button} ${styles.buttonDanger}`}
                      onClick={() => handleDelete(barbero.codUsuario)}
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      className={`${styles.button} ${styles.buttonSuccess}`}
                      onClick={() => handleReactivate(barbero.codUsuario)}
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

export default IndexBarbers;
