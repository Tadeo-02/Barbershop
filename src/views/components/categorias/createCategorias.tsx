import React, { useState } from "react";

const createCategorias: React.FC = () => {
    const [nomCategoria, setNomCategoria] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log("Enviando POST a /categorias con nomCategoria:", nomCategoria);
            const response = await fetch("/categorias", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nomCategoria }),
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
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error en handleSubmit:", error);
            alert("Error de conexión");
        };
    const [descCategoria, setDescCategoria] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            console.log("Enviando POST a /categorias con descCategoria:", descCategoria);
            const response = await fetch("/categorias", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ descCategoria }),
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
            <h1>Crear Categoria</h1>
            <form className="form" onSubmit={handleSubmit}>
                <div className="form__group">
                    <label className="form__label" htmlFor="nomCategoria">
                        Npmbre:
                    </label>
                    <input
                        className="form__input"
                        type="string"
                        name="nomCategoria"
                        id="nomCategoria"
                        value={nomCategoria}
                        onChange={(e) => setNomCategoria(e.target.value)}
                    />
                    <input
                        className="form__input"
                        type="string"
                        name="descCategoria"
                        id="descCategoria"
                        value={descCategoria}
                        onChange={(e) => setDescCategoria(e.target.value)}
                    />
                </div>
                <button className="button button--primary" type="submit">
                    Guardar
                </button>
            </form>
        </div>
    );

};
export default createCategorias;