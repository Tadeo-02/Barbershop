import IndexCategorias from "../../components/categories/indexCategories.tsx";
import styles from "./HomePageAdmin.module.css";
import { Link } from "react-router-dom";

function CategoriesPage() {
  return (
    <>
    <Link
      to="../../categories/createCategories"
      className={`${styles.button} ${styles.buttonPrimary}`}
    >
      CREAR CATEGORÍA
    </Link>
    <IndexCategorias />
    </>
  )
}

export default CategoriesPage;