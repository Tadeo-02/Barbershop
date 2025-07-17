import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Turno {
  codTurno: number;
  fechaTurno: string;
}

const IndexTurnos = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  useEffect(() => {
    // Llama al backend para obtener los turnos
    fetch("/turnos")
      .then((res) => res.json())
      .then((data) => {
        setTurnos(data); // data debe ser un array de turnos
        console.log("Turnos recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener turnos:", error);
      });
  }, []);

  
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés borrar este turno?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/turnos/${codTurno}`, {
        method: "delete",
      });

      if (response.ok) {
        alert("Turno eliminado correctamente.");
        // Acá podrías actualizar la lista de turnos o redirigir
      } else if (response.status === 404) {
        alert("Turno no encontrado.");
      } else {
        alert("Error al borrar el turno.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="index-turnos">
      <h1>Listado de turnos</h1>
      {turnos.length === 0 ? (
        <p>No hay turnos disponibles.</p>
      ) : (
        <ul>
          {turnos.map((turno, idx) => (
            <li key={idx}>
              <Link to={`/turnos/${turno.codTurno}`}>
                Codigo Turno: {turno.codTurno}
              </Link>
              ; - Fecha: {new Date(turno.fechaTurno).toLocaleDateString()}
              <br />
              <Link
                to={`/turnos/modificarTurno/${turno.codTurno}`}
                style={{ marginLeft: "20px", color: "blue" }}
              >
                Modificar
              </Link>
              <button className="button button--danger" onClick={handleDelete}>
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexTurnos;


