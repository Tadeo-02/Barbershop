import { Routes, Route } from "react-router-dom";
import IndexBranches from "../../components/admin/branches/indexBranches.tsx";
import ShowBranches from "../../components/admin/branches/showBranches.tsx";
import CreateBranches from "../../components/admin/branches/createBranches.tsx";
import UpdateBranches from "../../components/admin/branches/updateBranches.tsx";

function BranchesPage() {
  return (
    <Routes>
      <Route index element={<IndexBranches />} />
      <Route path="createBranches" element={<CreateBranches />} />
      <Route path="updateBranches/:codSucursal" element={<UpdateBranches />} />
      <Route path=":codSucursal" element={<ShowBranches />} />
    </Routes>
  );
}

export default BranchesPage;
