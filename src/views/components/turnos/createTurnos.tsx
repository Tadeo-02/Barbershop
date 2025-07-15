import React, { useState } from "react";

const CreateTurnos: React.FC = () => {
  const [fechaTurno, setFechaTurno] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/createTurnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fechaTurno }),
      });
      const data = await response.json(); // Parse the JSON response

      if (response.ok) {
        alert(data.message); // Access the message from the JSON response
        setFechaTurno("");
      } else {
        alert(data.message); // Access the message from the JSON response
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
