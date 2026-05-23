import IndexBarbers from "../../components/admin/barbers/indexBarbers.tsx";
import { Routes, Route } from "react-router-dom";
import ShowBarbers from "../../components/admin/barbers/showBarbers.tsx";
import CreateBarbers from "../../components/admin/barbers/createBarbers.tsx";
import UpdateBarbers from "../../components/admin/barbers/updateBarbers.tsx";
//importamos los modulos y los navegamos con router dentro de la pagina

function BarbersPage() {
  return (
    <Routes>
      <Route index element={<IndexBarbers />} />
      <Route path="createBarbers" element={<CreateBarbers />} />
      <Route path="updateBarber/:codUsuario" element={<UpdateBarbers />} />
      <Route path=":codUsuario" element={<ShowBarbers />} />
    </Routes>
  );
}

export default BarbersPage;
