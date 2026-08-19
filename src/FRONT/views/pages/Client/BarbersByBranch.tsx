import { useEffect, useState } from "react";
import styles from "./BarbersByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../BACK/Schemas/branchesSchema.ts";
import { useAuth } from "../../components/user/AuthContext.tsx";
import { apiFetch } from "../../lib/apiFetch.ts";
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import { ensureAuthenticatedUser } from "../../lib/authUtils";
import { parseBackendResponse } from "../../lib/backendResponse";

interface Barbero {
  codUsuario: string;
  codSucursal: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

type Sucursal = z.infer<typeof BranchWithIdSchema>;

const BarbersByBranch = () => {
  const params = useParams();
  const { codSucursal, fechaTurno, horaDesde } = params;
  const { user, isAuthenticated } = useAuth(); // add isAuthenticated

  const isHorario = !!fechaTurno && !!horaDesde;

  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Format a received date (posible 'YYYY-MM-DD' or with 'T') to 'DD/MM/AAAA'
  const formatFecha = (fecha?: string | null): string => {
    if (!fecha) return "";
    let f = fecha;
    // if it comes with time (ISO), we take only the date
    if (f.includes("T")) f = f.split("T")[0];

    if (f.includes("-")) {
      const parts = f.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }
    }

    if (f.includes("/")) return f; // already formatted

    // Fallback: try to parse with Date
    const d = new Date(f);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return fecha; // if not posible to format, return original
  };

  useEffect(() => {
    const loadBarbersAndBranch = async () => {
      console.log(
        "codSucursal from params:",
        codSucursal,
        "- Selecciono el horario:",
        isHorario,
      );

      if (!codSucursal) {
        setError("No se encontró el código de sucursal");
        setLoading(false);
        return;
      }

    // Endpoints: barbers and details of branch
    const barberosEndpoint = isHorario
      ? `/usuarios/schedule/${codSucursal}/${fechaTurno}/${horaDesde}`
      : `/usuarios/branch/${codSucursal}`;
    const sucursalEndpoint = `/sucursales/${codSucursal}`;

      console.log("Fetching barbers from endpoint:", barberosEndpoint);
      console.log("Fetching sucursal from endpoint:", sucursalEndpoint);

      try {
        const [resBarberos, resSucursal] = await Promise.all([
          apiFetch(barberosEndpoint),
          apiFetch(sucursalEndpoint),
        ]);
        if (!resSucursal.ok) {
          throw new Error(
            `Error sucursal ${resSucursal.status}: ${resSucursal.statusText}`,
          );
        }

        const contentTypeBarberos = resBarberos.headers.get("content-type");
        if (
          !contentTypeBarberos ||
          !contentTypeBarberos.includes("application/json")
        ) {
          const text = await resBarberos.text();
          console.error(
            "Expected JSON for barberos but received:",
            text.substring(0, 100),
          );
          throw new Error(
            "El servidor no devolvió datos JSON válidos para barberos",
          );
        }

        const contentTypeSucursal = resSucursal.headers.get("content-type");
        if (
          !contentTypeSucursal ||
          !contentTypeSucursal.includes("application/json")
        ) {
          const text = await resSucursal.text();
          console.error(
            "Expected JSON for sucursal but received:",
            text.substring(0, 100),
          );
          throw new Error(
            "El servidor no devolvió datos JSON válidos para sucursal",
          );
        }

        const dataBarberos = await resBarberos.json();
        const dataSucursal = await resSucursal.json();

        const barbersArray = dataBarberos.data || dataBarberos;
        setBarberos(Array.isArray(barbersArray) ? barbersArray : []);

        const suc = dataSucursal.data || dataSucursal;
        const sucObj = Array.isArray(suc) ? suc[0] || null : suc || null;
        setSucursal(sucObj);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
        setBarberos([]);
        setSucursal(null);
      } finally {
        setLoading(false);
      }
    };

    void loadBarbersAndBranch();
  }, [codSucursal, isHorario, fechaTurno, horaDesde]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando barberos...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Error: {error}</div>;
  }

  const handleSelectBarber = (codUsuario: string) => {
    // Toggle selection: if the same barber is clicked again, deselect
    if (selectedBarber === codUsuario) {
      setSelectedBarber(null);
    } else {
      setSelectedBarber(codUsuario);
    }
  };

