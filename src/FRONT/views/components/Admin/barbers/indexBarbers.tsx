import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";

interface Barbero {
  codUsuario: string;
  cuil: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

const IndexBarbers = () => {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [loading, setLoading] = useState(true); // loading inicial

  useEffect(() => {
    //alert de loading para carga inicial
    // const toastId = toast.loading("Cargando barberos...");

    // Llama al backend para obtener los barberos
    fetch("/usuarios")
      .then((res) => res.json())
      .then((data) => {
        setBarberos(data); // data debe ser un array de barberos
        console.log("Barberos recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener barberos:", error);
        // toast.error("Error al cargar los barberos", { id: toastId });
      })
      .finally(() => {
        setLoading(false); // Termina el loading
      });
  }, []);
  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando barberos...</div>;
  }

  const handleDelete = async (codUsuario: string) => {
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
            ¿Estás seguro de que querés borrar este barbero?
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
                confirmedDelete(codUsuario);
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

  const confirmedDelete = async (codUsuario: string) => {
    const toastId = toast.loading("Eliminando barbero...");

    try {
      const response = await fetch(`/usuarios/${codUsuario}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Barbero eliminado correctamente", { id: toastId });
        setBarberos(barberos.filter((barbero) => barbero.codUsuario !== codUsuario));
      } else if (response.status === 404) {
        toast.error("Barbero no encontrado", { id: toastId });
      } else {
        toast.error("Error al borrar el barbero", { id: toastId });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  return (
    <div className={styles.indexBarberos}>
      <h2>Gestión de Barberos</h2>
      {barberos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay barberos disponibles.</p>
        </div>
      ) : (
        <ul>
          {barberos.map((barbero, idx) => (
            <li key={idx}>
              <div className={styles.barberoInfo}>
                <div className={styles.barberoTitle}>
                  {barbero.apellido}, {barbero.nombre}
                </div>
                <div className={styles.barberoCode}>CUIL: {barbero.cuil}</div>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  to={`/Admin/BarbersPage/${barbero.codUsuario}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Ver Detalles
                </Link>
                <Link
                  to={`/Admin/BarbersPage/updateBarber/${barbero.codUsuario}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(barbero.codUsuario)}
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

export default IndexBarbers;
