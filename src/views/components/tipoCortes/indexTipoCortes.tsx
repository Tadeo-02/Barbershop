import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface TipoCorte {
  codCorte: number;
  nombreCorte: string;
  valorBase: number;
}

const IndexTipoCortes = () => {
  const [tipoCortes, setTipoCortes] = useState<TipoCorte[]>([]);

  useEffect(() => {
    // Llama al backend para obtener los tipos de corte
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
        // Actualizar la lista removiendo el eliminado
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
    <div className="index-tipo-cortes">
      <h1>Listado de Tipos de Corte</h1>
      {tipoCortes.length === 0 ? (
        <p>No hay tipos de corte disponibles.</p>
      ) : (
        <ul>
          {tipoCortes.map((corte) => (
            <li key={corte.codCorte}>
              <strong>{corte.nombreCorte}</strong> (Código: {corte.codCorte})
              <br />
              Valor base: ${corte.valorBase}
              <br />
              <Link
                to={`/tipoCortes/modificar/${corte.codCorte}`}
                style={{ marginLeft: "20px", color: "blue" }}
              >
                Modificar
              </Link>
              <button
                className="button button--danger"
                onClick={() => handleDelete(corte.codCorte)}
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexTipoCortes;
