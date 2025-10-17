import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./typeOfHaircut.module.css";
import toast from "react-hot-toast";

interface TipoCorte {
  codCorte: string;
  nombreCorte: string;
  valorBase: number;
}

const UpdateTypeOfHaircut: React.FC = () => {
  const { codCorte } = useParams<{ codCorte: string }>();
  const navigate = useNavigate();
  const [corte, setCorte] = useState<TipoCorte | null>(null);
  const [nombreCorte, setNombreCorte] = useState("");
  const [valorBase, setValorBase] = useState<number | "">("");

  useEffect(() => {
    let isMounted = true; // Flag para controlar si el componente está montado

    const fetchCorte = async () => {
      const toastId = toast.loading("Cargando datos del barbero...");

      try {
        const response = await fetch(`/tipoCortes/${codCorte}`);

        if (!isMounted) return; // Si el componente se desmontó, no continuar

        if (response.ok) {
          const data = await response.json();
          setCorte(data);
          setNombreCorte(data.nombreCorte);
          setValorBase(data.valorBase);
        } else if (response.status === 404) {
          toast.error("Tipo de corte no encontrado", { id: toastId });
          navigate("/Admin/HaircutTypesPage"); // redirigir si no se encuentra
        } else {
          toast.error("Error al cargar los datos del tipo de corte", {
            id: toastId,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching tipo de corte:", error);
        toast.error("Error de conexión", { id: toastId });
      }
    };

    fetchCorte();

    // Cleanup function para evitar duplicación
    return () => {
      isMounted = false;
    };
  }, [codCorte, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Actualizando tipo de corte...");

    try {
      const response = await fetch(`/tipoCortes/${corte?.codCorte}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombreCorte, valorBase }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Barbero actualizado exitosamente", {
          id: toastId,
        });
        navigate("/Admin/HaircutTypesPage"); // redirigir a la lista de tipo de cortes
      } else {
        toast.error(data.message || "Error al actualizar barbero", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error modificando Tipo de Corte:", error);
      toast.error("Error de conexión", { id: toastId });
    }
  };

  if (!corte) {
    return <div className={styles.loadingState}>Cargando tipo de corte...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Editar Tipo de Corte</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="nombreCorte">
            Nombre del corte:
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="nombreCorte"
            id="nombreCorte"
            value={nombreCorte}
            maxLength={50}
            required
            onChange={(e) => setNombreCorte(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="valorBase">
            Valor base:
          </label>
          <input
            className={styles.formInput}
            type="number"
            name="valorBase"
            id="valorBase"
            value={valorBase}
            min={0}
            required
            onChange={(e) =>
              setValorBase(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.buttonSuccess}`}
            type="submit"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateTypeOfHaircut;
