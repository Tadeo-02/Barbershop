// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import MainTurnos from "./components/turnos/mainTurnos.tsx";
import CreateTurnos from "./components/turnos/createTurnos.tsx";
import IndexTurnos from "./components/turnos/indexTurnos.tsx";
import ShowTurno from "./components/turnos/showTurnos.tsx";
import DeleteTurnos from "./components/turnos/deleteTurnos.tsx";
import ModificarTurno from "./components/turnos/modificarTurno.tsx";
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
            <Route path="/deleteTurnos" element={<DeleteTurnos />} />
            <Route path="/login" element={<Login />} />
            <Route path="/indexTurnos" element={<IndexTurnos />} />
            <Route path="/turnos/:codTurno" element={<ShowTurno />} />
            <Route path="/turnos/modificarTurno/:codTurno" element={<ModificarTurno />}/>
            {/* con el '*' indico que tiene rutas anidadas*/}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
