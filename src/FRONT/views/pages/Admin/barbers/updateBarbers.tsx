import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  UserBaseSchemaExport,
} from "../../../../../BACK/Schemas/usersSchema";
import { useAbortController } from "../../../components/shared/useAbortController";
import { fetchPendingAppointmentsCount } from "../../../components/Admin/pendingAppointments";
import { apiFetch } from "../../../lib/apiFetch";
import { createResolver } from "../../../lib/zodFormResolver";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../../lib/passwordConstants";
import { getPasswordMissing } from "../../../lib/passwordRules";
import { parseBackendResponse } from "../../../lib/backendResponse";
import type { Sucursal } from "../../../../types/branch";
import type { UserResponse } from "../../../../types/user";

type Barbero = UserResponse;

const UpdateBarberSchema = UserBaseSchemaExport.extend({
  contraseña: z.string().optional(),
  confirmarContraseña: z.string().optional(),
  codSucursal: z.string().min(1, "Debe seleccionar una sucursal"),
}).refine(
  (data) => {
    if (data.contraseña || data.confirmarContraseña) {
      return data.contraseña === data.confirmarContraseña;
    }
    return true;
  },
  {
    message: "Las contraseñas no coinciden",
    path: ["confirmarContraseña"],
  },
);

type UpdateBarberForm = z.infer<typeof UpdateBarberSchema>;

