import { useAuth } from "../../login/AuthContext";
import { useEffect, useState } from "react";
import styles from "./profile.module.css";
// import toast from "react-hot-toast";
import { Link } from "react-router-dom";

//! ADAPTAR A MOBILE
interface CategoriaActual {
  codCategoria: string;
  nombreCategoria: string;
  descCategoria: string;
  descuentoCorte: number;
  descuentoProducto: number;
  fechaInicio: string;
}

interface UserProfile {
  codUsuario: string;
  dni: string;
  cuil: string | null;
  codSucursal: string | null;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  categoriaActual: CategoriaActual | null;
}

const MyProfile = () => {
  const { user, userType } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        console.log(
          "🔥 PROFILE DEBUG - Fetching profile for user:",
          user.codUsuario
        );

        const response = await fetch(`/usuarios/profiles/${user.codUsuario}`);

        console.log("🔥 PROFILE DEBUG - Response status:", response.status);
        console.log("🔥 PROFILE DEBUG - Response ok:", response.ok);

        if (!response.ok) {
          console.warn(
            "🔥 PROFILE DEBUG - Response not ok, using fallback data"
          );
          setProfile({ ...user, categoriaActual: null });
          return;
        }

        const data = await response.json();
        console.log("🔥 PROFILE DEBUG - Raw response data:", data);

        if (data.success && data.data) {
          console.log(
            "🔥 PROFILE DEBUG - Setting profile with data.data:",
            data.data
          );
          console.log(
            "🔥 PROFILE DEBUG - categoriaActual in data.data:",
            data.data.categoriaActual
          );
          setProfile(data.data);
        } else {
          console.log(
            "🔥 PROFILE DEBUG - No success/data structure, checking raw data:",
            data
          );
          if (data && typeof data === "object") {
            console.log(
              "🔥 PROFILE DEBUG - Setting profile with raw data:",
              data
            );
            console.log(
              "🔥 PROFILE DEBUG - categoriaActual in raw data:",
              data.categoriaActual
            );
            setProfile(data);
          } else {
            console.warn(
              "🔥 PROFILE DEBUG - No profile data received, using fallback"
            );
            setProfile({ ...user, categoriaActual: null });
          }
        }
      } catch (error) {
        console.error("🔥 PROFILE DEBUG - Error al obtener el perfil:", error);
        setProfile({ ...user, categoriaActual: null });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Agregar console.log cuando cambie el profile
  useEffect(() => {
    if (profile) {
      console.log("🔥 PROFILE DEBUG - Profile state updated:", profile);
      console.log(
        "🔥 PROFILE DEBUG - categoriaActual:",
        profile.categoriaActual
      );
    }
  }, [profile]);

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

  // Console.log cada vez que se renderiza
  console.log("🔥 PROFILE DEBUG - Rendering with displayUser:", displayUser);
  console.log(
    "🔥 PROFILE DEBUG - displayUser.categoriaActual:",
    displayUser.categoriaActual
  );

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
            <strong>Categoría:</strong>{" "}
            {displayUser.categoriaActual
              ? displayUser.categoriaActual.nombreCategoria
              : "Sin categoría asignada"}
            {displayUser.categoriaActual && (
              <div className={styles.actionButtons}>
                <Link
                  to={`/categorias/${displayUser.categoriaActual.codCategoria}`}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  Ver Beneficios
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
