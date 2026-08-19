import { useEffect, useState } from "react";
import styles from "./ScheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../BACK/Schemas/branchesSchema.ts";
import { useAuth } from "../../components/user/AuthContext.tsx";
import TimeSlotPicker from "../../components/shared/TimeSlotPicker.tsx";
import { apiFetch } from "../../lib/apiFetch.ts";

type Sucursal = z.infer<typeof BranchWithIdSchema>;

interface Barbero {
  codUsuario: string;
  codSucursal?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
  // console.log("Hoy:", today.toDateString());
  // console.log("Mañana (minDate):", tomorrow.toDateString());
  return tomorrow;
};

const ScheduleByBranch = () => {
  const params = useParams();
  const { codSucursal, codBarbero } = params;
  const { user, isAuthenticated } = useAuth(); // add isAuthenticated

  // Determine the code to use and the type of entity (branch or barber)
  const codigo = codSucursal || codBarbero;
  const isBarbero = !!codBarbero;

  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [barberoInfo, setBarberoInfo] = useState<Barbero | null>(null);
  const [selectedFechaTurno, setSelectedFechaTurno] = useState<string>("");
  const [selectedHorario, setSelectedHorario] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to calculate horaHasta (30 minutes after horaDesde)
  const calculateHoraHasta = (horaDesde: string): string => {
    if (!horaDesde) return "";

    const [hours, minutes] = horaDesde.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + 30; // add 30 min

    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    console.log("Código from params:", codigo, "- Es barbero:", isBarbero);

    if (!codigo) {
      setLoading(false);
      return;
    }

    // if we have codSucursal in params, we also request the branch (non-blocking)
    if (codSucursal) {
      const sucursalEndpoint = `/sucursales/${codSucursal}`;
      apiFetch(sucursalEndpoint)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Error sucursal ${res.status}: ${res.statusText}`);
          }
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error(
              "Expected JSON for sucursal but received:",
              text.substring(0, 100),
            );
            throw new Error(
              "El servidor no devolvió datos JSON válidos para sucursal",
            );
          }
          return res.json();
        })
        .then((data) => {
          const suc = data.data || data;
          const sucObj = Array.isArray(suc) ? suc[0] || null : suc || null;
          setSucursal(sucObj);
        })
        .catch((err) => {
          console.error("Error al obtener sucursal:", err);
          // No setError global so we don't block the timeslots view
        });
    }

    // if a barber is selected (codBarbero in params), we fetch their info (non-blocking)
    if (codBarbero) {
      const barberoEndpoint = `/usuarios/profiles/${codBarbero}`;
      apiFetch(barberoEndpoint)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Error barbero ${res.status}: ${res.statusText}`);
          }
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error(
              "Expected JSON for barbero but received:",
              text.substring(0, 200),
            );
            throw new Error(
              "El servidor no devolvió datos JSON válidos para barbero",
            );
          }
          return res.json();
        })
        .then((data) => {
          const b = data.data || data;
          const bObj = Array.isArray(b) ? b[0] || null : b || null;
          setBarberoInfo(bObj);

          // if the barber has a codSucursal and we still don't have the branch, request it to show both data
          try {
            if (bObj && bObj.codSucursal) {
              const sucursalEndpointFromBarber = `/sucursales/${bObj.codSucursal}`;
              apiFetch(sucursalEndpointFromBarber)
                .then(async (res) => {
                  if (!res.ok) {
                    throw new Error(
                      `Error sucursal ${res.status}: ${res.statusText}`,
                    );
                  }
                  const contentType = res.headers.get("content-type");
                  if (
                    !contentType ||
                    !contentType.includes("application/json")
                  ) {
                    const text = await res.text();
                    console.error(
                      "Expected JSON for sucursal but received:",
                      text.substring(0, 100),
                    );
                    throw new Error(
                      "El servidor no devolvió datos JSON válidos para sucursal",
                    );
                  }
                  return res.json();
                })
                .then((sdata) => {
                  const suc = sdata.data || sdata;
                  const sucObj = Array.isArray(suc)
                    ? suc[0] || null
                    : suc || null;
                  setSucursal(sucObj);
                })
                .catch((err) => {
                  console.error(
                    "Error al obtener sucursal desde barbero:",
                    err,
                  );
                });
            }
          } catch (err) {
            console.error("Error procesando sucursal desde barbero:", err);
          }
        })
        .catch((err) => {
          console.error("Error al obtener barbero:", err);
        });
    }

    setLoading(false);
  }, [codigo, codSucursal, codBarbero, isBarbero]);

  const handleTimeSlotSelect = (fecha: string, hora: string) => {
    setSelectedFechaTurno(fecha);
    setSelectedHorario(hora);
  };

  const handleNavigateToBarbers = () => {
    navigate(
      `/branches/${codigo}/schedule/${selectedFechaTurno}/${selectedHorario}/barbers`,
    );
  };

  const handleSubmit = async () => {
    // validate authentication
    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesión para reservar un turno");
      navigate("/login");
      return;
    }

    // validate selections
    if (!selectedHorario || !selectedFechaTurno) {
      toast.error("Por favor selecciona fecha y horario");
      return;
    }

    // validate that we have the barber's code
    if (!isBarbero || !codBarbero) {
      toast.error("Error: No se encontró el código del barbero");
      return;
    }

    const toastId = toast.loading("Creando Turno...");

    try {
      // calculate horaHasta
      const horaHasta = calculateHoraHasta(selectedHorario);

      console.log("Enviando POST a /turnos con datos:", {
        codCliente: user.codUsuario,
        codBarbero: codBarbero,
        fechaTurno: selectedFechaTurno,
        horaDesde: selectedHorario,
        horaHasta: horaHasta,
        estado: "Programado",
      });

      const response = await apiFetch("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codCliente: user.codUsuario,
          codBarbero: codBarbero,
          fechaTurno: selectedFechaTurno,
          horaDesde: selectedHorario,
          horaHasta: horaHasta,
          estado: "Programado",
        }),
      });

      console.log("Response status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      if (!text) {
        toast.error("Respuesta vacía del servidor", { id: toastId });
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        toast.error("Error al procesar respuesta del servidor", {
          id: toastId,
        });
        return;
      }

      if (response.ok) {
        toast.success("Turno reservado exitosamente", {
          id: toastId,
        });

        navigate("/client/home");
      } else {
        // verify if it's the error of a duplicate appointment in the same time slot
        if (
          data.message &&
          data.message.includes("ya tiene un turno en ese horario")
        ) {
          toast.error(
            "Ya tienes un turno reservado en ese horario. Por favor elige otro horario.",
            {
              id: toastId,
              duration: 2000,
            },
          );
        } else {
          toast.error(data.message || "Error al reservar turno", {
            id: toastId,
          });
        }
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando...</div>;
  }

  return (
    <div className={styles.scheduleContainer}>
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

        {barberoInfo && (
          <div className={styles.selectedBarberInfo}>
            <h4>
              {barberoInfo.apellido ? `${barberoInfo.apellido}, ` : ""}
              {barberoInfo.nombre}
            </h4>
          </div>
        )}
      </div>

      <h2>Elige un horario</h2>

      <TimeSlotPicker
        codBarbero={codBarbero}
        codSucursal={codSucursal}
        onTimeSlotSelect={handleTimeSlotSelect}
        showConfirmButton={true}
        confirmButtonText={
          isBarbero ? "Confirmar Turno" : "Seleccionar Barbero"
        }
        onConfirm={isBarbero ? handleSubmit : handleNavigateToBarbers}
        minDate={getTomorrowDate()}
      />
    </div>
  );
};

export default ScheduleByBranch;
