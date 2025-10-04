import styles from "./HomePageAdmin.module.css";
import { Link, Routes, Route } from "react-router-dom";
import ShowCategories from "../../components/Admin/categories/showCategories.tsx";
import IndexCategories from "../../components/Admin/categories/indexCategories.tsx";
import UpdateCategories from "../../components/Admin/categories/updateCategories.tsx";
import CreateCategories from "../../components/Admin/categories/createCategories.tsx";

function CategoriesPage() {
  return (
    <>
      <Link
        to="createCategories"
        className={`${styles.button} ${styles.buttonPrimary}`}
      >
        CREAR CATEGORÍA
      </Link>
      <Routes>
        <Route index element={<IndexCategories />} />
        <Route path="createCategories" element={<CreateCategories />} />
        <Route path="updateCategories/:codCategoria" element={<UpdateCategories />} />
        <Route path=":codCategoria" element={<ShowCategories />} />
      </Routes>{" "}
    </>
  );
}

export default CategoriesPage;
