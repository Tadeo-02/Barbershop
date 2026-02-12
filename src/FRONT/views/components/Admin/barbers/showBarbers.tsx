import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./barbers.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../../../BACK/Schemas/branchesSchema";
import { UserSchema } from "../../../../../BACK/Schemas/usersSchema";

type Barbero = z.infer<typeof UserSchema> & { codUsuario: string };

type Sucursal = z.infer<typeof BranchWithIdSchema>;

const ShowBarbers = () => {
  const { codUsuario } = useParams();
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Primero obtenemos los datos del barbero
        const barberoResponse = await fetch(`/usuarios/${codUsuario}`);

        if (barberoResponse.ok) {
          const barberoData = await barberoResponse.json();
          setBarbero(barberoData);

          // Luego obtenemos los datos de la sucursal del barbero
          if (barberoData.codSucursal) {
            const sucursalResponse = await fetch(
              `/sucursales/${barberoData.codSucursal}`
            );

            if (sucursalResponse.ok) {
              const sucursalData = await sucursalResponse.json();
              setSucursal(sucursalData);
            } else {
              console.error("Error al obtener la sucursal");
              toast.error("Error al cargar los datos de la sucursal");
            }
          }
        } else {
          console.error("Error al obtener el barbero");
          toast.error("Error al cargar los datos del barbero");
        }
      } catch (err) {
        console.error("Error al obtener datos:", err);
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
        {/* Información personal del barbero */}
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

        {/* Información de la sucursal */}
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
                <span className={styles.barberoDetails}>Código: </span>
                <span className={styles.detailValue}>
                  {sucursal.codSucursal}
                </span>
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

      {/* Botones de acción */}
      <div className={styles.actionButtons}>
        <Link
          to={`/Admin/BarbersPage/updateBarber/${barbero.codUsuario}`}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Editar Barbero
        </Link>
        <Link
          to="/Admin/BarbersPage"
          className={`${styles.button} ${styles.buttonSuccess}`}
        >
          Volver a Lista
        </Link>
      </div>
    </div>
  );
};

export default ShowBarbers;
