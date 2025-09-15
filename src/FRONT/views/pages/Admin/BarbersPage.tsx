import IndexBarbers from "../../components/barbers/indexBarbers.tsx";
import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function BarbersPage() {
  return (
    <>
    <Link
      to="../../barbers/createBarbers"
      className={`${styles.button} ${styles.buttonPrimary}`}
    >
      CREAR BARBERO
    </Link>
    <IndexBarbers />
    </>
  )
}

export default BarbersPage;