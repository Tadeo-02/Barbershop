import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../../BACK/Schemas/branchesSchema";
import { BarberResponseSchema } from "../../../../../BACK/Schemas/usersSchema";
import { useEntityActivation } from "../../../components/Admin/useEntityActivation";
import { apiFetch } from "../../../lib/apiFetch";

// Use the schema exported from the backend as the single source of truth.

type Barbero = z.infer<typeof BarberResponseSchema>;
type Sucursal = z.infer<typeof BranchWithIdSchema>;

const IndexBarbers = () => {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState<{ [key: string]: Sucursal }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // load barbers and branches in parallel
        const [barberosResponse, sucursalesResponse] = await Promise.all([
          apiFetch("/usuarios?type=barber"),
          apiFetch("/sucursales"),
        ]);

        if (barberosResponse.ok) {
          const barberosData = await barberosResponse.json();
          console.log("Raw data from API:", barberosData);

        // Validate and parse using the derived schema.

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
          // Validate branches using the imported schema.
          const parsedSuc =
            BranchWithIdSchema.array().safeParse(sucursalesData);
          if (parsedSuc.success) {
            // transform array to object for quick lookup
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

  // function to obtain the name of the branch
  const { handleDelete, handleReactivate } = useEntityActivation({
    entityLabel: "barbero",
    entityLabelCapitalized: "Barbero",
    gender: "masculine",
    endpointBase: "/usuarios",
    pendingCheck: {
      scope: "barber",
      blockedMessage: (count) =>
        `No se puede dar de baja al barbero. Tiene ${count} turno(s) vigente(s) sin atender.`,
      blockedMessageDuration: 2000,
    },
    onStatusChange: (codUsuario, activo) => {
      setBarberos((prev) =>
        prev.map((barbero) =>
          barbero.codUsuario === codUsuario ? { ...barbero, activo } : barbero,
        ),
      );
    },
  });

  const getSucursalNombre = (codSucursal?: string | null): string => {
    if (!codSucursal) return "Sucursal no encontrada";
    return sucursales[codSucursal]?.nombre || "Sucursal no encontrada";
  };

  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando barberos...</div>;
  }

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
