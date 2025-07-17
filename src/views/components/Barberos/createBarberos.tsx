import React, { useState } from "react";

const CreateTurnos: React.FC = () => {
  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Enviando POST a /barberos con datos barbero:", cuil, nombre, apellido, telefono);
      const response = await fetch("/barberos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cuil, nombre, apellido, telefono }),
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
        setCuil("");
        setNombre("");
        setApellido("");
        setTelefono("");
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
      <h1>Crear Barberos</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label" htmlFor="cuil">
            Cuil:
          </label>
          <input
            className="form__input"
            type="text"
            name="cuil"
            id="cuil"
            value={cuil}
            onChange={(e) => setCuil(e.target.value)}
          />
        </div>
        <div className="form__group">
          <label className="form__label" htmlFor="nombre">
            Nombre:
          </label>
          <input
            className="form__input"
            type="text"
            name="nombre"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="form__group">
          <label className="form__label" htmlFor="apellido">
            Apellido:
          </label>
          <input
            className="form__input"
            type="text"
            name="apellido"
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>
        <div className="form__group">
          <label className="form__label" htmlFor="telefono">
            Teléfono:
          </label>
          <input
            className="form__input"
            type="text"
            name="telefono"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
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
