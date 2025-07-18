    import { useEffect, useState } from "react";
    import { Link } from "react-router-dom";

    interface Barbero {
    cuil: string;
    nombre: string;
    apellido: string;
    }

    const IndexBarberos = () => {
    const [barberos, setBarberos] = useState<Barbero[]>([]);

    useEffect(() => {
        // Llama al backend para obtener los barberos
        fetch("/barberos")
        .then((res) => res.json())
        .then((data) => {
            setBarberos(data); // data debe ser un array de barberos
            console.log("Barberos recibidos:", data);
        })
        .catch((error) => {
            console.error("Error al obtener barberos:", error);
        });
    }, []);

    const handleDelete = async (cuil: string) => {
        const confirmed = window.confirm(
        "¿Estás seguro de que querés borrar este barbero?"
        );
        if (!confirmed) return;

        try {
        const response = await fetch(`/barberos/${cuil}`, {
            method: "DELETE",
        });

        if (response.ok) {
            alert("Barbero eliminado correctamente.");
            // Actualizar la lista de barberos removiendo el barbero eliminado
            setBarberos(barberos.filter((barbero) => barbero.cuil !== cuil));
        } else if (response.status === 404) {
            alert("Barbero no encontrado.");
        } else {
            alert("Error al borrar el barbero.");
        }
        } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Error de conexión con el servidor.");
        }
    };

    return (
        <div className="index-barberos">
        <h1>Listado de barberos</h1>
        {barberos.length === 0 ? (
            <p>No hay barberos disponibles.</p>
        ) : (
            <ul>
            {barberos.map((barbero, idx) => (
                <li key={idx}>
                <Link to={`/barberos/${barbero.cuil}`}>
                    Cuil Barbero: {barbero.cuil}
                </Link>
                ; - Nombre: {barbero.apellido}, {barbero.nombre}
                <br />
                <Link
                    to={`/barberos/modificarBarbero/${barbero.cuil}`}
                    style={{ marginLeft: "20px", color: "blue" }}
                >
                    Modificar
                </Link>
                <button
                    className="button button--danger"
                    onClick={() => handleDelete(barbero.cuil)}
                >
                    Borrar
                </button>
                </li>
            ))}
            </ul>
        )}
        </div>
    );
    };

    export default IndexBarberos;
