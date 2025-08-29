import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./categories.module.css";

interface Categoria {
  codCategoria: number;
  nomCategoria: string;
  descCategoria: string;
}

const IndexCategorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    // Llama al backend para obtener las categorias
    fetch("/categorias")
      .then((res) => res.json())
      .then((data) => {
        setCategorias(data); // data debe ser un array de categorias
        console.log("Categorías existentes:", data);
      })
      .catch((error) => {
        console.error("Error al obtener categorias:", error);
      });
  }, []);

  const handleDelete = async (codCategoria: number) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés borrar esta categoría?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/categorias/${codCategoria}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Categoría eliminada correctamente.");
        // Actualizar la lista removiendo el eliminado
        setCategorias(
          categorias.filter(
            (categoria) => categoria.codCategoria !== codCategoria
          )
        );
      } else if (response.status === 404) {
        alert("Categoria no encontrada.");
      } else {
        alert("Error al borrar la categoría.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className={styles.indexCategorias}>
      <h2>Gestión de Categorías</h2>
      {categorias.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay categorías disponibles.</p>
        </div>
      ) : (
        <ul>
          {categorias.map((categoria) => (
            <li key={categoria.codCategoria}>
              <div className={styles.categoryInfo}>
                <div className={styles.categoryTitle}>
                  {categoria.nomCategoria}
                </div>
                <div className={styles.categoryCode}>
                  Código: {categoria.codCategoria}
                </div>
                <div className={styles.categoryDescription}>
                  {categoria.descCategoria}
                </div>
              </div>
              <div className={styles.actionButtons}>
                <Link
                  to={`/categorias/modificarCategorias/${categoria.codCategoria}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Modificar
                </Link>
                <button
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(categoria.codCategoria)}
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

export default IndexCategorias;
