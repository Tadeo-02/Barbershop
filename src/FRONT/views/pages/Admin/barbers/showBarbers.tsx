import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { apiFetch } from "../../../lib/apiFetch";
import logger from "../../../lib/logger";
import type { Sucursal } from "../../../../types/branch";
import type { UserResponse } from "../../../../types/user";

const ShowBarbers = () => {
  const { codUsuario } = useParams();
  const [barbero, setBarbero] = useState<UserResponse | null>(null);
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // first we get the barber data
        const barberoResponse = await apiFetch(`/usuarios/${codUsuario}`);

        if (barberoResponse.ok) {
          const barberoData = await barberoResponse.json();
          setBarbero(barberoData);

          // then we get the branch data if the barber has a branch assigned
          if (barberoData.codSucursal) {
            const sucursalResponse = await apiFetch(
              `/sucursales/${barberoData.codSucursal}`,
            );

            if (sucursalResponse.ok) {
              const sucursalData = await sucursalResponse.json();
              setSucursal(sucursalData);
            } else {
              logger.error("Error al obtener la sucursal");
              toast.error("Error al cargar los datos de la sucursal");
            }
          }
        } else {
          logger.error("Error al obtener el barbero");
          toast.error("Error al cargar los datos del barbero");
        }
      } catch (err) {
        logger.error("Error al obtener datos:", err);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [codUsuario]);

  if (loading) {
    return <div className={styles.loadingState}>Cargando barbero...</div>;
  }

  if (!barbero) {
    return (
      <div className={styles.emptyState}>
        <p>No se encontró el barbero.</p>
        <Link
          to="/Admin/BarbersPage"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Volver a Barberos
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Detalles del Barbero</h1>

      <div className={styles.detailsContainer}>
        {/* barber details */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información Personal</h3>
          <div className={styles.detailItem}>
            <span className={styles.barberoDetails}>Nombre Completo: </span>
            <span className={styles.detailValue}>
              {barbero.apellido}, {barbero.nombre}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.barberoDetails}>DNI: </span>
            <span className={styles.detailValue}>{barbero.dni}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.barberoDetails}>CUIL: </span>
            <span className={styles.detailValue}>{barbero.cuil}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.barberoDetails}>Teléfono: </span>
            <span className={styles.detailValue}>{barbero.telefono}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.barberoDetails}>Email: </span>
            <span className={styles.detailValue}>{barbero.email}</span>
          </div>
        </div>

        {/* branch info*/}
        <br />
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Sucursal Asignada</h3>
          {sucursal ? (
            <>
              <div className={styles.detailItem}>
                <span className={styles.barberoDetails}>Nombre: </span>
                <span className={styles.detailValue}>{sucursal.nombre}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.barberoDetails}>Dirección: </span>
                <span className={styles.detailValue}>
                  {sucursal.calle} {sucursal.altura}
                </span>
              </div>
            </>
          ) : (
            <div className={styles.noData}>
              <p>No se pudo cargar la información de la sucursal</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.detailsActionButtons}>
        <Link
          to={`/Admin/BarbersPage/updateBarber/${barbero.codUsuario}`}
          className={`${styles.button} ${styles.buttonSuccess}`}
        >
          Editar Barbero
        </Link>
        <Link
          to="/Admin/BarbersPage"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Volver
        </Link>
      </div>
    </div>
  );
};

export default ShowBarbers;