  const handleSchedule = () => {
    navigate(`/barbers/${selectedBarber}/appointments`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

     // validate authentication
    if (!ensureAuthenticatedUser(isAuthenticated, user, navigate, {
      message: "Debes iniciar sesión para reservar un turno",
      redirectTo: "/login",
    })) {
      return;
    }

    // validate selections
    if (!selectedBarber) {
      toast.error("Por favor selecciona un barbero");
      return;
    }

    // validate that we have the schedule and branch
    if (!isHorario || !codSucursal || !fechaTurno || !horaDesde) {
      toast.error("Error: No se encontró el horario o sucursal");
      return;
    }

    const toastId = toast.loading("Creando Turno...");
    try {
      console.log("Enviando POST a /turnos con datos:", {
        codCliente: user.codUsuario,
        codBarbero: selectedBarber,
        fechaTurno: fechaTurno,
        horaDesde: horaDesde,
        estado: "Programado",
      });

      const response = await apiFetch("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codCliente: user.codUsuario,
          codBarbero: selectedBarber,
          fechaTurno: fechaTurno,
          horaDesde: horaDesde,
          estado: "Programado",
        }),
      });

      console.log("Response status:", response.status);

      const parsed = await parseBackendResponse<{ message?: string }>(response);
      console.log("Respuesta cruda del backend:", parsed.raw);

      if (!parsed.ok && parsed.message) {
        toast.error(parsed.message, { id: toastId });
        return;
      }

      if (response.ok) {
        toast.success("Turno reservado exitosamente", {
          id: toastId,
        });
        setSelectedBarber(null);

        navigate("/client/home");
      } else {
        // verify if it's a duplicate appointment error
        if (
          parsed.message &&
          parsed.message.includes("ya tiene un turno en ese horario")
        ) {
          toast.error(
            "Ya tienes un turno reservado en ese horario. Por favor elige otro horario.",
            {
              id: toastId,
              duration: 2000,
            },
          );
        } else {
          toast.error(parsed.message || "Error al reservar turno", {
            id: toastId,
          });
        }
      }
    } catch (error) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión con el servidor")) {
        return;
      }
      console.error("Error en handleSubmit:", error);
    }
  };

  return (
    <div className={styles.barbersContainer}>
      <div className={styles.infoRow}>
        {sucursal && (
          <div className={styles.branchInfo}>
            <h3>{sucursal.nombre}</h3>
            <p>
              {sucursal.calle}
              {sucursal.altura ? `, ${sucursal.altura}` : ""}
            </p>
          </div>
        )}

        {/* show the selected schedule in a card identical to the branch card */}
        {isHorario && (
          <div className={styles.branchInfo}>
            <h3>Horario </h3>
            <p>
              {formatFecha(fechaTurno)} - {horaDesde}
            </p>
          </div>
        )}
      </div>
      <h2>Elige un barbero</h2>
      <ul className={styles.barberList}>
        {barberos.length === 0 ? (
          <li className={styles.emptyState}>
            No hay barberos disponibles en esta sucursal.
          </li>
        ) : (
          barberos.map((barbero) => (
            <li
              key={barbero.codUsuario}
              className={`${styles.barberItem} ${
                selectedBarber === barbero.codUsuario ? styles.selected : ""
              }`}
              onClick={() => handleSelectBarber(barbero.codUsuario)}
              style={{ cursor: "pointer" }}
              aria-pressed={selectedBarber === barbero.codUsuario}
              role="button"
            >
              <div className={styles.barberName}>
                {barbero.apellido}, {barbero.nombre}
              </div>
              <div className={styles.barberPhone}>Tel: {barbero.telefono}</div>
              {selectedBarber === barbero.codUsuario && (
                <div
                  className={styles.inlineActions}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isHorario ? (
                    <button
                      className={`${styles.backButton} ${styles.inlineButton}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSubmit(event);
                      }}
                      disabled={!selectedBarber}
                    >
                      Confirmar Turno
                    </button>
                  ) : (
                    <button
                      className={`${styles.backButton} ${styles.inlineButton}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSchedule();
                      }}
                      disabled={!selectedBarber}
                    >
                      Seleccionar Horario
                    </button>
                  )}
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default BarbersByBranch;
