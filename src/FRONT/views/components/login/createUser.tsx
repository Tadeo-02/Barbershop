//! TERMINAR
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import styles from "./login.module.css";
import toast from "react-hot-toast";
import { UserBaseSchemaExport } from "../../../../BACK/Schemas/usersSchema";

//! Mejoras FrontEnd
/*
1) formState: { isSubmitting }; es el mejor lock disponible de frontEnd
2) <form onSubmit={handleSubmit(onSubmit)}>; prevención de errores
3) aborController; resuelve problemas como request colgadas, multiples envios consecutivos, request tardías,
hace que el backend procese menos 'basura' y mantiene un estado coherente
4) fieldset disabled={isSubmitting}; bloquea inputs mientras se manda el form (no es seguro ya que es UX)
5) if (error.name === "AbortError") return; manejo de errores
6) Schema zod; aporta prevención de errores y a mantener la integridad de datos desde el front
*/

//! Utilizamos el Schema de la librería Zod para validar campos
// Extend schema for form with password confirmation
const CreateUserSchema = UserBaseSchemaExport.omit({
  cuil: true,
  codSucursal: true,
})
  .extend({
    confirmarContraseña: z
      .string()
      .min(10, "Confirmar contraseña debe tener al menos 10 caracteres"),
  })
  .refine((data) => data.contraseña === data.confirmarContraseña, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarContraseña"],
  });

type CreateUserFormData = z.infer<typeof CreateUserSchema>;
//! isSubmitting es una estado de validación de formularios de la libreria react-hook-form para evitar multiples peticiones
const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  // AbortController ref para cancelar requests pendientes
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: CreateUserFormData) => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    // 1. Inicias el Toast
    const toastId = toast.loading("Creando Usuario...");

    // 2. MAGIA: Separas lo que es del front (confirmación) de lo que va a la DB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmarContraseña: _, ...datosParaBackend } = data;

    try {
      const response = await fetch("/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaBackend),
        signal: abortControllerRef.current.signal,
      });

      // 3. Parseo directo a JSON (más limpio que text + parse)
      const responseData = await response.json();

      if (response.ok) {
        // ÉXITO
        toast.success(responseData.message || "Usuario creado exitosamente", {
          id: toastId,
          duration: 4000,
        });

        reset(); // Limpiar formulario

        // Redirección con delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        // ERROR DEL BACKEND (Ej: DNI duplicado)
        toast.error(responseData.message || "Error al crear usuario", {
          id: toastId,
        });
      }
    } catch (error) {
      // Ignorar errores de abort (son intencionales)
      if (error instanceof Error && error.name === "AbortError") {
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
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
              {/*PROPIEDAD PARA DESHABILITAR ENVÍOS MULIPLES MEDIANTE HTML PURO  */}
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

                {/* NOMBRE */}
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

                {/* APELLIDO */}
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

                {/* TELÉFONO */}
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

                {/* EMAIL */}
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

                {/* CONTRASEÑA */}
                <label>Contraseña:</label>
                <input
                  required
                  type="password"
                  placeholder="********"
                  minLength={10}
                  maxLength={128}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+"
                  title="Mínimo 10 caracteres; debe incluir mayúsculas, minúsculas, números y símbolos"
                  {...register("contraseña")}
                />
                {errors.contraseña && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.contraseña.message}
                  </p>
                )}

                {/* CONFIRMAR CONTRASEÑA */}
                <label>Confirmar contraseña:</label>
                <input
                  required
                  type="password"
                  placeholder="********"
                  minLength={10}
                  maxLength={128}
                  {...register("confirmarContraseña")}
                />
                {errors.confirmarContraseña && (
                  <p style={{ color: "red", fontSize: "0.875rem" }}>
                    {errors.confirmarContraseña.message}
                  </p>
                )}
                {/* Aplicacion del isSubmitting */}
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
