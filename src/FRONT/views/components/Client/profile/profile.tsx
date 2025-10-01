import { useAuth } from "../../login/AuthContext";
import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import toast from "react-hot-toast";

interface UserProfile {
  codUsuario: string;
  dni: string;
  cuil: string | null;
  codSucursal: string | null;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
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
      const response = await fetch(`/client/profiles/${user.codUsuario}`);

        if (!response.ok) {
          throw new Error("Error al obtener el perfil");
        }

        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
        } else {
          throw new Error(data.message || "Error al cargar el perfil");
        }
      } catch (error) {
        console.error("Error al obtener el perfil:", error);
        toast.error("Error al cargar los datos del perfil");
        // Si falla, usar los datos del contexto como fallback
        setProfile(user);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const getUserTypeLabel = () => {
    switch (userType) {
      case "admin":
        return "Administrador";
      case "barber":
        return "Barbero";
      case "client":
        return "Cliente";
      default:
        return "Usuario";
    }
  };

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

  // Usar los datos del perfil obtenidos del backend, o los del contexto como fallback
  const displayUser = profile || user;

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

          {displayUser.cuil && (
            <div className={styles.profileField}>
              <strong>CUIL:</strong> {displayUser.cuil}
            </div>
          )}

          <div className={styles.profileField}>
            <strong>Tipo de Usuario:</strong> {getUserTypeLabel()}
          </div>
        </div>

        <div className={styles.profileSection}>
          <h3>Información de Contacto</h3>
          <div className={styles.profileField}>
            <strong>Teléfono:</strong> {displayUser.telefono}
          </div>
          <div className={styles.profileField}>
            <strong>Email:</strong> {displayUser.email}
          </div>
        </div>

        {displayUser.codSucursal && (
          <div className={styles.profileSection}>
            <h3>Información Laboral</h3>
            <div className={styles.profileField}>
              <strong>Código de Sucursal:</strong> {displayUser.codSucursal}
            </div>
          </div>
        )}
      </div>

      <div className={styles.actionButtons}>
        <button
          className={styles.editButton}
          onClick={() => {
            console.log("Editar perfil clicked");
            toast.info("Función de editar perfil próximamente");
          }}
        >
          Editar Perfil
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
