// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import MainTurnos from "./components/turnos/mainTurnos.tsx";
import CreateTurnos from "./components/turnos/createTurnos.tsx";
import IndexTurnos from "./components/turnos/indexTurnos.tsx";
import ShowTurno from "./components/turnos/showTurnos.tsx";
import ModificarTurno from "./components/turnos/modificarTurno.tsx";
import CreateCategorias from "./components/categorias/createCategorias.tsx";
import DeleteCategoria from "./components/categorias/deleteCategorias.tsx";
import ModificarCategoria from "./components/categorias/modificarCategorias.tsx";
import CreateBarberos from "./components/Barberos/createBarberos.tsx";
import IndexBarberos from "./components/Barberos/indexBarberos.tsx";
import ShowBarbero from "./components/Barberos/showBarberos.tsx";
import UpdateBarbero from "./components/Barberos/updateBarberos.tsx";
import CreateTipoCortes from "./components/tipoCortes/createTipoCortes.tsx";
import IndexTipoCortes from "./components/tipoCortes/indexTipoCortes.tsx";
import ModificarTipoCorte from "./components/tipoCortes/modificarTipoCorte.tsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Routes>
            <Route path="/" element={<MainTurnos />} />
            <Route path="/turnos/mainTurnos" element={<MainTurnos />} />{" "}
            <Route path="/createTurnos" element={<CreateTurnos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/indexTurnos" element={<IndexTurnos />} />
            <Route path="/turnos/:codTurno" element={<ShowTurno />} />
            <Route path="/turnos/modificarTurno/:codTurno" element={<ModificarTurno />}/>
            <Route path="/createCategorias" element={<CreateCategorias />} />
            <Route path= "/deleteCategorias" element={<DeleteCategoria />} />
            <Route path="/categorias/modificarCategorias/:codCategoria" element={<ModificarCategoria />} />
            <Route path="/barberos/createBarberos" element={<CreateBarberos />} />
            <Route path="/barberos/indexBarberos" element={<IndexBarberos />} />
            <Route path="/barberos/:cuil" element={<ShowBarbero />} />
            <Route path="/barberos/modificarBarbero/:cuil" element={<UpdateBarbero />} />
            <Route path="/tipoCortes/createTipoCortes" element={<CreateTipoCortes />} />
            <Route path="/tipoCortes/createTipoCortes" element={<CreateTipoCortes />} />
            <Route path="/tipoCortes/indexTipoCortes" element={<IndexTipoCortes />} />
            <Route path="/tipoCortes/modificarTipoCorte/:codCorte" element={<ModificarTipoCorte />} />
            {/* con el '*' indico que tiene rutas anidadas*/}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
