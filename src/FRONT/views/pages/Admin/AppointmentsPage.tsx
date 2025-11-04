import IndexAppointments from "../../components/Client/appointments/indexAppointments.tsx";
import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function AppointmentsPage() {
  return (
    <>
    <Link
      to="../../appointments/createAppointments"
      className={`${styles.button} ${styles.buttonPrimary}`}
    >
      CREAR TURNOS
    </Link>
    <IndexAppointments />
    </>
  )
}

export default AppointmentsPage;

//que es esto????