const UpdateBarber: React.FC = () => {
  const { codUsuario } = useParams<{ codUsuario: string }>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState<
    Sucursal[]
  >([]);
  const { renew: renewSucursalesAbort, abort: abortSucursalesAbort } =
    useAbortController();
  const { renew: renewBarberoAbort, abort: abortBarberoAbort } =
    useAbortController();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpdateBarberForm>({
    resolver: createResolver(UpdateBarberSchema),
    mode: "onBlur",
  });

  const passwordValue = watch("contraseña") || "";
  const passwordMissing = getPasswordMissing(passwordValue);

  useEffect(() => {
    const controller = renewSucursalesAbort();
    // load available branches for the radio buttons
    const fetchSucursales = async () => {
      try {
        const response = await apiFetch("/sucursales", {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setSucursalesDisponibles(data);
        }
      } catch (error: unknown) {
        if (handleAbortOrConnectionError(error, undefined, "Error de conexión")) {
          return;
        }
        console.error("Error fetching sucursales:", error);
      }
    };

    fetchSucursales();
    return abortSucursalesAbort;
  }, [renewSucursalesAbort, abortSucursalesAbort]);

  useEffect(() => {
    const controller = renewBarberoAbort();
    const fetchBarbero = async () => {
      const toastId = toast.loading("Cargando datos del barbero...");
      try {
        const response = await apiFetch(`/usuarios/${codUsuario}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();

          setBarbero(data);
          // populate form values
          reset({
            dni: data.dni || "",
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            telefono: data.telefono || "",
            email: data.email || "",
            cuil: data.cuil || "",
            contraseña: "",
            confirmarContraseña: "",
            codSucursal: data.codSucursal || "",
          });

          toast.dismiss(toastId);
        } else if (response.status === 404) {
          toast.error("Barbero no encontrado", { id: toastId, duration: 2000 });
          navigate("/Admin/BarbersPage");
        } else {
          toast.error("Error al cargar los datos del barbero", {
            id: toastId,
            duration: 2000,
          });
        }
      } catch (error: unknown) {
        if (handleAbortOrConnectionError(error, toastId, "Error de conexión")) {
          return;
        }
        console.error("Fetch error:", error);
      }
    };

    fetchBarbero();
    return abortBarberoAbort;
  }, [codUsuario, navigate, reset, renewBarberoAbort, abortBarberoAbort]);

  const onSubmit = async (formValues: UpdateBarberForm) => {
    const controller = renewSubmitAbort();

    // Check if branch is being changed
    const branchChanged = formValues.codSucursal !== barbero?.codSucursal;

    if (branchChanged) {
      if (!codUsuario) {
        toast.error("No se pudo identificar al barbero");
        return;
      }
      // Check for pending appointments before allowing branch change
      try {
        const pendingCount = await fetchPendingAppointmentsCount(
          "barber",
          codUsuario!,
        );

        if (pendingCount > 0) {
          toast.error(
            `No se puede cambiar de sucursal. El barbero tiene ${pendingCount} turno(s) vigente(s) sin atender.`,
            { duration: 2000 },
          );
          return;
        }
      } catch (error) {
        console.error("Error checking pending appointments:", error);
        toast.error("Error al verificar turnos pendientes");
        return;
      }
    }

    const toastId = toast.loading("Actualizando barbero...");

   // Prepare the payload and remove confirmarContraseña.

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmarContraseña: _, ...datosParaBackend } = formValues;

    // remove empty contraseña to avoid overwriting
    if (!datosParaBackend.contraseña) delete datosParaBackend.contraseña;

    try {
      // Use PUT method with the correct update endpoint
      const response = await apiFetch(`/usuarios/${barbero?.codUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaBackend),
        signal: controller.signal,
      });
      const parsed = await parseBackendResponse(response);

      if (parsed.ok) {
        toast.success(
          parsed.message || "Barbero actualizado exitosamente",
          { id: toastId, duration: 2000 },
        );
        navigate("/Admin/BarbersPage");
      } else {
        toast.error(parsed.message || "Error al actualizar barbero", {
          id: toastId,
          duration: 2000,
        });
      }
    } catch (error: unknown) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión")) {
        return;
      }
      console.error("Submit error:", error);
    }
  };

  if (!barbero) {
    return <div className={styles.loadingState}>Cargando barbero...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Barbero</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="dni">
              DNI:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="dni"
              placeholder="40300123"
              maxLength={8}
              required
              {...register("dni")}
            />
            {errors.dni && (
              <div className={styles.errorMessage}>
                {errors.dni.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="nombre">
              Nombre:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="nombre"
              placeholder="Juan"
              maxLength={50}
              required
              {...register("nombre")}
            />
            {errors.nombre && (
              <div className={styles.errorMessage}>
                {errors.nombre.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="apellido">
              Apellido:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="apellido"
              placeholder="Pérez"
              maxLength={50}
              required
              {...register("apellido")}
            />
            {errors.apellido && (
              <div className={styles.errorMessage}>
                {errors.apellido.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="telefono">
              Teléfono:
            </label>
            <input
              className={styles.formInput}
              type="text"
              id="telefono"
              placeholder="+54 11 1234-5678"
              maxLength={20}
              required
              {...register("telefono")}
            />
            {errors.telefono && (
              <div className={styles.errorMessage}>
                {errors.telefono.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="email">
              Email:
            </label>
            <input
              className={styles.formInput}
              type="email"
              id="email"
              placeholder="juan@ejemplo.com"
              maxLength={50}
              required
              {...register("email")}
            />
            {errors.email && (
              <div className={styles.errorMessage}>
                {errors.email.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="contraseña">
              Contraseña:
            </label>
            <div className={styles.inputWithIcon}>
              <input
                className={styles.formInput}
                type={showPassword ? "text" : "password"}
                id="contraseña"
                placeholder="Ingrese nueva contraseña o deje vacío para mantener la actual"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                pattern={PASSWORD_PATTERN}
                title={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres; debe incluir mayúsculas, minúsculas, números y símbolos`}
                {...register("contraseña")}
              />
              <button
                type="button"
                className={styles.inputIconButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
              >
                <svg
                  className={styles.inputIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {passwordValue && passwordMissing.length > 0 && (
              <div className={styles.passwordHints}>
                <strong>Falta:</strong>
                <ul>
                  {passwordMissing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {errors.contraseña && (
              <div className={styles.errorMessage}>
                {errors.contraseña.message as string}
              </div>
            )}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="cuil">
              CUIL:
            </label>
            <input // todo: format CUIL on demand
              className={styles.formInput}
              type="text"
              id="cuil"
              placeholder="20-40300123-4"
              {...register("cuil")}
            />
            {errors.cuil && (
              <div className={styles.errorMessage}>
                {errors.cuil.message as string}
              </div>
            )}
          </div>
          {/* asign branch - change to radio buttons */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sucursal:</label>
            <div className={styles.radioGroup}>
              {sucursalesDisponibles.map((sucursal) => (
                <div key={sucursal.codSucursal} className={styles.radioItem}>
                  <input
                    type="radio"
                    id={`sucursal-${sucursal.codSucursal}`}
                    value={sucursal.codSucursal}
                    {...register("codSucursal")}
                    className={styles.radio}
                  />
                  <label
                    htmlFor={`sucursal-${sucursal.codSucursal}`}
                    className={styles.radioLabel}
                  >
                    {sucursal.nombre}
                  </label>
                </div>
              ))}
            </div>
            {errors.codSucursal && (
              <div className={styles.errorMessage}>
                {errors.codSucursal.message as string}
              </div>
            )}
          </div>

          <div className={styles.detailsActionButtons}>
            <button
              className={`${styles.button} ${styles.buttonSuccess}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate("/Admin/BarbersPage")}
            >
              Volver
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateBarber;
