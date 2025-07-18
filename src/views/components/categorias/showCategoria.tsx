import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from './categorias.module.css';

interface Categoria {
    codCategoria: number;
    nomCategoria: string;
    descCategoria: string;
}

const ShowCategoria = () => {
    const { codCategoria } = useParams(); // si lo pasás como parámetro de URL
    const [categoria, setCategoria] = useState<Categoria | null>(null);

    useEffect(() => {
        fetch(`/categorias/${codCategoria}`)
            .then((res) => res.json())
            .then((data) => setCategoria(data))
            .catch((err) => console.error("Error al obtener el categoria:", err));
    }, [codCategoria]);

    if (!categoria) return (
        <div className={styles.loadingState}>
            Cargando categoría...
        </div>
    );

    return (
        <div className={styles.formContainer}>
            <h1>Detalles de la Categoría</h1>
            <div className={styles.categoryInfo}>
                <div className={styles.categoryTitle}>
                    {categoria.nomCategoria}
                </div>
                <div className={styles.categoryCode}>
                    Código: {categoria.codCategoria}
                </div>
                <div className={styles.categoryDescription}>
                    Descripción: {categoria.descCategoria}
                </div>
            </div>
        </div>
    );
};

export default ShowCategoria;
