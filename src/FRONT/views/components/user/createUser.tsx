//! TERMINAR
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import styles from "./login.module.css";
import toast from "react-hot-toast";
import { UserBaseSchemaExport } from "../../../../BACK/Schemas/usersSchema.ts";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../lib/passwordConstants.ts";
import { getPasswordMissing } from "../../lib/passwordRules";
import { isAbortError, useAbortController } from "../shared/useAbortController";
import { apiFetch } from "../../lib/apiFetch.ts";

//! we use zods schema to validate fields
// Extend schema for form with password confirmation
const CreateUserSchema = UserBaseSchemaExport.omit({
  cuil: true,
  codSucursal: true,
})
  .extend({
    confirmarContraseña: z
      .string()
      .min(10, "Confirmar contraseña debe tener al menos 10 caracteres"),
    preguntaSeguridad: z
      .string()
      .min(1, "Seleccione una pregunta de seguridad"),
    respuestaSeguridad: z
      .string()
      .min(1, "Ingrese la respuesta a la pregunta de seguridad"),
  })
  .refine((data) => data.contraseña === data.confirmarContraseña, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarContraseña"],
  });

type CreateUserFormData = z.infer<typeof CreateUserSchema>;
//! isSubmitting is a state of form validation from the react-hook-form library to avoid multiple requests
const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  // AbortController to cancel pending requests 
  const { renew: renewSubmitAbort } = useAbortController();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    mode: "onBlur",
  });

  const passwordValue = watch("contraseña") || "";
  const passwordMissing = getPasswordMissing(passwordValue);

  const onSubmit = async (data: CreateUserFormData) => {
    const controller = renewSubmitAbort();

    // 1. Inicialize Toast
    const toastId = toast.loading("Creando Usuario...");

    // 2. Separate what is from the front (confirmation) from what goes to the DB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmarContraseña: _, ...datosParaBackend } = data;

    try {
      const response = await apiFetch("/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaBackend),
        signal: controller.signal,
      });

      // 3. Direct JSON parsing (cleaner than text + parse)
      const responseData = await response.json();

      if (response.ok) {
        // success
        toast.success(responseData.message || "Usuario creado exitosamente", {
          id: toastId,
          duration: 4000,
        });

        toast.success("Te enviamos un email para verificar tu cuenta.");

        reset(); // clean form

        // redirect with delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        //  BACKEND ERROR (Ex: DNI duplicated)
        toast.error(responseData.message || "Error al crear usuario", {
          id: toastId,
        });
      }
    } catch (error) {
      // Ignore abort errors (they are intentional)
      if (isAbortError(error)) {
        toast.dismiss(toastId);
        console.log("Request cancelado");
        return;
      }
      // ERROR DE RED
      console.error("Error en handleSubmit:", error);
      toast.error("No se pudo conectar con el servidor", { id: toastId });
    }
  };

  return (
    <section className={styles.about}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <form
              className={`${styles.form} ${styles.formLong}`}
              onSubmit={handleSubmit(onSubmit)}
            >
              {/*Property to disable multiple submissions using pure HTML */}
              <fieldset
                disabled={isSubmitting}
                style={{ border: "none", padding: 0, margin: 0 }}
              >
                <h1 className={styles.titleSignUp}>CREAR CUENTA</h1>

                {/* DNI */}
                <label>DNI:</label>
                <input
                  required
                  type="text"
                  placeholder="40300123"
                  maxLength={8}
                  {...register("dni")}
                />
                {errors.dni && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.dni.message}
                  </p>
                )}

                {/* Name */}
                <label>Nombre:</label>
                <input
                  required
                  type="text"
                  placeholder="Juan"
                  maxLength={50}
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.nombre.message}
                  </p>
                )}

                {/* Lastname */}
                <label>Apellido:</label>
                <input
                  required
                  type="text"
                  placeholder="Pérez"
                  maxLength={50}
                  {...register("apellido")}
                />
                {errors.apellido && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.apellido.message}
                  </p>
                )}

                {/* phone */}
                <label>Teléfono:</label>
                <input
                  required
                  type="text"
                  placeholder="+54 11 1234-5678"
                  maxLength={20}
                  {...register("telefono")}
                />
                {errors.telefono && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.telefono.message}
                  </p>
                )}

                {/* email */}
                <label>Correo electrónico:</label>
                <input
                  required
                  className={styles.formInput}
                  type="email"
                  placeholder="juan@ejemplo.com"
                  maxLength={50}
                  {...register("email")}
                />
                {errors.email && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.email.message}
                  </p>
                )}

                {/* password */}
                <label>Contraseña:</label>
                <div className={styles.inputWithIcon}>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
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
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.contraseña.message}
                  </p>
                )}

                {/* Confirm password */}
                <label>Confirmar contraseña:</label>
                <div className={styles.inputWithIcon}>
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
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
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.confirmarContraseña.message}
                  </p>
                )}

                {/* security question */}
                <label>Pregunta de seguridad:</label>
                <select
                  required
                  {...register("preguntaSeguridad")}
                  defaultValue=""
                  className={styles.smallSelect}
                >
                  <option value="" disabled>
                    Seleccione una pregunta
                  </option>
                  <option value="¿Cuál es el nombre de tu primera mascota?">
                    ¿Cuál es el nombre de tu primera mascota?
                  </option>
                  <option value="¿Cuál es el nombre de la calle donde creciste?">
                    ¿Cuál es el nombre de la calle donde creciste?
                  </option>
                  <option value="¿Cuál es el nombre de tu libro favorito?">
                    ¿Cuál es el nombre de tu libro favorito?
                  </option>
                </select>
                {errors.preguntaSeguridad && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.preguntaSeguridad.message}
                  </p>
                )}

                {/* security answer */}
                <label>Respuesta de seguridad:</label>
                <input
                  required
                  type="text"
                  placeholder="Tu respuesta"
                  maxLength={100}
                  {...register("respuestaSeguridad")}
                />
                <p style={{ fontSize: "0.875rem", opacity: 0.9 }}>
                  La pregunta de seguridad no reemplaza una contraseña fuerte.
                </p>
                {errors.respuestaSeguridad && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.respuestaSeguridad.message}
                  </p>
                )}
                {/* using isSubmitting */}
                <p className="has-text-centered">
                  <br />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creando..." : "Crear Cuenta"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    disabled={isSubmitting}
                  >
                    Volver al Login
                  </button>
                  <br />
                  <br />
                </p>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateUser;
