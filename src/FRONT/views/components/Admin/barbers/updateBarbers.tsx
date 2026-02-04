import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserBaseSchemaExport } from "../../../../../BACK/Schemas/usersSchema";

interface Barbero {
  codUsuario: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  contrase_a?: string;
  cuil?: string;
  codSucursal?: string;
}

interface Sucursal {
  codSucursal: string;
  nombre: string;
}

const UpdateBarberSchema = UserBaseSchemaExport.extend({
  contraseña: z.string().optional(),
  confirmarContraseña: z.string().optional(),
  codSucursal: z.string().min(1, "Debe seleccionar una sucursal"),
}).refine((data) => {
  if (data.contraseña || data.confirmarContraseña) {
    return data.contraseña === data.confirmarContraseña;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContraseña"],
});

type UpdateBarberForm = z.infer<typeof UpdateBarberSchema>;

const UpdateBarber: React.FC = () => {
  const { codUsuario } = useParams<{ codUsuario: string }>();
  const navigate = useNavigate();
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState<Sucursal[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateBarberForm>({
    resolver: zodResolver(UpdateBarberSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const ctrl = new AbortController();
    // Cargar sucursales disponibles
    const fetchSucursales = async () => {
      try {
        const response = await fetch("/sucursales", { signal: ctrl.signal });
        if (response.ok) {
          const data = await response.json();
          setSucursalesDisponibles(data);
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Error fetching sucursales:", error);
      }
    };

    fetchSucursales();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const fetchBarbero = async () => {
      const toastId = toast.loading("Cargando datos del barbero...");
      try {
        const response = await fetch(`/usuarios/${codUsuario}`, { signal: ctrl.signal });

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Debug - Data received from API:", data);

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
          toast.error("Barbero no encontrado", { id: toastId });
          navigate("/BarbersPage");
        } else {
          toast.error("Error al cargar los datos del barbero", { id: toastId });
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          toast.dismiss(toastId);
          return;
        }
        console.error("🔍 Debug - Fetch error:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchBarbero();
    return () => ctrl.abort();
  }, [codUsuario, navigate, reset]);

  const onSubmit = async (formValues: UpdateBarberForm) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const toastId = toast.loading("Actualizando barbero...");

    // preparar payload y eliminar confirmarContraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmarContraseña: _, ...datosParaBackend } = formValues as any;

    // remove empty contraseña to avoid overwriting
    if (!datosParaBackend.contraseña) delete datosParaBackend.contraseña;

    try {
      // Use POST with ?_method=PUT to support backends requiring method override
      const response = await fetch(`/usuarios/${barbero?.codUsuario}?_method=PUT`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaBackend),
        signal: abortControllerRef.current.signal,
      });

      const responseData = await response.json();
      console.log("🔍 Debug - Response data:", responseData);

      if (response.ok) {
        toast.success(responseData.message || "Barbero actualizado exitosamente", { id: toastId });
        navigate("/Admin/BarbersPage");
      } else {
        toast.error(responseData.message || "Error al actualizar barbero", { id: toastId });
      }
    } catch (error: any) {
      if (error && error.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("🔍 Debug - Submit error:", error);
      toast.error("Error de conexión", { id: toastId });
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
            {errors.dni && <div className={styles.errorMessage}>{errors.dni.message as string}</div>}
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
            {errors.nombre && <div className={styles.errorMessage}>{errors.nombre.message as string}</div>}
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
            {errors.apellido && <div className={styles.errorMessage}>{errors.apellido.message as string}</div>}
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
            {errors.telefono && <div className={styles.errorMessage}>{errors.telefono.message as string}</div>}
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
            {errors.email && <div className={styles.errorMessage}>{errors.email.message as string}</div>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="contraseña">
              Contraseña:
            </label>
            <input // todo: placeholder
              className={styles.formInput}
              type="password"
              id="contraseña"
              placeholder="Ingrese nueva contraseña o deje vacío para mantener la actual"
              {...register("contraseña")}
            />
            {errors.contraseña && <div className={styles.errorMessage}>{errors.contraseña.message as string}</div>}
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
            {errors.cuil && <div className={styles.errorMessage}>{errors.cuil.message as string}</div>}
          </div>
          {/* ASIGNAR SUCURSAL - Cambiar a radio buttons */}
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
                  <label htmlFor={`sucursal-${sucursal.codSucursal}`} className={styles.radioLabel}>
                    {sucursal.nombre}
                  </label>
                </div>
              ))}
            </div>
            {errors.codSucursal && <div className={styles.errorMessage}>{errors.codSucursal.message as string}</div>}
          </div>

          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default UpdateBarber;
