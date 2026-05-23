import { Routes, Route } from "react-router-dom";
import ShowCategories from "../../components/admin/categories/showCategories.tsx";
import IndexCategories from "../../components/admin/categories/indexCategories.tsx";
import UpdateCategories from "../../components/admin/categories/updateCategories.tsx";
import CreateCategories from "../../components/admin/categories/createCategories.tsx";

function CategoriesPage() {
  return (
    <Routes>
      <Route index element={<IndexCategories />} />
      <Route path="createCategories" element={<CreateCategories />} />
      <Route
        path="updateCategories/:codCategoria"
        element={<UpdateCategories />}
      />
      <Route path=":codCategoria" element={<ShowCategories />} />
    </Routes>
  );
}

export default CategoriesPage;
