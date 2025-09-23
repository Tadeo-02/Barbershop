import IndexSchedules from "../../components/schedules/indexSchedules.tsx";
import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function SchedulesPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Horarios</h1>
        <p className={styles.pageDescription}>
          Administra los horarios disponibles para reservas de turnos
        </p>
      </div>

      <div className={styles.actionButtonsContainer}>
        <Link
          to="/schedules/createSchedules"
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          + CREAR HORARIO
        </Link>
        <Link
          to="/schedules/indexSchedules"
          className={`${styles.button} ${styles.buttonSecondary}`}
        >
          📋 VER TODOS LOS HORARIOS
        </Link>
      </div>

      <div className={styles.contentContainer}>
        <IndexSchedules />
      </div>
    </div>
  );
}

export default SchedulesPage;
