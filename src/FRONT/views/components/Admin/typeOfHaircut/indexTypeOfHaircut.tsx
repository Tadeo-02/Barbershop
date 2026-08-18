import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";
import { showConfirmActionToast } from "../shared/confirmActionToast";
import { changeEntityStatus } from "../shared/entityStatus";
import { apiFetch } from "../../../lib/apiFetch";

interface TipoCorte {
  codCorte: string;
  nombreCorte: string;
  valorBase: number;
}

const IndexTypeOfHaircut = () => {
  const [tipoCortes, setTipoCortes] = useState<TipoCorte[]>([]);
  const [loading, setLoading] = useState(true); // loading inicial

  useEffect(() => {
    const fetchTipoCortes = async () => {
      try {
        const res = await apiFetch("/tipoCortes");
        const data = await res.json();
        setTipoCortes(data);
        console.log("Tipos de corte recibidos:", data);
      } catch (error) {
        console.error("Error al obtener tipos de corte:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTipoCortes();
  }, []);

  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando tipo de corte...</div>;
  }

  const handleDelete = async (codCorte: string) => {
    showConfirmActionToast({
      title: "¿Estás seguro de que querés borrar este tipo de corte?",
      confirmLabel: "Eliminar",
      confirmColor: "danger",
      onConfirm: () => confirmedDelete(codCorte),
    });
  };

  const confirmedDelete = async (codCorte: string) => {
    await changeEntityStatus({
      endpoint: `/tipoCortes/${codCorte}`,
      method: "DELETE",
      loadingMessage: "Eliminando tipo de corte...",
      successMessage: "Tipo de corte eliminado correctamente",
      notFoundMessage: "Tipo de corte no encontrado",
      genericErrorMessage: "Error al borrar el tipo de corte",
      onSuccess: () => {
        setTipoCortes((prev) =>
          prev.filter((corte) => corte.codCorte !== codCorte),
        );
      },
    });
  };

  return (
    <>
      <div className={styles.indexTipoCortes}>
        <h2>Gestión de Tipos de Corte</h2>
        <div className={styles.createButtonWrapper}>
          <Link
            to="createTypeOfHaircut"
            className={`${styles.button} ${styles.buttonSuccess} ${styles.createButton}`}
          >
            CREAR TIPO DE CORTE
          </Link>
        </div>
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
    </>
  );
};

export default IndexTypeOfHaircut;
