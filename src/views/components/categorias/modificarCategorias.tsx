import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ModificarCategoria: React.FC = () => {
    const { codCategoria } = useParams<{ codCategoria: string }>();
    const navigate = useNavigate();
    const [categoria, setCategoria] = useState<any | null>(null); // Use 'any' type
    const [nomCategoria, setNomCategoria] = useState("");
    const [descCategoria, setDescCategoria] = useState("");

    useEffect(() => {
        const fetchCategoria = async () => {
            try {
                const response = await fetch(`/categorias/${codCategoria}`);
                if (response.ok) {
                    const data = await response.json();
                    setCategoria(data);
                    setNomCategoria(data.NomCategoria);
                    setDescCategoria(data.DescCategoria);
                } else {
                    console.error("Failed to fetch categoria");
                }
            } catch (error) {
                console.error("Error fetching categoria:", error);
            }
        };

        fetchCategoria();
    }, [codCategoria]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `/categorias/${categoria?.codCategoria}?_method=PUT`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ nomCategoria, descCategoria }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                navigate("/indexCategorias"); // Redirigir a la lista de categorias
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error updating categoria:", error);
            alert("Error de conexión");
        }
    };

    if (!categoria) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Editar Categoria</h1>
            <form className="form" onSubmit={handleSubmit}>
                <div className="form__group">
                    <label className="form__label" htmlFor="nomCategoria">
                        Nombre:
                    </label>
                    <input
                        className="form__input"
                        type="text"
                        name="nomCategoria"
                        id="nomCategoria"
                        value={nomCategoria}
                        onChange={(e) => setNomCategoria(e.target.value)}
                    />
                    <input
                        className="form__input"
                        type="text"
                        name="descCategoria"
                        id="descCategoria"
                        value={nomCategoria}
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

export default ModificarCategoria;
