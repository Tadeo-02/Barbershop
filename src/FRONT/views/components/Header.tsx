import { useEffect, useRef, useState } from "react";
import { FaBars } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./login/AuthContext.tsx";
import styles from "./header.module.css";
// import logoBarber from "../../public/images/logoBarber.png";

const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "AbortError");

function Header() {
  const [open, setOpen] = useState(false);
  const { user, userType, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [clientCategory, setClientCategory] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = () => {
    setOpen((prev) => {
      if (prev) {
        menuButtonRef.current?.focus();
      }
      return false;
    });
  };

  const toggleMenu = () => {
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        menuButtonRef.current?.focus();
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };
  //determino tipo de usuario
  const getHomeRoute = () => {
    if (!isAuthenticated) {
      return "/"; // Si no está autenticado, ir a landingPage
    }

    switch (userType) {
      case "admin":
        return "/Admin/HomePageAdmin";
      case "barber":
        return "/Barber/HomePageBarber";
      case "client":
        return "/client/home";
      default:
        return "/";
    }
  };

  useEffect(() => {
    if (!isAuthenticated || userType !== "client" || !user?.codUsuario) {
      setClientCategory(null);
      return;
    }

    const controller = new AbortController();
    const loadCategory = async () => {
      try {
        const response = await fetch(`/usuarios/profiles/${user.codUsuario}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setClientCategory("Sin categoría");
          return;
        }
        const data = await response.json().catch(() => null);
        const profile = data?.success && data.data ? data.data : data;
        const category = profile?.categoriaActual?.nombreCategoria;
        setClientCategory(category || "Sin categoría");
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setClientCategory("Sin categoría");
      }
    };

    void loadCategory();
    return () => controller.abort();
  }, [isAuthenticated, userType, user?.codUsuario]);
  return (
    <nav>
      <div className={styles.header}>
        {/* logo a la izquierda */}
        <div>
          <Link to={getHomeRoute()} aria-label="Ir al inicio">
            <img
              src="/images/logoBarber.png"
              alt="logo-barber"
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
        <div className={styles.menuButton}>
          <button
            className={styles.button}
            onClick={toggleMenu}
            aria-label={open ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            type="button"
            ref={menuButtonRef}
          >
            <FaBars />
          </button>
        </div>
      </div>

      {/* sidebar */}
      <aside
        id="mobile-menu"
        className={`${styles.sidebar} ${
          open ? styles.sidebarOpen : styles.sidebarClosed
        }`}
        aria-hidden={!open}
      >
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Menu</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeMenu}
              aria-label="Cerrar menu"
            >
              X
            </button>
          </div>

          <div className={styles.sidebarBody}>
            {!isAuthenticated ? (
              <nav className={styles.navSection} aria-label="Autenticacion">
                <ul className={styles.menuList}>
                  <li className={styles.menuItem}>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className={styles.menuLink}
                    >
                      <span className={styles.menuLabel}>Iniciar Sesión</span>
                    </Link>
                  </li>
                  <li className={styles.menuItem}>
                    <Link
                      to="/signUp"
                      onClick={closeMenu}
                      className={styles.menuLink}
                    >
                      <span className={styles.menuLabel}>Registrarse</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            ) : (
              <>
                <div className={styles.userCard}>
                  <span className={styles.userName}>
                    Bienvenido, {user?.nombre || user?.email}
                  </span>
                  <span className={styles.userMeta}>
                    {userType === "client"
                      ? `Categoría: ${clientCategory || "Sin categoría"}`
                      : `Tipo: ${userType}`}
                  </span>
                </div>

                <nav className={styles.navSection} aria-label="Navegacion">
                  <ul className={styles.menuList}>
                    {userType === "client" && (
                      <>
                        <li className={styles.menuItem}>
                          <Link
                            to="/client/home"
                            onClick={closeMenu}
                            className={styles.menuLink}
                          >
                            <img
                              src="/images/home.png"
                              alt="Inicio"
                              className={styles.menuIcon}
                            />
                            <span className={styles.menuLabel}>Inicio</span>
                          </Link>
                        </li>
                        <li className={styles.menuItem}>
                          <Link
                            to="/client/profile"
                            onClick={closeMenu}
                            className={styles.menuLink}
                          >
                            <img
                              src="/images/user.png"
                              alt="Mi Perfil"
                              className={styles.menuIcon}
                            />
                            <span className={styles.menuLabel}>Mi Perfil</span>
                          </Link>
                        </li>
                        <li className={styles.menuItem}>
                          <Link
                            to="/client/appointments"
                            onClick={closeMenu}
                            className={styles.menuLink}
                          >
                            <img
                              src="/images/calendar.png"
                              alt="Mis Turnos"
                              className={styles.menuIcon}
                            />
                            <span className={styles.menuLabel}>Mis Turnos</span>
                          </Link>
                        </li>
                      </>
                    )}

                    {userType === "barber" && (
                      <>
                        <li className={styles.menuItem}>
                          <Link
                            to="/Barber/HomePageBarber"
                            onClick={closeMenu}
                            className={styles.menuLink}
                          >
                            <img
                              src="/images/home.png"
                              alt="Inicio"
                              className={styles.menuIcon}
                            />
                            <span className={styles.menuLabel}>Inicio</span>
                          </Link>
                        </li>
                        <li className={styles.menuItem}>
                          <Link
                            to="/Barber/myAppointments"
                            onClick={closeMenu}
                            className={styles.menuLink}
                          >
                            <img
                              src="/images/calendar.png"
                              alt="Mis Turnos"
                              className={styles.menuIcon}
                            />
                            <span className={styles.menuLabel}>Mis turnos</span>
                          </Link>
                        </li>
                        <li className={styles.menuItem}>
                          <Link
                            to="/Barber/myAvailability"
                            onClick={closeMenu}
                            className={styles.menuLink}
                          >
                            <img
                              src="/images/calendar.png"
                              alt="Mis Ausencias"
                              className={styles.menuIcon}
                            />
                            <span className={styles.menuLabel}>
                              Mis Ausencias
                            </span>
                          </Link>
                        </li>
                      </>
                    )}

                    {userType === "admin" && (
                      <li className={styles.menuItem}>
                        <Link
                          to="/Admin/HomePageAdmin"
                          onClick={closeMenu}
                          className={styles.menuLink}
                        >
                          <img
                            src="/images/home.png"
                            alt="Inicio"
                            className={styles.menuIcon}
                          />
                          <span className={styles.menuLabel}>Inicio</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className={styles.sidebarFooter}>
              <button
                className={styles.logoutButton}
                onClick={handleLogout}
                type="button"
              >
                <img
                  src="/images/logOut.png"
                  alt="Cerrar Sesión"
                  className={styles.menuIcon}
                />
                <span className={styles.menuLabel}>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {open && (
        <div
          className={styles.overlay}
            onClick={closeMenu}
          onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") closeMenu();
          }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú"
        />
      )}
    </nav>
  );
}

export default Header;
