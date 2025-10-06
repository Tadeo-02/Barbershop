import styles from "./HomePageAdmin.module.css";
import { Routes, Route, Link } from "react-router-dom";
import IndexBranches from "../../components/Admin/branches/indexBranches.tsx";
import ShowBranches from "../../components/Admin/branches/showBranches.tsx";
import CreateBranches from "../../components/Admin/branches/createBranches.tsx";
import UpdateBranches from "../../components/Admin/branches/updateBranches.tsx";

function BranchesPage() {
  return (
    <>
    <Link
      to="createBranches"
      className={`${styles.button} ${styles.buttonPrimary}`}
    >
      CREAR SUCURSAL
    </Link>
    <Routes>
      <Route index element={<IndexBranches />} />
      <Route path="createBranches" element={<CreateBranches />} />
      <Route path="updateBranches/:codSucursal" element={<UpdateBranches />} />
      <Route path=":codSucursal" element={<ShowBranches />} />
    </Routes>{" "}
    </>
  )
}

export default BranchesPage;