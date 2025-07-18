import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from './categorias.module.css';

const createCategorias: React.FC = () => {
    const navigate = useNavigate();
    const [nomCategoria, setNomCategoria] = useState("");
    const [descCategoria, setDescCategoria] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validación básica
        if (!nomCategoria.trim() || !descCategoria.trim()) {
            alert("Por favor, completa todos los campos");
            return;
        }
        
        try {
            console.log("Enviando POST a /categorias con:", { nomCategoria, descCategoria });
            const response = await fetch("/categorias", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nomCategoria, descCategoria }),
            });
            
            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);

            const text = await response.text();
            console.log("Respuesta cruda del backend:", text);

            let data;
            if (text) {
                try {
                    data = JSON.parse(text);
                    console.log("Datos parseados:", data);
                } catch (parseError) {
                    console.error("Error al parsear JSON:", parseError);
                    console.error("Texto recibido:", text);
                    alert(`Error del servidor: ${text}`);
                    return;
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
                navigate("/categorias/indexCategorias");
            } else {
                alert((data.message || `Error ${response.status}`));
            }
        } catch (error) {
            console.error("Error en handleSubmit:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            alert("Error de conexión: " + errorMessage);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1>Crear Nueva Categoría</h1>
            <form className="form" onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="nomCategoria">
                        Nombre de la Categoría:
                    </label>
                    <input
                        className={styles.formInput}
                        type="text"
                        name="nomCategoria"
                        id="nomCategoria"
                        value={nomCategoria}
                        onChange={(e) => setNomCategoria(e.target.value)}
                        placeholder="Ej: Premium"
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="descCategoria">
                        Descripción:
                    </label>
                    <textarea
                        className={styles.formTextarea}
                        name="descCategoria"
                        id="descCategoria"
                        value={descCategoria}
                        onChange={(e) => setDescCategoria(e.target.value)}
                        placeholder="Describe los beneficios y características de esta categoría..."
                        rows={4}
                        required
                    />
                </div>
                <button className={`${styles.button} ${styles.buttonSuccess}`} type="submit">
                    Guardar Categoría
                </button>
            </form>
        </div>
    );

};
export default createCategorias;