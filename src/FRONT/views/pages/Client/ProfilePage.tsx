import { useAuth } from "../../components/user/AuthContext";
import { useEffect, useState } from "react";
import styles from "./ProfilePage.module.css";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/apiFetch";
import logger from "../../lib/logger";
import type { UserProfile } from "../../../types/user";

const MyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(
          `/usuarios/profiles/${user.codUsuario}`,
        );

        if (!response.ok) {
          logger.warn(
            "Response not ok, using fallback data",
          );
          setProfile({ ...user, categoriaActual: null });
          return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {

          setProfile(data.data);
        } else {
          if (data && typeof data === "object") {

            setProfile(data);
          } else {
            logger.warn(
              "No profile data received, using fallback",
            );
            setProfile({ ...user, categoriaActual: null });
          }
        }
      } catch (error) {
        logger.error("Error al obtener el perfil:", error);
        setProfile({ ...user, categoriaActual: null });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className={styles.emptyState}>
        <p>No hay usuario autenticado.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  const displayUser = profile || { ...user, categoriaActual: null };
  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Mi Perfil</h1>

      <div className={styles.clienteInfo}>
        <div className={styles.clienteTitle}>
          {displayUser.apellido}, {displayUser.nombre}
        </div>

        <div className={styles.profileSection}>
          <h3>Información Personal</h3>
          <div className={styles.profileField}>
            <strong>DNI:</strong> {displayUser.dni}
          </div>

          <h3>Información de Contacto</h3>
          <div className={styles.profileField}>
            <strong>Teléfono:</strong> {displayUser.telefono}
          </div>
          <div className={styles.profileField}>
            <strong>Email:</strong> {displayUser.email}
          </div>

          <div className={styles.profileField}>
            <strong>Categoría:</strong>
            <div className={styles.profileValue}>
              <span>
                {displayUser.categoriaActual
                  ? displayUser.categoriaActual.nombreCategoria
                  : "Sin categoría asignada"}
              </span>
              {displayUser.categoriaActual && (
                <div className={styles.actionButtons}>
                  <Link
                    to={`/categorias/${displayUser.categoriaActual.codCategoria}`}
                    className={styles.actionLink}
                  >
                    Ver Beneficios
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
