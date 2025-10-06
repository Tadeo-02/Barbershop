import { useEffect, useState } from "react";
import styles from "./barbersByBranch.module.css";
import { useParams, useNavigate } from "react-router-dom";

interface Barbero {
  codUsuario: string;
  codSucursal: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

const BarbersByBranch = () => {
  const params = useParams();
  console.log("All URL parameters:", params);
  const { codSucursal } = useParams();
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null); // Changed from number to string
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("codSucursal from params:", codSucursal);

    if (!codSucursal) {
      setError("No se encontró el código de sucursal");
      setLoading(false);
      return;
    }

    fetch(`/usuarios/branch/${codSucursal}`)
      .then((res) => {
        console.log("Response status:", res.status);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        console.log(
          "Data received:",
          data,
          "Type:",
          typeof data,
          "Is Array:",
          Array.isArray(data)
        );
        // Extract the actual array from the response object
        const barbersArray = data.data || data; // Use data.data if it exists, otherwise fallback to data
        setBarberos(Array.isArray(barbersArray) ? barbersArray : []);
      })
      .catch((error) => {
        console.error("Error al obtener barberos:", error);
        setError(error.message);
        setBarberos([]); // Ensure it's an empty array on error
      })
      .finally(() => {
        setLoading(false);
      });
  }, [codSucursal]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando barberos...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Error: {error}</div>;
  }

  const handleSelectBarber = (codUsuario: string) => {
    setSelectedBarber(codUsuario);
    setShowSchedule(true);
  };

  const handleSchedule = () => {
    navigate(`/barbers/${selectedBarber}/appointments`);
  };

  return (
    <div className={styles.barbersContainer}>
      <h2>Elige un barbero</h2>
      <ul className={styles.barberList}>
        {barberos.length === 0 ? (
          <li className={styles.emptyState}>
            No hay barberos disponibles en esta sucursal.
          </li>
        ) : (
          barberos.map((barbero) => (
            <li
              key={barbero.codUsuario} // Use codUsuario as key instead of idx
              className={styles.barberItem}
              onClick={() => handleSelectBarber(barbero.codUsuario)} // Add click handler
              style={{ cursor: "pointer" }}
            >
              <div className={styles.barberName}>
                {barbero.apellido}, {barbero.nombre}
              </div>
              <div className={styles.barberPhone}>Tel: {barbero.telefono}</div>
            </li>
          ))
        )}
      </ul>
      {showSchedule && (
        <div className={styles.optionsContainer}>
          <button className={`${styles.button} ${styles.buttonPrimary} ${styles.optionButton}`} onClick={handleSchedule}>
            {/* inline clock icon */}
            <span aria-hidden="true" style={{display: 'inline-flex', alignItems: 'center'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 7V12L15.5 14.5" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Ver horarios disponibles</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BarbersByBranch;
