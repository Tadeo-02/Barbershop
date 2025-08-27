import { useState } from "react";
import { FaBars } from "react-icons/fa";
import { Link } from "react-router-dom";
import styles from "./header.module.css";
import logoBarber from "../../public/images/logoBarber.png";

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <nav>
      <div className={styles.header}>
        {/* logo a la izquierda */}
        <div>
          <Link to="/" aria-label="Ir al inicio">
            <img src={logoBarber} alt="logo-barber" className={styles.logo} />
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
          <li>
            <Link to="/" onClick={() => setOpen(false)}>
              Inicio
            </Link>
          </li>
          <li>
            <Link
              to="/productos/mainProductos.tsx"
              onClick={() => setOpen(false)}
            >
              Productos
            </Link>
          </li>
          <li>
            <Link to="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
          </li>
        </ul>
      </div>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} />
      )}
    </nav>
  );
}

export default Header;
