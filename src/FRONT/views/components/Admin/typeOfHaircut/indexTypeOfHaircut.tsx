import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";

interface TipoCorte {
  codCorte: string;
  nombreCorte: string;
  valorBase: number;
}

const IndexTypeOfHaircut = () => {
  const [tipoCortes, setTipoCortes] = useState<TipoCorte[]>([]);
  const [loading, setLoading] = useState(true); // loading inicial

  useEffect(() => {
    // llama al backend para obtener los tipos de corte
    fetch("/tipoCortes")
      .then((res) => res.json())
      .then((data) => {
        setTipoCortes(data); // data debe ser un array de tipoCortes
        console.log("Tipos de corte recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener tipos de corte:", error);
      })
      .finally(() => {
        setLoading(false); // Termina el loading
      });
  }, []);

  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando tipo de corte...</div>;
  }

  const handleDelete = async (codCorte: string) => {
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
            ¿Estás seguro de que querés borrar este tipo de corte?
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
                confirmedDelete(codCorte);
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

  const confirmedDelete = async (codCorte: string) => {
    const toastId = toast.loading("Eliminando tipo de corte...");

    try {
      const response = await fetch(`/tipoCortes/${codCorte}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tipo de corte eliminado correctamente", { id: toastId });
        setTipoCortes(
          tipoCortes.filter((corte) => corte.codCorte !== codCorte)
        );
      } else if (response.status === 404) {
        toast.error("Tipo de corte no encontrado", { id: toastId });
      } else {
        toast.error("Error al borrar el tipo de corte", { id: toastId });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.indexTipoCortes}>
      <h2>Gestión de Tipos de Corte</h2>
      {tipoCortes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay tipos de corte disponibles.</p>
        </div>
      ) : (
        <ul>
          {tipoCortes.map((corte, idx) => (
            <li key={idx}>
              <div className={styles.corteInfo}>
                <div className={styles.corteTitle}>
                  <strong>{corte.nombreCorte}</strong>
                </div>
                <div className={styles.cortePrice}>
                  Valor Base: ${corte.valorBase}
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  to={`updateTypeOfHaircut/${corte.codCorte}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(corte.codCorte)}
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

export default IndexTypeOfHaircut;
