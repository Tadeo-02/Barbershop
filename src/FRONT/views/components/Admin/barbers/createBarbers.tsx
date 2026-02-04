import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserBaseSchemaExport } from "../../../../../BACK/Schemas/usersSchema";

interface Sucursal {
  codSucursal: string;
  nombre: string;
}

const CreateBarberSchema = UserBaseSchemaExport.extend({
  confirmarContraseña: z
    .string()
    .min(6, "Confirmar contraseña debe tener al menos 6 caracteres"),
  codSucursal: z.string().min(1, "Debe seleccionar una sucursal"),
}).refine((data) => data.contraseña === data.confirmarContraseña, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContraseña"],
});

type CreateBarberForm = z.infer<typeof CreateBarberSchema>;

const CreateBarbers: React.FC = () => {
  const navigate = useNavigate();

  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBarberForm>({
    resolver: zodResolver(CreateBarberSchema),
    mode: "onBlur",
  });


  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Cargar sucursales al montar el componente
  useEffect(() => {
    const ctrl = new AbortController();
    const fetchSucursales = async () => {
      try {
        const response = await fetch("/sucursales", { signal: ctrl.signal });
        if (response.ok) {
          const data = await response.json();
          setSucursales(data);
        } else {
          toast.error("Error al cargar las sucursales");
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Error fetching sucursales:", error);
        toast.error("Error de conexión al cargar sucursales");
      }
    };

    fetchSucursales();
    return () => ctrl.abort();
  }, []);

  const onSubmit = async (data: CreateBarberForm) => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const toastId = toast.loading("Creando Usuario...");

    // Separar confirmarContraseña antes de enviar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmarContraseña: _, ...datosParaBackend } = data;

    try {
      const response = await fetch("/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaBackend),
        signal: abortControllerRef.current.signal,
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(responseData.message || "Barbero creado exitosamente", { id: toastId, duration: 4000 });
        reset();
        // Redirección con delay
        setTimeout(() => {
        navigate("/Admin/BarbersPage");
        }, 2000);
      } else {
        toast.error(responseData.message || "Error al crear barbero", { id: toastId });
      }
    } catch (error: any) {
      if (error && error.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Error en onSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
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
            {errors.dni && <div className={styles.errorMessage}>{errors.dni.message as string}</div>}
          </div>

          {/* NOMBRE */}
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
            {errors.nombre && <div className={styles.errorMessage}>{errors.nombre.message as string}</div>}
          </div>

          {/* APELLIDO */}
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
            {errors.apellido && <div className={styles.errorMessage}>{errors.apellido.message as string}</div>}
          </div>

          {/* TELÉFONO */}
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
            {errors.telefono && <div className={styles.errorMessage}>{errors.telefono.message as string}</div>}
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
            {errors.email && <div className={styles.errorMessage}>{errors.email.message as string}</div>}
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
            {errors.cuil && <div className={styles.errorMessage}>{errors.cuil.message as string}</div>}
          </div>

          {/* CONTRASEÑA */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña:</label>
            <input
              className={styles.formInput}
              type="password"
              placeholder="********"
              minLength={6}
              maxLength={50}
              required
              {...register("contraseña")}
            />
            {errors["contraseña"] && <div className={styles.errorMessage}>{errors["contraseña"]?.message as string}</div>}
          </div>

          {/* CONFIRMAR CONTRASEÑA */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirmar contraseña:</label>
            <input
              className={styles.formInput}
              type="password"
              placeholder="********"
              minLength={6}
              maxLength={50}
              required
              {...register("confirmarContraseña")}
            />
            {errors.confirmarContraseña && <div className={styles.errorMessage}>{errors.confirmarContraseña.message as string}</div>}
          </div>

          {/* ASIGNAR SUCURSAL - Cambiar a radio buttons */}
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
            {errors.codSucursal && <div className={styles.errorMessage}>{errors.codSucursal.message as string}</div>}
          </div>

          <div className={styles.actionButtons}>
            <button type="submit" disabled={isSubmitting} className={`${styles.button} ${styles.buttonPrimary}`}>
              {isSubmitting ? "Creando..." : "Crear Barbero"}
            </button>
            <button type="button" disabled={isSubmitting} className={`${styles.button} ${styles.buttonSuccess}`} onClick={() => navigate("/Admin/BarbersPage")}>
              Volver
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default CreateBarbers;
