import { useState } from "react";
import { FaBars } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./login/AuthContext.tsx";
import styles from "./header.module.css";
// import logoBarber from "../../public/images/logoBarber.png";

function Header() {
  const [open, setOpen] = useState(false);
  const { user, userType, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };
//determino tipo de usuario
  const getHomeRoute = () => {
    if (!isAuthenticated) {
      return "/"; // Si no está autenticado, ir a home general
    }

    switch (userType) {
      case "admin":
        return "/Admin/HomePageAdmin";
      case "barber":
        return "/barber";
      case "client":
        return "/client";
      default:
        return "/";
    }
  };
  return (
    <nav>
      <div className={styles.header}>
        {/* logo a la izquierda */}
        <div>
          <Link to={getHomeRoute()} aria-label="Ir al inicio">
            <img
              src="/images/logoBarber.png"
              // alt="logo-barber"
              className={styles.logo}
            />
          </Link>
        </div>

        {/* título  */}
        <div className={styles.titleContainer}>
          {/* estilos para que se vean una encima de la otra en móvil, lado a lado en desktop */}
          <h1 className={styles.title}>Mechas</h1>
          <h1 className={`${styles.title} ${styles.titleSecond}`}>
            Barbershop
          </h1>
        </div>

        {/* boton a la derecha */}
        <div>
          <button className={styles.button} onClick={() => setOpen(true)}>
            <FaBars style={{ fontSize: "2.2rem" }} />
          </button>
        </div>
      </div>

      {/* sidebar */}
      <div
        className={`${styles.sidebar} ${
          open ? styles["sidebar-open"] : styles["sidebar-closed"]
        }`}
        style={{
          width: "50vw",
          maxWidth: 400,
        }}
      >
        <button className={styles.closeButton} onClick={() => setOpen(false)}>
          Cerrar
        </button>
        <ul className={styles.sidebarMenu}>

          {/* Mostrar diferentes opciones según el estado de autenticación */}
          {!isAuthenticated ? (
            <>
              <li>
                <Link to="/login" onClick={() => setOpen(false)}>
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link to="/signUp" onClick={() => setOpen(false)}>
                  Registrarse
                </Link>
              </li>
            </>
          ) : (
            <>
              {/* Opciones para usuarios autenticados */}
              <li className={styles.dataUser}>
                <span style={{ color: "#ccc", fontSize: "0.9em" }}>
                  Bienvenido, {user?.nombre || user?.email}
                </span>
                <br />
                <span style={{ color: "#999", fontSize: "0.8em" }}>
                  Tipo: {userType}
                </span>
              </li>

          <li>
            <Link to="/" onClick={() => setOpen(false)}>
              Inicio
            </Link>
          </li>

              {/* Opciones específicas por tipo de usuario */}
              {userType === "client" && (
                <li>
                  <Link to="/client/profile" onClick={() => setOpen(false)}>
                    Mi Perfil
                  </Link>
                  <Link to="/client/appointments" onClick={() => setOpen(false)}>
                    Mis Turnos
                  </Link>
                </li>
              )}

              {userType === "barber" && (
                <li>
                  <Link to="/Barber/myAppointments" onClick={() => setOpen(false)}>
                    Mis turnos
                  </Link>
                </li>
              )}

              {userType === "admin" && (
                <li>
                  <Link
                    to="/Admin/CategoriesPage"
                    onClick={() => setOpen(false)}
                  >
                    Panel Admin
                  </Link>
                </li>
              )}

{/* lo saco para desarrollo
          <li>
            <Link
              to="/productos/mainProductos.tsx"
              onClick={() => setOpen(false)}
            >
              Productos
            </Link>
          </li>
*/}

              <li>
                <button className={styles.logOut}
                  onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </li>
            </>
          )}

        </ul>
      </div>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} />
      )}
    </nav>
  );
}

export default Header;
