import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ModificarTurno: React.FC = () => {
    const { codTurno } = useParams<{ codTurno: string }>();
    const navigate = useNavigate();
    const [turno, setTurno] = useState<any | null>(null); // Use 'any' type
    const [fechaTurno, setFechaTurno] = useState("");

    useEffect(() => {
        const fetchTurno = async () => {
            try {
                const response = await fetch(`/turnos/${codTurno}`);
                if (response.ok) {
                    const data = await response.json();
                    setTurno(data);
                    setFechaTurno(data.fechaTurno);
                } else {
                    console.error("Failed to fetch turno");
                }
            } catch (error) {
                console.error("Error fetching turno:", error);
            }
        };

        fetchTurno();
    }, [codTurno]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `/turnos/${turno?.codTurno}?_method=PUT`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ fechaTurno }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                navigate("/indexTurnos"); // Redirigir a la lista de turnos
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error updating turno:", error);
            alert("Error de conexión");
        }
    };

    if (!turno) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Editar Turno</h1>
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

export default ModificarTurno;
