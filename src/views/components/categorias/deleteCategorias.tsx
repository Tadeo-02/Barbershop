import React, { useState } from "react";

const DeleteCategoria: React.FC = () => {
    const [codCategoria, setCodCategoria] = useState("");

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codCategoria) {
            alert("Ingrese el código de la categoria a eliminar.");
            return;
        }
        try {
            console.log("Entra al try de delete:", codCategoria);

            const response = await fetch(`/categorias/${codCategoria}`, {
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
                alert("Categoria eliminada correctamente");
                setCodCategoria("");
            } else {
                alert(data.message || "Error al eliminar el turno");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    return (
        <div>
            <h1>Eliminar Categoria</h1>
            <form className="form" onSubmit={handleDelete}>
                <div className="form__group">
                    <label className="form__label" htmlFor="codCategoria">
                        Código de la Categoria:
                    </label>
                    <input
                        className="form__input"
                        type="number"
                        name="codCategoria"
                        id="codCategoria"
                        value={codCategoria}
                        onChange={(e) => setCodCategoria(e.target.value)}
                        required
                    />
                </div>
                <button className="button button--primary" type="submit">
                    ELIMINAR CATEGORIA
                </button>
            </form>
        </div>
    );
};

export default DeleteCategoria;
