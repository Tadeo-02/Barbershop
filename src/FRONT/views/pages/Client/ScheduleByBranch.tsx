import { useEffect, useState } from "react";
import styles from "./ScheduleByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../components/user/AuthContext.tsx";
import TimeSlotPicker from "../../components/shared/TimeSlotPicker.tsx";
import { apiFetch } from "../../lib/apiFetch.ts";
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import { ensureAuthenticatedUser } from "../../lib/authUtils";
import { parseBackendResponse } from "../../lib/backendResponse";
import type { Sucursal } from "../../../types/branch";
import type { Barbero } from "../../../types/barber";

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

  useEffect(() => {
    const loadScheduleInfo = async () => {
      console.log("Código from params:", codigo, "- Es barbero:", isBarbero);

      if (!codigo) {
        setLoading(false);
        return;
      }

      try {
        if (codSucursal) {
          const sucursalEndpoint = `/sucursales/${codSucursal}`;
          const sucursalResponse = await apiFetch(sucursalEndpoint);

          if (!sucursalResponse.ok) {
            throw new Error(
              `Error sucursal ${sucursalResponse.status}: ${sucursalResponse.statusText}`,
            );
          }

          const contentType = sucursalResponse.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await sucursalResponse.text();
            console.error(
              "Expected JSON for sucursal but received:",
              text.substring(0, 100),
            );
            throw new Error(
              "El servidor no devolvió datos JSON válidos para sucursal",
            );
          }

          const sucursalData = await sucursalResponse.json();
          const suc = sucursalData.data || sucursalData;
          const sucObj = Array.isArray(suc) ? suc[0] || null : suc || null;
          setSucursal(sucObj);
        }

        if (codBarbero) {
          const barberoEndpoint = `/usuarios/profiles/${codBarbero}`;
          const barberoResponse = await apiFetch(barberoEndpoint);

          if (!barberoResponse.ok) {
            throw new Error(
              `Error barbero ${barberoResponse.status}: ${barberoResponse.statusText}`,
            );
          }

          const contentType = barberoResponse.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await barberoResponse.text();
            console.error(
              "Expected JSON for barbero but received:",
              text.substring(0, 200),
            );
            throw new Error(
              "El servidor no devolvió datos JSON válidos para barbero",
            );
          }

          const barberoData = await barberoResponse.json();
          const b = barberoData.data || barberoData;
          const bObj = Array.isArray(b) ? b[0] || null : b || null;
          setBarberoInfo(bObj);

          if (bObj && bObj.codSucursal) {
            const sucursalEndpointFromBarber = `/sucursales/${bObj.codSucursal}`;
            const sucursalFromBarberResponse = await apiFetch(
              sucursalEndpointFromBarber,
            );

            if (!sucursalFromBarberResponse.ok) {
              throw new Error(
                `Error sucursal ${sucursalFromBarberResponse.status}: ${sucursalFromBarberResponse.statusText}`,
              );
            }

            const sucursalContentType =
              sucursalFromBarberResponse.headers.get("content-type");
            if (
              !sucursalContentType ||
              !sucursalContentType.includes("application/json")
            ) {
              const text = await sucursalFromBarberResponse.text();
              console.error(
                "Expected JSON for sucursal but received:",
                text.substring(0, 100),
              );
              throw new Error(
                "El servidor no devolvió datos JSON válidos para sucursal",
              );
            }

            const sucursalFromBarberData = await sucursalFromBarberResponse.json();
            const suc = sucursalFromBarberData.data || sucursalFromBarberData;
            const sucObj = Array.isArray(suc) ? suc[0] || null : suc || null;
            setSucursal(sucObj);
          }
        }
      } catch (err) {
        console.error("Error cargando información de horario:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadScheduleInfo();
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
    if (!ensureAuthenticatedUser(isAuthenticated, user, navigate, {
      message: "Debes iniciar sesión para reservar un turno",
      redirectTo: "/login",
    })) {
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
      console.log("Enviando POST a /turnos con datos:", {
        codCliente: user.codUsuario,
        codBarbero: codBarbero,
        fechaTurno: selectedFechaTurno,
        horaDesde: selectedHorario,
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

        navigate("/client/home");
      } else {
        // verify if it's the error of a duplicate appointment in the same time slot
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
