import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserBaseSchemaExport } from "../../../../../BACK/Schemas/usersSchema";
import {  useAbortController} from "../../../components/shared/useAbortController";
import { apiFetch } from "../../../lib/apiFetch";
import { createResolver } from "../../../lib/zodFormResolver";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../../lib/passwordConstants";
import { getPasswordMissing } from "../../../lib/passwordRules";
import { BranchWithIdSchema } from "../../../../../BACK/Schemas/branchesSchema";
import { parseBackendResponse } from "../../../lib/backendResponse";

type Sucursal = z.infer<typeof BranchWithIdSchema>;

const CreateBarberSchema = UserBaseSchemaExport.extend({
  confirmarContraseña: z
    .string()
    .min(10, "Confirmar contraseña debe tener al menos 10 caracteres"),
  codSucursal: z.string().min(1, "Debe seleccionar una sucursal"),
}).refine((data) => data.contraseña === data.confirmarContraseña, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContraseña"],
});

type CreateBarberForm = z.infer<typeof CreateBarberSchema>;

const CreateBarbers: React.FC = () => {
  const navigate = useNavigate();
  const { renew: renewSucursalesAbort, abort: abortSucursalesAbort } =
    useAbortController();
  const { renew: renewSubmitAbort } = useAbortController();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateBarberForm>({
    resolver: createResolver(CreateBarberSchema),
    mode: "onBlur",
  });

  const passwordValue = watch("contraseña") || "";
  const passwordMissing = getPasswordMissing(passwordValue);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // load branches when the component mounts
  useEffect(() => {
    const controller = renewSucursalesAbort();
    const fetchSucursales = async () => {
      try {
        const response = await apiFetch("/sucursales", {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setSucursales(data);
        } else {
          toast.error("Error al cargar las sucursales");
        }
      } catch (error: unknown) {
        if (handleAbortOrConnectionError(error, undefined, "Error de conexión al cargar sucursales")) {
          return;
        }
        console.error("Error fetching sucursales:", error);
      }
    };

    fetchSucursales();
    return abortSucursalesAbort;
  }, [renewSucursalesAbort, abortSucursalesAbort]);

  const onSubmit = async (data: CreateBarberForm) => {
    // Cancel request if exists
    const controller = renewSubmitAbort();

    const toastId = toast.loading("Creando Barbero...");

    // separate confirmarContraseña before sending
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmarContraseña: _, ...datosParaBackend } = data;

    try {
      const response = await apiFetch("/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaBackend),
        signal: controller.signal,
      });

      const parsed = await parseBackendResponse(response);

      if (parsed.ok) {
        toast.success(parsed.message || "Barbero creado exitosamente", {
          id: toastId,
          duration: 4000,
        });
        reset();
        // redirect with delay
        setTimeout(() => {
          navigate("/Admin/BarbersPage");
        }, 2000);
      } else {
        toast.error(parsed.message || "Error al crear barbero", {
          id: toastId,
        });
      }
    } catch (error: unknown) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión con el servidor")) {
        return;
      }
      console.error("Error en onSubmit:", error);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.pageTitle}>Crear Barbero</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting}>
          {/* DNI */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>DNI:</label>
            <input
              className={styles.formInput}
              type="text"
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

          {/* name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nombre:</label>
            <input
              className={styles.formInput}
              type="text"
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

          {/* lastname */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Apellido:</label>
            <input
              className={styles.formInput}
              type="text"
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

          {/* phone */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Teléfono:</label>
            <input
              className={styles.formInput}
              type="text"
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

          {/* EMAIL */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Correo electrónico:</label>
            <input
              className={styles.formInput}
              type="email"
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

          {/* CUIL */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>CUIL:</label>
            <input
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

          {/* password */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña:</label>
            <div className={styles.inputWithIcon}>
              <input
                className={styles.formInput}
                type={showPassword ? "text" : "password"}
                placeholder="********"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                pattern={PASSWORD_PATTERN}
                title={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres; debe incluir mayúsculas, minúsculas, números y símbolos`}
                required
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
            {errors["contraseña"] && passwordMissing.length === 0 && (
              <div className={styles.errorMessage}>
                {errors["contraseña"]?.message as string}
              </div>
            )}
          </div>

          {/* confirm password */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirmar contraseña:</label>
            <div className={styles.inputWithIcon}>
              <input
                className={styles.formInput}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="********"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                required
                {...register("confirmarContraseña")}
              />
              <button
                type="button"
                className={styles.inputIconButton}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                aria-pressed={showConfirmPassword}
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
            {errors.confirmarContraseña && (
              <div className={styles.errorMessage}>
                {errors.confirmarContraseña.message as string}
              </div>
            )}
          </div>

          {/* assign branch - change to radio buttons */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sucursal:</label>
            <div className={styles.radioGroup}>
              {sucursales.map((sucursal) => (
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
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              {isSubmitting ? "Creando..." : "Crear Barbero"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonPrimary}`}
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

export default CreateBarbers;
