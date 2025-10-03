import IndexBarbers from "../../components/Admin/barbers/indexBarbers.tsx";
import styles from "./HomePageAdmin.module.css";
import { Routes, Route, Link } from "react-router-dom";
import ShowBarbers from "../../components/Admin/barbers/showBarbers.tsx";
import CreateBarbers from "../../components/Admin/barbers/createBarbers.tsx";
import UpdateBarbers from "../../components/Admin/barbers/updateBarbers.tsx";
//importamos los modulos y los navegamos con router dentro de la pagina

function BarbersPage() {
  return (
    <>
      <Link
        to="createBarbers"
        className={`${styles.button} ${styles.buttonPrimary}`}
      >
        CREAR BARBERO
      </Link>

      <Routes>
        <Route index element={<IndexBarbers />} />
        <Route path="createBarbers" element={<CreateBarbers />} />
        <Route path="updateBarber/:codUsuario" element={<UpdateBarbers />} />
        <Route path=":codUsuario" element={<ShowBarbers />} />
      </Routes>{" "}
    </>
  );
}

export default BarbersPage;
