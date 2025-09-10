import IndexTurns from "../../components/turns/indexTurns.tsx";
import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function TurnsPage() {
  return (
    <>
    <Link
      to="../../turns/createTurns"
      className={`${styles.button} ${styles.buttonPrimary}`}
    >
      CREAR TURNOS
    </Link>
    <IndexTurns />
    </>
  )
}

export default TurnsPage;