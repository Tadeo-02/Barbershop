import React, { useState } from "react";

const createCategorias: React.FC = () => {
    const [nomCategoria, setNomCategoria] = useState("");
    const [descCategoria, setDescCategoria] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log("Enviando POST a /categorias con:", { nomCategoria, descCategoria });
            const response = await fetch("/categorias", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nomCategoria, descCategoria }),
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
                setNomCategoria("");
                setDescCategoria("");
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
            <h1>Crear Categoría</h1>
            <form className="form" onSubmit={handleSubmit}>
                <div className="form__group">
                    <label className="form__label" htmlFor="nomCategoria">
                        Nombre de la Categoría:
                    </label>
                    <input
                        className="form__input"
                        type="text"
                        name="nomCategoria"
                        id="nomCategoria"
                        value={nomCategoria}
                        onChange={(e) => setNomCategoria(e.target.value)}
                        placeholder="Ej: Premium"
                        required
                    />
                </div>
                <div className="form__group">
                    <label className="form__label" htmlFor="descCategoria">
                        Descripción:
                    </label>
                    <textarea
                        className="form__input"
                        name="descCategoria"
                        id="descCategoria"
                        value={descCategoria}
                        onChange={(e) => setDescCategoria(e.target.value)}
                        placeholder="Describe los beneficios de esta categoría..."
                        rows={4}
                        required
                    />
                </div>
                <button className="button button--primary" type="submit">
                    Guardar Categoría
                </button>
            </form>
        </div>
    );

};
export default createCategorias;