import IndexTypeOfHaircut from "../../components/Admin/typeOfHaircut/indexTypeOfHaircut.tsx";
import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function HairCutTypesPage() {
  return (
    <>
      <Link
        to="../../typeOfHaircut/createTypeOfHaircut"
        className={`${styles.button} ${styles.buttonPrimary}`}
      >
        CREAR TIPO DE CORTE
      </Link>
      <IndexTypeOfHaircut />
    </>
  );
}

export default HairCutTypesPage;
