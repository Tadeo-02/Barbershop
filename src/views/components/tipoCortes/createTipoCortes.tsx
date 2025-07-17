import React, { useState } from "react";

const CreateTipoCortes: React.FC = () => {
  const [nombreCorte, setNombreCorte] = useState("");
  const [valorBase, setValorBase] = useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/tipoCortes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombreCorte, valorBase }),
      });

      const text = await response.text();

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Error al parsear JSON:", parseError);
          alert("Respuesta inválida del servidor");
          return;
        }
      } else {
        alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        alert(data.message || "Tipo de corte creado correctamente.");
        setNombreCorte("");
        setValorBase("");
      } else {
        alert(data.message || "Error al crear el tipo de corte.");
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div>
      <h1>Crear Tipo de Corte</h1>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label" htmlFor="nombreCorte">
            Nombre del corte:
          </label>
          <input
            className="form__input"
            type="text"
            name="nombreCorte"
            id="nombreCorte"
            value={nombreCorte}
            maxLength={50}
            required
            onChange={(e) => setNombreCorte(e.target.value)}
          />
        </div>
        <div className="form__group">
          <label className="form__label" htmlFor="valorBase">
            Valor base:
          </label>
          <input
            className="form__input"
            type="number"
            name="valorBase"
            id="valorBase"
            value={valorBase}
            min={0}
            required
            onChange={(e) =>
              setValorBase(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <button className="button button--primary" type="submit">
          Guardar
        </button>
      </form>
    </div>
  );
};

export default CreateTipoCortes;
