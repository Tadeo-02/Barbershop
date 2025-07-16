import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const IndexTurnos = () => {
  const [turnos, setTurnos] = useState([]);

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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexTurnos;


