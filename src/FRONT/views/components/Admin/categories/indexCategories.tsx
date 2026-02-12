import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./categories.module.css";
import toast from "react-hot-toast"
import { CategorySchema  } from "../../../../../BACK/Schemas/categoriesSchema";
import type { z } from "zod";

// Inferir tipo desde el schema existente en BACK y mapear a los nombres que usa el frontend
type Categoria = z.infer<typeof CategorySchema>;

type DeleteAction = "promote" | "demote";

interface DeleteClientSummary {
  codCliente: string;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  stats: {
    total: number;
    cancelados: number;
  };
}

interface DeleteContext {
  categoria: {
    codCategoria: string;
    nombreCategoria: string;
  };
  clientes: DeleteClientSummary[];
}

const CATEGORY_RANK = ["Vetado", "Inicial", "Medium", "Premium"] as const;


const IndexCategories = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true); // loading
  const [deleteContext, setDeleteContext] = useState<DeleteContext | null>(null);
  const [deleteDecisions, setDeleteDecisions] = useState<Record<string, DeleteAction>>({});
  const [deleteBusy, setDeleteBusy] = useState(false);

  const getCategoryIndex = (name: string) => {
    const normalized = name.trim().toLowerCase();
    return CATEGORY_RANK.findIndex(
      (cat) => cat.toLowerCase() === normalized
    );
  };

  const getPromoteTarget = (name: string) => {
    const index = getCategoryIndex(name);
    return index === -1 ? null : CATEGORY_RANK[index + 1] || null;
  };

  const getDemoteTarget = (name: string) => {
    const index = getCategoryIndex(name);
    return index === -1 ? null : CATEGORY_RANK[index - 1] || null;
  };

  const promoteTarget = useMemo(() => {
    if (!deleteContext) return null;
    return getPromoteTarget(deleteContext.categoria.nombreCategoria);
  }, [deleteContext]);

  const demoteTarget = useMemo(() => {
    if (!deleteContext) return null;
    return getDemoteTarget(deleteContext.categoria.nombreCategoria);
  }, [deleteContext]);

  useEffect(() => {
    // llama al backend para obtener las categorias
    fetch("/categorias")
      .then((res) => res.json())
      .then((data) => {
        setCategorias(data); // data debe ser un array de categorias
        console.log("Categorías existentes:", data);
      })
      .catch((error) => {
        console.error("Error al obtener categorias:", error);
        toast.error("Error al cargar las categorías", { duration: 2000 }); 
      })
      .finally(() => {
        setLoading(false); // cortar loading
      });
  }, []);

  // loading state
  if (loading) {
    return <div className={styles.loadingState}>Cargando categorías...</div>;
  }

  const fetchDeleteContext = async (codCategoria: string) => {
    const response = await fetch(`/categorias/${codCategoria}/clients`);
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return (json && json.data) || json;
  };

  const handleDelete = async (codCategoria: string) => {
    try {
      const context = await fetchDeleteContext(codCategoria);

      if (!context || !Array.isArray(context.clientes)) {
        throw new Error("Respuesta inesperada del servidor");
      }

      if (context.clientes.length === 0) {
        return showSimpleDeleteConfirm(codCategoria);
      }

      showDeleteOptions(context);
    } catch (error) {
      console.error("Error al obtener clientes de la categoria:", error);
      toast.error("No se pudo obtener los clientes de la categoría", {
        duration: 2500,
      });
    }
  };

  const showSimpleDeleteConfirm = (codCategoria: string) => {
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
          minWidth: "350px",
          padding: "24px",
        },
      }
    );
  };

  const showDeleteOptions = (context: DeleteContext) => {
    const promoteTargetName = getPromoteTarget(context.categoria.nombreCategoria);
    const demoteTargetName = getDemoteTarget(context.categoria.nombreCategoria);

    if (!promoteTargetName && !demoteTargetName) {
      toast.error("La categoría no tiene un ranking valido", { duration: 2500 });
      return;
    }

    toast(
      (t) => (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Esta categoría tiene {context.clientes.length} clientes.
          </p>
          <p style={{ margin: "0 0 16px 0", color: "#4a5568" }}>
            ¿Qué querés hacer con ellos?
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "stretch",
            }}
          >
            {promoteTargetName && (
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  confirmedDelete(context.categoria.codCategoria, {
                    action: "promote_all",
                  });
                }}
                style={{
                  background: "#2f855a",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                Subir a todos a {promoteTargetName}
              </button>
            )}
            {demoteTargetName && (
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  confirmedDelete(context.categoria.codCategoria, {
                    action: "demote_all",
                  });
                }}
                style={{
                  background: "#b83280",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                Bajar a todos a {demoteTargetName}
              </button>
            )}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                const defaultDecision: DeleteAction =
                  promoteTargetName ? "promote" : "demote";
                const initialDecisions: Record<string, DeleteAction> = {};
                context.clientes.forEach((cliente) => {
                  initialDecisions[cliente.codCliente] = defaultDecision;
                });
                setDeleteDecisions(initialDecisions);
                setDeleteContext(context);
              }}
              style={{
                background: "#2b6cb0",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
              }}
            >
              Decidir uno por uno
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: "#718096",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
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
          minWidth: "380px",
          padding: "20px",
        },
      }
    );
  };

  const confirmedDelete = async (
    codCategoria: string,
    payload?: { action: string; perClient?: Array<{ codCliente: string; decision: DeleteAction }> }
  ) => {
    // Mostrar toast de carga y guardar el id para poder actualizarlo
    const toastId = toast.loading("Eliminando categoría...");

    try {
      const response = await fetch(`/categorias/${codCategoria}`, {
        method: "DELETE",
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const responseBody = await response.json().catch(() => null);

      if (response.ok) {
        // Reemplazar el toast de carga por uno de éxito que se cierre automáticamente
        toast.success("Categoría eliminada correctamente", {
          id: toastId,
          duration: 2000,
        });

        // ✅ Actualizar la lista removiendo el eliminado (usar functional update para evitar closures stale)
        setCategorias((prev) =>
          prev.filter((categoria) => categoria.codCategoria !== codCategoria)
        );
        setDeleteContext(null);
      } else if (response.status === 404) {
        toast.error("Categoría no encontrada", { id: toastId, duration: 2000 });
      } else {
        const message = responseBody?.message || "Error al borrar la categoría";
        toast.error(message, { id: toastId, duration: 2500 });
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast.error("Error de conexión con el servidor", { id: toastId, duration: 2000 });
    }
  };

  return (
      <>
      <Link
        to="createCategories"
        className={`${styles.button} ${styles.buttonPrimary}`}
      >
        CREAR CATEGORÍA
      </Link>
    <div className={styles.indexCategories}>
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
              idx // idx como key backup
            ) => (
              <li key={categoria.codCategoria || idx}>
                {/* MOSTRAR DATOS CATEGORIA */}
                <div className={styles.categoryInfo}>
                  <div className={styles.categoryTitle}>
                    {categoria.nombreCategoria}
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
                    to={`/Admin/CategoriesPage/${categoria.codCategoria}`}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Ver Info
                  </Link>
                  <Link
                    to={`/Admin/CategoriesPage/updateCategories/${categoria.codCategoria}`}
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
    {deleteContext && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalCard}>
          <div className={styles.modalHeader}>
            <h3>Reasignar clientes</h3>
            <p>
              Categoría a eliminar: <strong>{deleteContext.categoria.nombreCategoria}</strong>
            </p>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.modalHint}>
              Revisá las estadísticas y elegí si subir o bajar a cada cliente.
            </div>
            <div className={styles.modalTable}>
              <div className={styles.modalRowHeader}>
                <span>Cliente</span>
                <span>Turnos</span>
                <span>Cancelados</span>
                <span>Decision</span>
              </div>
              {deleteContext.clientes.map((cliente) => (
                <div className={styles.modalRow} key={cliente.codCliente}>
                  <div>
                    <div className={styles.modalName}>
                      {cliente.nombre} {cliente.apellido}
                    </div>
                    <div className={styles.modalMuted}>DNI: {cliente.dni}</div>
                  </div>
                  <div>{cliente.stats.total}</div>
                  <div>{cliente.stats.cancelados}</div>
                  <div>
                    <select
                      className={styles.modalSelect}
                      value={deleteDecisions[cliente.codCliente] || (promoteTarget ? "promote" : "demote")}
                      onChange={(e) =>
                        setDeleteDecisions((prev) => ({
                          ...prev,
                          [cliente.codCliente]: e.target.value as DeleteAction,
                        }))
                      }
                    >
                      {promoteTarget && (
                        <option value="promote">Subir a {promoteTarget}</option>
                      )}
                      {demoteTarget && (
                        <option value="demote">Bajar a {demoteTarget}</option>
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button
              className={`${styles.button} ${styles.buttonDanger}`}
              type="button"
              disabled={deleteBusy}
              onClick={async () => {
                if (!deleteContext) return;
                setDeleteBusy(true);
                const perClient = deleteContext.clientes.map((cliente) => ({
                  codCliente: cliente.codCliente,
                  decision:
                    deleteDecisions[cliente.codCliente] ||
                    (promoteTarget ? "promote" : "demote"),
                }));
                await confirmedDelete(deleteContext.categoria.codCategoria, {
                  action: "per_client",
                  perClient,
                });
                setDeleteBusy(false);
              }}
            >
              Aplicar decisiones y eliminar
            </button>
            <button
              className={styles.button}
              type="button"
              disabled={deleteBusy}
              onClick={() => setDeleteContext(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default IndexCategories;
