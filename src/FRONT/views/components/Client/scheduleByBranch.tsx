import { useEffect, useState } from "react";
import styles from "./scheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../BACK/schemas/branchesSchema.ts";
import { useAuth } from "../user/AuthContext.tsx";
import TimeSlotPicker from "../shared/TimeSlotPicker.tsx";
import { apiFetchJson } from "../../lib/apiFetch.ts";
import { ApiError } from "../../lib/apiResponse.ts";

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

  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [barberoInfo, setBarberoInfo] = useState<Barbero | null>(null);
  const [selectedFechaTurno, setSelectedFechaTurno] = useState<string>("");
  const [selectedHorario, setSelectedHorario] = useState<string>("");
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
      return;
    }

    // Si tenemos codSucursal en params, pedimos también la sucursal (no bloqueante)
    if (codSucursal) {
      const sucursalEndpoint = `/sucursales/${codSucursal}`;
      apiFetchJson<Sucursal | Sucursal[]>(sucursalEndpoint)
        .then((data) => {
          const sucObj = Array.isArray(data) ? data[0] || null : data || null;
          setSucursal(sucObj as Sucursal | null);
        })
        .catch((err) => {
          console.error("Error al obtener sucursal:", err);
          // No setError global para no bloquear la vista de horarios
        });
    }

    // Si hay un barbero seleccionado (codBarbero en params), traemos su info (no bloqueante)
    if (codBarbero) {
      const barberoEndpoint = `/usuarios/profiles/${codBarbero}`;
      apiFetchJson<Barbero | Barbero[]>(barberoEndpoint)
        .then((data) => {
          const bObj = Array.isArray(data) ? data[0] || null : data || null;
          setBarberoInfo(bObj as Barbero | null);

          // Si el barbero trae codSucursal y aún no tenemos la sucursal, pedirla para mostrar ambos datos
          try {
            if (bObj && bObj.codSucursal) {
              const sucursalEndpointFromBarber = `/sucursales/${bObj.codSucursal}`;
              apiFetchJson<Sucursal | Sucursal[]>(sucursalEndpointFromBarber)
                .then((sdata) => {
                  const sucObj = Array.isArray(sdata)
                    ? sdata[0] || null
                    : sdata || null;
                  setSucursal(sucObj as Sucursal | null);
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
    // Validar autenticación
    if (!isAuthenticated || !user || !user.codUsuario) {
      toast.error("Debes iniciar sesión para reservar un turno");
      navigate("/login");
      return;
    }

    // Validar selecciones
    if (!selectedHorario || !selectedFechaTurno) {
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
        fechaTurno: selectedFechaTurno,
        horaDesde: selectedHorario,
        horaHasta: horaHasta,
        estado: "Programado",
      });

      await apiFetchJson<{ codTurno: string }>("/turnos", {
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
      toast.success("Turno reservado exitosamente", {
        id: toastId,
      });

      navigate("/client/home");
    } catch (error: unknown) {
      const message = ApiError.isApiError(error)
        ? error.message
        : "Error de conexión con el servidor";
      const duplicateMessage = message.includes("ya tiene un turno en ese horario");

      if (duplicateMessage) {
        toast.error(
          "Ya tienes un turno reservado en ese horario. Por favor elige otro horario.",
          {
            id: toastId,
            duration: 2000,
          },
        );
      } else {
        toast.error(message, { id: toastId });
      }
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
