import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ShowTurno = () => {
  const { codTurno } = useParams(); // si lo pasás como parámetro de URL
  const [turno, setTurno] = useState(null);

  useEffect(() => {
    fetch(`/turnos/${codTurno}`)
      .then((res) => res.json())
      .then((data) => setTurno(data))
      .catch((err) => console.error("Error al obtener el turno:", err));
  }, [codTurno]);

  if (!turno) return <div>Cargando turno...</div>;

  return (
    <div>
      <h1>Turno: {turno.codTurno}</h1>
      <p>Fecha: {new Date(turno.fechaTurno).toLocaleDateString()}</p>
      <p>Precio: {turno.precioTurno}</p>
      {/* Más datos según tu modelo */}
    </div>
  );
};

export default ShowTurno;
