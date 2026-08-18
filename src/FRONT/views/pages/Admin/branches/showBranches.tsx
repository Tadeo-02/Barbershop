import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./branches.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../../BACK/Schemas/branchesSchema";
import { UserBaseSchemaExport } from "../../../../../BACK/Schemas/usersSchema";
import { apiFetch } from "../../../lib/apiFetch";

type Sucursal = z.infer<typeof BranchWithIdSchema>;
type Usuario = z.infer<typeof UserBaseSchemaExport> & { codUsuario?: string };

const ShowBranches = () => {
  const { codSucursal } = useParams();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [barberos, setBarberos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBarberos, setLoadingBarberos] = useState(true);

  useEffect(() => {
    if (!codSucursal) return;

    setLoading(true);
    setLoadingBarberos(true);

    const fetchData = async () => {
      try {
        const [sucursalRes, usuariosRes] = await Promise.all([
          apiFetch(`/sucursales/${codSucursal}`),
          apiFetch(`/usuarios/branch/${codSucursal}`),
        ]);

        const [sucursalData, usuariosResp] = await Promise.all([
          sucursalRes.json(),
          usuariosRes.json(),
        ]);

        // branches route returns the entity directly
        setSucursal(sucursalData);

        // users route returns { success: true, data: [...] }
        const usuarios = Array.isArray(usuariosResp?.data)
          ? (usuariosResp.data as Usuario[])
          : [];

        // Filter only barbers: it has 'cuil' and is different from '1' 
        const soloBarberos = usuarios.filter(
          (u) => u.cuil !== null && u.cuil !== undefined && u.cuil !== "1",
        );

        setBarberos(soloBarberos);
      } catch (err) {
        console.error("Error al obtener datos de sucursal o barberos:", err);
        toast.error("Error al cargar los datos de la sucursal o barberos");
      } finally {
        setLoading(false);
        setLoadingBarberos(false);
      }
    };

    fetchData();
  }, [codSucursal]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando sucursal...</div>;
  }

  if (!sucursal) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontró la sucursal.</p>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Detalles de la sucursal</h1>
      <div className={styles.sucursalInfo}>
        <div className={styles.sucursalTitle}>{sucursal.nombre}</div>
        <div className={styles.sucursalCalle}>Calle: {sucursal.calle}</div>
        <div className={styles.sucursalAltura}>Altura: {sucursal.altura}</div>
      </div>

      <div className={styles.barberosSection}>
        <h2>Barberos en esta sucursal</h2>
        {loadingBarberos ? (
          <p>Cargando barberos...</p>
        ) : barberos.length === 0 ? (
          <p>No hay barberos asignados a esta sucursal.</p>
        ) : (
          <ul className={styles.barberList}>
            {barberos.map((b) => (
              <li key={b.codUsuario ?? b.email} className={styles.barberItem}>
                <strong>
                  {b.apellido}, {b.nombre}
                </strong>
                <div>Tel: {b.telefono}</div>
                {b.email && <div>Email: {b.email}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <br />
      <div className={styles.createButtonWrapper}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary} ${styles.createButton}`}
          onClick={() => navigate("/Admin/BranchesPage")}
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default ShowBranches;
