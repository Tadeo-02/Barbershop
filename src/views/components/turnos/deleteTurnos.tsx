import React, { useState } from "react";

const DeleteTurnos: React.FC = () => {
  const [codTurno, setCodTurno] = useState("");

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codTurno) {
      alert("Ingrese el código del turno a eliminar.");
      return;
    }
    try {
      console.log("Entra al try de delete:", codTurno);

      const response = await fetch(`/turnos/${codTurno}`, {
        method: "DELETE",
      });

      const text = await response.text();
      let data;
      if (text) {
        console.log("Antes del Try:", text);
        try {
          data = JSON.parse(text);
        }   
        catch {
          console.log("Dentro del catch:", text);
          data = { message: text };
        }
      } else {
        data = { message: "Sin respuesta del servidor" };
      }

      if (response.ok) {
        alert("Turno eliminado correctamente");
        setCodTurno("");
      } else {
        alert(data.message || "Error al eliminar el turno");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert("Error de conexión");
    }
  };

  return (
    <div>
      <h1>Eliminar Turno</h1>
      <form className="form" onSubmit={handleDelete}>
        <div className="form__group">
          <label className="form__label" htmlFor="codTurno">
            Código del Turno:
          </label>
          <input
            className="form__input"
            type="number"
            name="codTurno"
            id="codTurno"
            value={codTurno}
            onChange={(e) => setCodTurno(e.target.value)}
            required
          />
        </div>
        <button className="button button--primary" type="submit">
          ELIMINAR TURNO
        </button>
      </form>
    </div>
  );
};

export default DeleteTurnos;
