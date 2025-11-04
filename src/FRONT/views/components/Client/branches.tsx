import React, { useEffect, useState, useRef } from "react";
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
  const [showOptions, setShowOptions] = React.useState(false);
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

  if(loading) {
    return <div className={styles.loadingState}>Cargando sucursales...</div>;
  }

  const handleSelectBranch = (codSucursal: string) => {
    // Toggle selection: si ya está seleccionada, la deseleccionamos
    if (selectedBranch === codSucursal) {
      setSelectedBranch(null);
      setShowOptions(false);
    } else {
      setSelectedBranch(codSucursal);
      setShowOptions(true);
    }
  };

  const handleBarberFirst = () => {
    const cod = selectedBranch ?? (branches[0] && branches[0].codSucursal);
    if (!cod) return;
    navigate(`/branches/${cod}/barbers`);
  };
  const handleScheduleFirst = () => {
    const cod = selectedBranch ?? (branches[0] && branches[0].codSucursal);
    if (!cod) return;
    navigate(`/branches/${cod}/schedule`);
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
          {branches.map((branch, idx) => (
            <li
              key={idx}
              className={`${styles.branchItem} ${
                selectedBranch === branch.codSucursal ? styles.branchItemSelected : ""
              }`}
              onClick={() => handleSelectBranch(branch.codSucursal)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-pressed={selectedBranch === branch.codSucursal}
            >
              <div className={styles.branchName}>{branch.nombre}</div>
              <div className={styles.branchAddress}>
                {branch.calle} {branch.altura}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showOptions && (
        <div className={styles.optionsContainer}>
          <h3>¿Cómo quieres buscar tu turno?</h3>
          <button className={styles.optionButton} onClick={handleBarberFirst}>
            Elegir barbero
          </button>
          <button className={styles.optionButton} onClick={handleScheduleFirst}>
            Elegir horario
          </button>
        </div>
      )}
    </div>
  );
};

export default IndexBranches;
