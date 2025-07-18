import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from './barberos.module.css';

interface Barbero {
    cuil: string;
    nombre: string;
    apellido: string;
    telefono: string;
}

const UpdateBarbero: React.FC = () => {
    const { cuil } = useParams<{ cuil: string }>();
    const navigate = useNavigate();
    const [barbero, setBarbero] = useState<Barbero | null>(null);
    const [nuevoCuil, setNuevoCuil] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [telefono, setTelefono] = useState("");

    useEffect(() => {
        const fetchBarbero = async () => {
        try {
            const response = await fetch(`/barberos/${cuil}`);
            if (response.ok) {
            const data = await response.json();
            setBarbero(data);
            setNuevoCuil(data.cuil);
            setNombre(data.nombre);
            setApellido(data.apellido);
            setTelefono(data.telefono);
            } else {
            console.error("Failed to fetch barbero");
            }
        } catch (error) {
            console.error("Error fetching barbero:", error);
        }
        };

        fetchBarbero();
    }, [cuil]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
        const response = await fetch(`/barberos/${barbero?.cuil}?_method=PUT`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ nuevoCuil, nombre, apellido, telefono }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            navigate("/barberos/indexBarberos"); // Redirigir a la lista de barberos
        } else {
            alert(data.message);
        }
        } catch (error) {
        console.error("Error updating barbero:", error);
        alert("Error de conexión");
        }
    };

    if (!barbero) {
        return (
            <div className={styles.loadingState}>
                Cargando barbero...
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <h1>Editar Barbero</h1>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="cuil">
                        CUIL:
                    </label>
                    <input
                        className={styles.formInput}
                        type="text"
                        name="cuil"
                        id="cuil"
                        value={nuevoCuil}
                        onChange={(e) => setNuevoCuil(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="nombre">
                        Nombre:
                    </label>
                    <input
                        className={styles.formInput}
                        type="text"
                        name="nombre"
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="apellido">
                        Apellido:
                    </label>
                    <input
                        className={styles.formInput}
                        type="text"
                        name="apellido"
                        id="apellido"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="telefono">
                        Teléfono:
                    </label>
                    <input
                        className={styles.formInput}
                        type="text"
                        name="telefono"
                        id="telefono"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                </div>
                <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit">
                    Guardar Cambios
                </button>
            </form>
        </div>
    );
};

export default UpdateBarbero;
