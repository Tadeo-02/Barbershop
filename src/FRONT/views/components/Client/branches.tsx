import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./branches.module.css";
// import toast from "react-hot-toast";
interface Branch {
  codSucursal: string;
  nombre: string;
  calle: string;
  altura: number;
}

const IndexBranches = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // loading inicial

  useEffect(() => {
    fetch("/sucursales")
      .then((res) => res.json())
      .then((data) => {
        setBranches(data); // data debe ser un array de sucursales
        console.log("Sucursales recibidas:", data);
      })
      .catch((error) => {
        console.error("Error al obtener sucursales:", error);
      })
      .finally(() => {
        setLoading(false); // Termina el loading
      });
  }, []);

  if (loading) {
    return <div className={styles.loadingState}>Cargando sucursales...</div>;
  }

  const handleSelectBranch = (codSucursal: string) => {
    // Toggle selection: si ya está seleccionada, la deseleccionamos
    if (selectedBranch === codSucursal) {
      setSelectedBranch(null);
    } else {
      setSelectedBranch(codSucursal);
    }
  };

  const handleBarberFirst = (codSucursal: string) => {
    if (!codSucursal) return;
    navigate(`/branches/${codSucursal}/barbers`);
  };
  const handleScheduleFirst = (codSucursal: string) => {
    if (!codSucursal) return;
    navigate(`/branches/${codSucursal}/schedule`);
  };

  return (
    <div className={styles.branchesContainer}>
      <h2>Sucursales disponibles</h2>
      {branches.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay sucursales disponibles.</p>
        </div>
      ) : (
        <ul className={styles.branchList}>
          {branches.map((branch) => (
            <li
              key={branch.codSucursal}
              className={`${styles.branchItem} ${
                selectedBranch === branch.codSucursal
                  ? styles.branchItemSelected
                  : ""
              }`}
              onClick={() => handleSelectBranch(branch.codSucursal)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-pressed={selectedBranch === branch.codSucursal}
              aria-expanded={selectedBranch === branch.codSucursal}
            >
              <div className={styles.branchName}>{branch.nombre}</div>
              <div className={styles.branchAddress}>
                {branch.calle} {branch.altura}
              </div>
              {selectedBranch === branch.codSucursal && (
                <div
                  className={styles.inlineOptions}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.inlineOptionsTitle}>
                    ¿Cómo quieres buscar tu turno?
                  </div>
                  <div className={styles.inlineOptionButtons}>
                    <button
                      className={`${styles.optionButton} ${styles.inlineOptionButton}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleBarberFirst(branch.codSucursal);
                      }}
                    >
                      Elegir barbero
                    </button>
                    <button
                      className={`${styles.optionButton} ${styles.inlineOptionButton}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleScheduleFirst(branch.codSucursal);
                      }}
                    >
                      Elegir horario
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexBranches;
