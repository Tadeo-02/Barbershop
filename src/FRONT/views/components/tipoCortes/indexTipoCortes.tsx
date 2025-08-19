import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TipoCortes.module.css";

interface TipoCorte {
  codCorte: number;
  nombreCorte: string;
  valorBase: number;
}

const IndexTipoCortes = () => {
  const [tipoCortes, setTipoCortes] = useState<TipoCorte[]>([]);

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
      });
  }, []);

  const handleDelete = async (codCorte: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés borrar este tipo de corte?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/tipoCortes/${codCorte}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Tipo de corte eliminado correctamente.");
        // actualizar la lista removiendo el eliminado
        setTipoCortes(
          tipoCortes.filter((corte) => corte.codCorte !== codCorte)
        );
      } else if (response.status === 404) {
        alert("Tipo de corte no encontrado.");
      } else {
        alert("Error al borrar el tipo de corte.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className={styles.indexTipoCortes}> 
      <h2>Listado de Tipos de Corte</h2>
      {tipoCortes.length === 0 ? (
        <p>No hay tipos de corte disponibles.</p>
      ) : (
        <ul>
          {tipoCortes.map((corte) => (
            <li key={corte.codCorte}>
              <div>
                <strong>{corte.nombreCorte}</strong> (Código: {corte.codCorte})
                <br />
                Valor base: ${corte.valorBase}
              </div>
              <div>
                <Link
                  to={`/tipoCortes/modificarTipoCorte/${corte.codCorte}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`} 
                  onClick={() => handleDelete(corte.codCorte)}
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexTipoCortes;
