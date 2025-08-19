import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from './barberos.module.css';

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
        <div className={styles.indexBarberos}>
            <h2>Gestión de Barberos</h2>
            {barberos.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No hay barberos disponibles.</p>
                </div>
            ) : (
                <ul>
                    {barberos.map((barbero, idx) => (
                        <li key={idx}>
                            <div className={styles.barberoInfo}>
                                <div className={styles.barberoTitle}>
                                    {barbero.apellido}, {barbero.nombre}
                                </div>
                                <div className={styles.barberoCode}>
                                    CUIL: {barbero.cuil}
                                </div>
                            </div>
                            <div className={styles.actionButtons}>
                                <Link 
                                    to={`/barberos/${barbero.cuil}`}
                                    className={`${styles.button} ${styles.buttonPrimary}`}
                                >
                                    Ver Detalles
                                </Link>
                                <Link
                                    to={`/barberos/modificarBarbero/${barbero.cuil}`}
                                    className={`${styles.button} ${styles.buttonPrimary}`}
                                >
                                    Modificar
                                </Link>
                                <button
                                    className={`${styles.button} ${styles.buttonDanger}`}
                                    onClick={() => handleDelete(barbero.cuil)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
    };

    export default IndexBarberos;
