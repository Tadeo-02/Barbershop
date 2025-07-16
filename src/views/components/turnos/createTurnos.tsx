import React, { useState } from "react";

const CreateTurnos: React.FC = () => {
  const [fechaTurno, setFechaTurno] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Enviando POST a /turnos con fechaTurno:", fechaTurno);
      const response = await fetch("/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fechaTurno }),
      });
      console.log("Después de fetch, status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("Después de JSON.parse, data:", data);
        } catch (parseError) {
          console.error("Error al parsear JSON:", parseError);
          throw parseError;
        }
      } else {
        console.error("Respuesta vacía del backend");
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        alert(data.message);
        setFechaTurno("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div>
      <h1>Crear Turno</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label" htmlFor="fechaTurno">
            Fecha:
          </label>
          <input
            className="form__input"
            type="date"
            name="fechaTurno"
            id="fechaTurno"
            value={fechaTurno}
            onChange={(e) => setFechaTurno(e.target.value)}
          />
        </div>
        <button className="button button--primary" type="submit">
          Guardar
        </button>
      </form>
    </div>
  );
};

export default CreateTurnos;
