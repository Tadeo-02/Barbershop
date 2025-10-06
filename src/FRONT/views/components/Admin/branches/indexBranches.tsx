import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast";

interface Sucursal {
  codSucursal: string;
  calle: string;
  altura: number;
}

const IndexBranches = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true); // loading inicial

  useEffect(() => {
    //alert de loading para carga inicial
    // const toastId = toast.loading("Cargando sucursales...");

    // Llama al backend para obtener las sucursales
    fetch("/sucursales")
      .then((res) => res.json())
      .then((data) => {
        setSucursales(data); // data debe ser un array de sucursales
        console.log("Sucursales recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener sucursales:", error);
        // toast.error("Error al cargar las sucursales", { id: toastId });
      })
      .finally(() => {
        setLoading(false); // Termina el loading
      });
  }, []);
  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando sucursales...</div>;
  }

  const handleDelete = async (codSucursal: string) => {
    //alert personalizado para confirmacion:
    toast(
      (t) => (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            ¿Estás seguro de que querés borrar esta sucursal?
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmedDelete(codSucursal);
              }}
              style={{
                background: "#e53e3e",
                color: "white",
                border: "none",
                padding: "12px 24px", 
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px", 
                fontWeight: "600",
                minWidth: "120px", 
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#c53030";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e53e3e";
              }}
            >
              Eliminar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: "#718096",
                color: "white",
                border: "none",
                padding: "12px 24px", 
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px", 
                fontWeight: "600",
                minWidth: "120px", 
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4a5568";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#718096";
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "350px", // botones mas anchos
          padding: "24px",
        },
      }
    );
  };

  const confirmedDelete = async (codSucursal: string) => {
    const toastId = toast.loading("Eliminando sucursal...");

    try {
      const response = await fetch(`/sucursales/${codSucursal}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Sucursal eliminada correctamente", { id: toastId });
        setSucursales(sucursales.filter((sucursal) => sucursal.codSucursal !== codSucursal));
      } else if (response.status === 404) {
        toast.error("Sucursal no encontrada", { id: toastId });
      } else {
        toast.error("Error al borrar la sucursal", { id: toastId });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.indexSucursales}>
      <h2>Gestión de Sucursales</h2>
      {sucursales.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay sucursales disponibles.</p>
        </div>
      ) : (
        <ul>
          {sucursales.map((sucursal, idx) => (
            <li key={idx}>
              <div className={styles.sucursalInfo}>
                <div className={styles.sucursalTitle}>
                  {sucursal.calle}, {sucursal.altura}
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  to={`/Admin/BranchesPage/${sucursal.codSucursal}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Ver Detalles
                </Link>
                <Link
                  to={`/Admin/BranchesPage/updateBranches/${sucursal.codSucursal}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(sucursal.codSucursal)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexBranches;
