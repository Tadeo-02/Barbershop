import { Routes, Route } from "react-router-dom";
import IndexTypeOfHaircut from "../../components/admin/typeOfHaircut/indexTypeOfHaircut.tsx";
import CreateTypeOfHaircut from "../../components/admin/typeOfHaircut/createTypeOfHaircut.tsx";
import UpdateTypeOfHaircut from "../../components/admin/typeOfHaircut/updateTypeOfHaircut.tsx";

function HairCutTypesPage() {
  return (
    <Routes>
      <Route index element={<IndexTypeOfHaircut />} />
      <Route path="createTypeOfHaircut" element={<CreateTypeOfHaircut />} />
      <Route
        path="updateTypeOfHaircut/:codCorte"
        element={<UpdateTypeOfHaircut />}
      />
    </Routes>
  );
}

export default HairCutTypesPage;
