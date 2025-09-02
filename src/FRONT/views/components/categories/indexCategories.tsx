import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast";

interface Categoria {
  codCategoria: string; // ✅ String según schema
  nombreCategoria: string; // ✅ Nombre correcto del campo
  descCategoria: string;
  descuentoCorte: number; // ✅ Añadir campos faltantes
  descuentoProducto: number; // ✅ Añadir campos faltantes
}

const IndexCategorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true); // ✅ loading inicial

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
        toast.error("Error al cargar las categorías"); // ✅ Toast en lugar de console
      })
      .finally(() => {
        setLoading(false); // ✅ Termina el loading
      });
  }, []);

  // ✅ loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando categorías...</div>;
  }

  const handleDelete = async (codCategoria: string) => {
    // ✅ String en lugar de number
    // ✅ Toast personalizado para confirmación (igual que barbers)
    toast(
      (t) => (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            ¿Estás seguro de que querés borrar esta categoría?
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmedDelete(codCategoria);
              }}
              style={{
                background: "#e53e3e",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                minWidth: "120px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#c53030";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e53e3e";
              }}
            >
              Eliminar
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: "#718096",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                minWidth: "120px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4a5568";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#718096";
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "350px", // botones mas anchos
          padding: "24px",
        },
      }
    );
  };

  const confirmedDelete = async (codCategoria: string) => {
    const toastId = toast.loading("Eliminando categoría...");

    try {
      const response = await fetch(`/categorias/${codCategoria}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Categoría eliminada correctamente", { id: toastId });
        // ✅ Actualizar la lista removiendo el eliminado
        setCategorias(
          categorias.filter(
            (categoria) => categoria.codCategoria !== codCategoria
          )
        );
      } else if (response.status === 404) {
        toast.error("Categoría no encontrada", { id: toastId });
      } else {
        toast.error("Error al borrar la categoría", { id: toastId });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
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
          {categorias.map(
            (
              categoria,
              idx // ✅ Usar idx como key backup
            ) => (
              <li key={categoria.codCategoria || idx}>
                <div className={styles.categoryInfo}>
                  <div className={styles.categoryTitle}>
                    {categoria.nombreCategoria} {/* ✅ Campo correcto */}
                  </div>
                  <div className={styles.categoryCode}>
                    Código: {categoria.codCategoria}
                  </div>
                  <div className={styles.categoryDescription}>
                    {categoria.descCategoria}
                  </div>
                  {/* ✅ Mostrar descuentos */}
                  <div className={styles.categoryDiscounts}>
                    <span>Descuento Corte: {categoria.descuentoCorte}%</span>
                    <span>
                      Descuento Producto: {categoria.descuentoProducto}%
                    </span>
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <Link
                    to={`/categorias/${categoria.codCategoria}`} // ✅ Ruta para ver detalles
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Ver Detalles
                  </Link>
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
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default IndexCategorias;
