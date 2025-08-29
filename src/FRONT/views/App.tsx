// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import MainTurns from "./components/turns/mainTurns.tsx";
import CreateTurns from "./components/turns/createTurns.tsx";
import IndexTurns from "./components/turns/indexTurns.tsx";
import ShowTurn from "./components/turns/showTurns.tsx";
import UpdateTurn from "./components/turns/updateTurn.tsx";

import CreateCategories from "./components/categories/createCategories.tsx";
import UpdateCategories from "./components/categories/updateCategories.tsx";
import IndexCategories from "./components/categories/indexCategories.tsx";
import ShowCategories from "./components/categories/showCategories.tsx";

import CreateBarbers from "./components/barbers/createBarbers.tsx";
import IndexBarbers from "./components/barbers/indexBarbers.tsx";
import ShowBarbers from "./components/barbers/showBarbers.tsx";
import UpdateBarbers from "./components/barbers/updateBarbers.tsx";
import CreateTypeOfHaircut from "./components/typeOfHaircut/createTypeOfHaircut.tsx";
import IndexTypeOfHaircut from "./components/typeOfHaircut/indexTypeOfHaircut.tsx";
import UpdateTypeOfHaircut from "./components/typeOfHaircut/updateTypeOfHaircut.tsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="appContainer">
        <Header />
        <main className="mainContent">
          <Routes>
            <Route path="/" element={<MainTurns />} />
            <Route path="/turnos/mainTurnos" element={<MainTurns />} />{" "}
            <Route path="/createTurnos" element={<CreateTurns />} />
            <Route path="/login" element={<Login />} />
            <Route path="/indexTurnos" element={<IndexTurns />} />
            <Route path="/turnos/:codTurno" element={<ShowTurn />} />
            <Route
              path="/turnos/modificarTurno/:codTurno"
              element={<UpdateTurn />}
            />
            <Route
              path="/categorias/createCategorias"
              element={<CreateCategories />}
            />
            <Route
              path="/categorias/modificarCategorias/:codCategoria"
              element={<UpdateCategories />}
            />
            <Route
              path="/categorias/indexCategorias"
              element={<IndexCategories />}
            />
            <Route
              path="/categorias/:codCategoria"
              element={<ShowCategories />}
            />
            <Route path="/barbers/createBarbers" element={<CreateBarbers />} />
            <Route path="/barbers/indexBarbers" element={<IndexBarbers />} />
            <Route path="/barbers/:cuil" element={<ShowBarbers />} />
            <Route
              path="/barbers/updateBarber/:cuil"
              element={<UpdateBarbers />}
            />
            <Route
              path="/tipoCortes/createTipoCortes"
              element={<CreateTypeOfHaircut />}
            />
            <Route
              path="/tipoCortes/createTipoCortes"
              element={<CreateTypeOfHaircut />}
            />
            <Route
              path="/tipoCortes/indexTipoCortes"
              element={<IndexTypeOfHaircut />}
            />
            <Route
              path="/tipoCortes/modificarTipoCorte/:codCorte"
              element={<UpdateTypeOfHaircut />}
            />
            {/* con el '*' indico que tiene rutas anidadas*/}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
