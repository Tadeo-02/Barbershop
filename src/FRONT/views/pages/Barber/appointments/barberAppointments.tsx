import React, { useState, useEffect } from "react";
import { useAuth } from "../../../components/user/AuthContext";
import barberStyles from "./barberAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import TimeSlotPicker from "../../../components/shared/TimeSlotPicker";
import type { AppointmentFull } from "../../../components/shared/appointments";
import {sortTurnosByDateTime, unwrapAppointments,} from "../../../components/shared/appointments";
import {formatDate, formatTime,} from "../../../utils/dateUtils";
import { useForm } from "react-hook-form";
import { createResolver } from "../../../lib/zodFormResolver";
import { z } from "zod";
import { useAbortController } from "../../../components/shared/useAbortController";
import { apiFetch } from "../../../lib/apiFetch.ts";
import { getResponseMessage, readJsonSafely } from "../../../lib/apiResponse";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";
import { ensureAuthenticatedUser } from "../../../lib/authUtils";

const BarberAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<AppointmentFull[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [isLoadingTurnos, setIsLoadingTurnos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { renew: renewFetchAbort, abort: abortFetchAbort } = useAbortController();
  const { renew: renewSubmitAbort } = useAbortController();

  // Zod schema for update payload (basic, mirrors backend expectations)
  const UpdateAppointmentSchema = z.object({
    fechaTurno: z
      .string()
      .min(1, "Fecha de turno es requerida")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD"),
    horaDesde: z
      .string()
      .min(1, "Hora desde es requerida")
      .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM"),
  });

  type UpdateFormValues = z.infer<typeof UpdateAppointmentSchema>;

  const { register, handleSubmit, setValue, reset, formState } =
    useForm<UpdateFormValues>({
      resolver: createResolver(UpdateAppointmentSchema),
      defaultValues: { fechaTurno: "", horaDesde: "" },
    });

  // states for the modal of update
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [turnoToUpdate, setTurnoToUpdate] = useState<AppointmentFull | null>(
    null,
  );
  const [selectedUpdateTime, setSelectedUpdateTime] = useState<string>("");

  const navigate = useNavigate();

  // function to get the CSS class based on the appointment status
  const getStatusClass = (estado: string): string => {
    switch (estado) {
      case "Programado":
        return barberStyles.statusProgramado;
      case "Cancelado":
        return barberStyles.statusCancelado;
      case "Cobrado":
        return barberStyles.statusCobrado;
      case "Sin cobrar":
        return barberStyles.statusSinCobrar;
      case "No asistido":
        return barberStyles.statusNoAsistido;
      default:
        return barberStyles.statusProgramado; // default
    }
  };


  //load appointments once authenticated
  useEffect(() => {
    if (!ensureAuthenticatedUser(isAuthenticated, user, navigate, {
      message: "Tu cuenta de barbero no tiene una sucursal asignada",
      redirectTo: "/login",
      requireSucursal: true,
    })) {
      return;
    }

    const codUsuario = user.codUsuario;
    const loadTurnos = async () => {
      const controller = renewFetchAbort();
      setIsLoadingTurnos(true);

      try {
        const res = await apiFetch(`/turnos/user/${codUsuario}`, {
          signal: controller.signal,
        });

        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers.get("content-type"));

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await readJsonSafely(res);

        console.log("Turnos data:", data);
        const turnosArray = unwrapAppointments<AppointmentFull>(data);

        console.log("Turnos array procesado:", turnosArray);
        setTurnos(turnosArray);
      } catch (error: unknown) {
        if (handleAbortOrConnectionError(error, undefined, "Error de conexión con el servidor")) {
          console.log("Fetch aborted for turnos");
          return;
        }
        console.error("Error fetching appointments:", error);
        setTurnos([]);
      } finally {
        setIsLoadingTurnos(false);
      }
    };

    void loadTurnos();
    return abortFetchAbort;
  }, [
    isAuthenticated,
    user,
    navigate,
    renewFetchAbort,
    abortFetchAbort,
  ]);

  const handleDelete = async (codTurno: string) => {
    //custom alert for confirmation:
    toast(
      (t) => (
        <div className={barberStyles.modalContainer}>
          <p className={barberStyles.modalTitle}>
            ¿Estás seguro de que deseas cancelar esta reserva?
          </p>
          <div className={barberStyles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={barberStyles.buttonCancel}
            >
              Atrás
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmedDelete(codTurno);
              }}
              className={barberStyles.buttonConfirm}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "350px",
          padding: "24px",
        },
      },
    );
  };

  const confirmedDelete = async (codTurno: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Cancelando turno...");

    // Abort any previous submit
    const controller = renewSubmitAbort();

    try {
      const response = await apiFetch(`/turnos/${codTurno}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (response.ok) {
        await readJsonSafely(response);
        toast.success("Turno cancelado correctamente", { id: toastId });

        // update localState of the appointment instead of removing it
        setTurnos(
          turnos.map((turno) =>
            turno.codTurno === codTurno
              ? { ...turno, estado: "Cancelado" }
              : turno,
          ),
        );
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId });
      } else {
        const errorData = await readJsonSafely(response);
        console.error("Error response:", errorData);
        toast.error(
          getResponseMessage(errorData, "Error al cancelar el turno") ??
            "Error al cancelar el turno",
          { id: toastId },
        );
      }
    } catch (error: unknown) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión con el servidor")) {
        console.log("Cancel request aborted");
        return;
      }
      console.error("Error en la solicitud:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = (turno: AppointmentFull) => {
    setTurnoToUpdate(turno);
    setSelectedUpdateTime("");
    setIsUpdateModalOpen(true);
  };

  const handleTimeSlotSelect = (fecha: string, hora: string) => {
    setSelectedUpdateTime(hora);
    // keep form values in sync so handleSubmit has validated data
    setValue("fechaTurno", fecha, { shouldValidate: true });
    setValue("horaDesde", hora, { shouldValidate: true });
  };

  // onSubmit will be used by react-hook-form; formState.isSubmitting is the primary lock
  const onSubmit = async (data: UpdateFormValues) => {
    if (!turnoToUpdate) {
      toast.error("No hay turno seleccionado para modificar");
      return;
    }

    const toastId = toast.loading("Modificando turno...");

    // Abort any previous submit
    const controller = renewSubmitAbort();

    try {
      const response = await apiFetch(
        `/turnos/${turnoToUpdate.codTurno}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fechaTurno: data.fechaTurno,
            horaDesde: data.horaDesde,
          }),
          signal: controller.signal,
        },
      );

    if (response.ok) {
      const responseData = await readJsonSafely(response) as {
        success: boolean;
        data?: AppointmentFull;
      };

      const updatedTurno = responseData.data;

      if (!updatedTurno) {
        throw new Error("El backend no devolvió el turno actualizado");
      }

      toast.success("Turno modificado exitosamente", { id: toastId });

      setTurnos((prevTurnos) =>
        prevTurnos.map((t) =>
          t.codTurno === updatedTurno.codTurno
            ? updatedTurno
            : t,
        ),
      );

      setIsUpdateModalOpen(false);
      setTurnoToUpdate(null);
      reset();

      } else {
        const errorData = await readJsonSafely(response);
        toast.error(
          getResponseMessage(errorData, "Error al modificar el turno") ??
            "Error al modificar el turno",
          { id: toastId },
        );
      }
    } catch (error: unknown) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión con el servidor")) {
        console.log("Update request aborted");
        return;
      }

      console.error("Error modificando turno:", error);
    }
  };

  return (
    <div className={barberStyles.appointmentsContainer}>
      <h2>Mis turnos</h2>
      <div className={barberStyles.filtersContainer}>
        <select
          className={barberStyles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Programado">Programado</option>
          <option value="Cobrado">Cobrado</option>
          <option value="Sin cobrar">Sin cobrar</option>
          <option value="Cancelado">Cancelado</option>
          <option value="No asistido">No asistido</option>
        </select>
        <select
          className={barberStyles.filterSelect}
          value={dateSort}
          onChange={(e) =>
            setDateSort(e.target.value as "asc" | "desc")
          }
        >
          <option value="desc">Lejanos primero</option>
          <option value="asc">Próximos primero</option>
        </select>
      </div>
      <ul className={barberStyles.appointmentList}>
        {isLoadingTurnos ? (
          <li className={barberStyles.loadingState}>Cargando turnos...</li>
        ) : turnos.length === 0 ? (
          <li className={barberStyles.emptyState}>
            No tienes turnos a tu nombre.
          </li>
        ) : (
          [...turnos]
            .filter(
              (t) => statusFilter === "Todos" || t.estado === statusFilter,
            )
            .sort((a, b) => sortTurnosByDateTime(a, b, dateSort))
            .map((t) => {
              const client = t.usuarios_turnos_codClienteTousuarios;
              const barber = t.usuarios_turnos_codBarberoTousuarios;
              const branch = barber?.sucursales;
              const cut = t.tipos_corte;

              return (
                <li key={t.codTurno} className={barberStyles.appointmentItem}>
                  <div className={barberStyles.appointmentDetails}>
                    <div className={barberStyles.detailRow}>
                      <span className={barberStyles.detailLabel}>Fecha:</span>
                      <span className={barberStyles.detailValue}>
                        {formatDate(t.fechaTurno)}
                      </span>
                    </div>
                    <div className={barberStyles.detailRow}>
                      <span className={barberStyles.detailLabel}>Horario:</span>
                      <span className={barberStyles.detailValue}>
                        {formatTime(t.horaDesde)} - {formatTime(t.horaHasta)}
                      </span>
                    </div>
                    {client && (
                      <div className={barberStyles.detailRow}>
                        <span className={barberStyles.detailLabel}>
                          Cliente:
                        </span>
                        <span className={barberStyles.detailValue}>
                          {client.nombre} {client.apellido}
                        </span>
                      </div>
                    )}
                    {branch && (
                      <div className={barberStyles.detailRow}>
                        <span className={barberStyles.detailLabel}>
                          Sucursal:
                        </span>
                        <span className={barberStyles.detailValue}>
                          {branch.nombre}
                        </span>
                      </div>
                    )}
                    {cut?.nombreCorte &&
                      cut.nombreCorte !== "No especificado" && (
                        <div className={barberStyles.detailRow}>
                          <span className={barberStyles.detailLabel}>
                            Corte:
                          </span>
                          <span className={barberStyles.detailValue}>
                            {cut.nombreCorte}
                          </span>
                        </div>
                      )}
                    {t.precioTurno && t.precioTurno > 0 && (
                      <div className={barberStyles.detailRow}>
                        <span className={barberStyles.detailLabel}>
                          Precio:
                        </span>
                        <span className={barberStyles.detailValue}>
                          ${t.precioTurno}
                        </span>
                      </div>
                    )}
                    <div className={barberStyles.detailRow}>
                      <span className={barberStyles.detailLabel}>Estado:</span>
                      <span
                        className={`${barberStyles.detailValue} ${
                          barberStyles.statusBadge
                        } ${getStatusClass(t.estado)}`}
                      >
                        {t.estado}
                      </span>
                    </div>
                  </div>
                  {t.estado === "Programado" && (
                    <div className={barberStyles.appointmentActions}>
                      <button
                        className={barberStyles.deleteButton}
                        onClick={() => handleDelete(t.codTurno)}
                      >
                        Cancelar Turno
                      </button>
                      <button
                        className={barberStyles.updateButton}
                        onClick={() => handleUpdate(t)}
                      >
                        Modificar Turno
                      </button>
                    </div>
                  )}
                  {t.estado === "Cobrado" && (
                    <div className={barberStyles.appointmentActions}>
                      <button
                        className={barberStyles.receiptButton}
                        onClick={() =>
                          navigate(`/Barber/appointments/recibo/${t.codTurno}`)
                        }
                      >
                        Ver Factura
                      </button>
                    </div>
                  )}
                </li>
              );
            })
        )}
      </ul>

      {/* Modal of appointment update */}
      {isUpdateModalOpen && turnoToUpdate && user && (
        <div className={barberStyles.modalOverlay}>
          <div className={barberStyles.modalContent}>
            <div className={barberStyles.modalHeader}>
              <h3>Modificar Turno</h3>
              <button
                className={barberStyles.closeButton}
                onClick={() => setIsUpdateModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={barberStyles.modalBody}>
              <p className={barberStyles.currentAppointmentInfo}>
                <strong>Turno actual:</strong>
                <br />
                Fecha: {formatDate(turnoToUpdate.fechaTurno)}
                <br />
                Hora: {formatTime(turnoToUpdate.horaDesde)} -{" "}
                {formatTime(turnoToUpdate.horaHasta)}
              </p>
              {/* Use a form + react-hook-form to get formState.isSubmitting and zod validation */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset disabled={formState.isSubmitting}>
                  {/* hidden inputs to hold selected fecha/hora so zod/react-hook-form validate them */}
                  <input type="hidden" {...register("fechaTurno")} />
                  <input type="hidden" {...register("horaDesde")} />

                  <TimeSlotPicker
                    codBarbero={user.codUsuario}
                    onTimeSlotSelect={handleTimeSlotSelect}
                    showConfirmButton={false}
                    minDate={new Date()}
                  />

                  <div style={{ marginTop: 12 }}>
                    <button
                      type="submit"
                      className={barberStyles.updateButton}
                      disabled={!selectedUpdateTime || formState.isSubmitting}
                    >
                      {formState.isSubmitting
                        ? "Modificando..."
                        : "Confirmar Modificación"}
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberAppointments;
