import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast";

interface Sucursal {
  codSucursal: string;
  nombre: string;
  calle: string;
  altura: number;
}

const UpdateBranches: React.FC = () => {
  const { codSucursal } = useParams<{ codSucursal: string }>();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [nombre, setNombre] = useState("");
  const [calle, setCalle] = useState("");
  const [altura, setAltura] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchSucursal = async () => {
      const toastId = toast.loading("Cargando datos de la sucursal...");

      try {
        console.log("🔍 Debug - codSucursal from params:", codSucursal);
        console.log("🔍 Debug - Making request to:", `/sucursales/${codSucursal}`);

        const response = await fetch(`/sucursales/${codSucursal}`);

        console.log("🔍 Debug - Response status:", response.status);
        console.log("🔍 Debug - Response ok:", response.ok);

        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Debug - Data received from API:", data);

          setSucursal(data);
          setNombre(data.nombre || "");
          setCalle(data.calle || "");
          setAltura(data.altura || "");

          console.log("🔍 Debug - States after setting:", {
            nombre: data.nombre,
            calle: data.calle,
            altura: data.altura,
          });

          toast.dismiss(toastId);
        } else if (response.status === 404) {
          console.log("🔍 Debug - Sucursal not found");
          toast.error("Sucursal no encontrado", { id: toastId });
          navigate("/BranchesPage");
        } else {
          console.log("🔍 Debug - Other error:", response.status);
          const errorData = await response.json().catch(() => ({}));
          console.log("🔍 Debug - Error data:", errorData);
          toast.error("Error al cargar los datos de la sucursal", { id: toastId });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("🔍 Debug - Fetch error:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchSucursal();

    return () => {
      isMounted = false;
    };
  }, [codSucursal, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const toastId = toast.loading("Actualizando sucursal...");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestData: any = {
        nombre,
        calle,
        altura,
      };

      console.log("🔍 Debug - Request data being sent:", requestData);
      console.log("🔍 Debug - URL:", `/sucursales/${sucursal?.codSucursal}`);

      const response = await fetch(`/sucursales/${sucursal?.codSucursal}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("🔍 Debug - Response data:", data);

      if (response.ok) {
        toast.success(data.message || "Sucursal actualizado exitosamente", {
          id: toastId,
        });
        navigate("/Admin/BranchesPage");
      } else {
        toast.error(data.message || "Error al actualizar sucursal", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("🔍 Debug - Submit error:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  if (!sucursal) {
    return <div className={styles.loadingState}>Cargando sucursal...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Sucursal</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="nombre">
            Nombre:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="nombre"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="calle">
            Calle:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="calle"
            id="calle"
            value={calle}
            onChange={(e) => setCalle(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="altura">
            Altura:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="altura"
            id="altura"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            required
          />
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.buttonSuccess}`}
            type="submit"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateBranches;