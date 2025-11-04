import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function HomePageAdmin() {
  return (
    <div className={styles.adminDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>Panel de Administración</h1>
        <p>Selecciona la sección que deseas administrar</p>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Botón para Categorías */}
        <Link
          to="/Admin/CategoriesPage"
          className={`${styles.dashboardCard} ${styles.categoriesCard}`}
        >
          <div className={styles.cardIcon}>
            <i className="fas fa-tags"></i>
          </div>
          <h3>Categorías</h3>
          <p>Gestionar categorías de servicios</p>
        </Link>

        {/* Botón para Barberos */}
        <Link
          to="/Admin/BarbersPage"
          className={`${styles.dashboardCard} ${styles.barbersCard}`}
        >
          <div className={styles.cardIcon}>
            <i className="fas fa-users"></i>
          </div>
          <h3>Barberos</h3>
          <p>Administrar barberos y personal</p>
        </Link>

        {/* Botón para Tipos de Corte */}
        <Link
          to="/Admin/HaircutTypesPage"
          className={`${styles.dashboardCard} ${styles.haircutCard}`}
        >
          <div className={styles.cardIcon}>
            <i className="fas fa-cut"></i>
          </div>
          <h3>Tipos de Corte</h3>
          <p>Gestionar tipos de cortes disponibles</p>
        </Link>

        {/* Botón para Sucursales (cuarto botón) */}
        <Link
          to="/Admin/BranchesPage"
          className={`${styles.dashboardCard} ${styles.branchesCard}`}
        >
          <div className={styles.cardIcon}>
            <i className="fas fa-store"></i>
          </div>
          <h3>Sucursales</h3>
          <p>Administrar sucursales y ubicaciones</p>
        </Link>
        
        {/*Boton para Listado de clientes */}
        <Link
          to="/Admin/ClientsPage"
          className={`${styles.dashboardCard} ${styles.clientsCard}`}
        >
          <div className={styles.cardIcon}>
            <i className="fas fa-users"></i>
          </div>
          <h3>Clientes</h3>
          <p>Ver listado de clientes</p>
        </Link>
      </div>
    </div>
  );
}

export default HomePageAdmin;
