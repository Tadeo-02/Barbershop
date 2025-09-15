// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import MainTurns from "./components/turns/mainTurns.tsx";
import Home from "./components/clients/home/home.tsx";
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
import Branches from "./components/clients/branches.tsx";
import BarbersByBranch from "./components/clients/barbersByBranch.tsx";
import AppointmentsByBarber from "./components/clients/appointmentsByBarber.tsx";

import { Toaster } from "react-hot-toast"; //libreria toaster para alerts

function App() {
  return (
    <Router>
      <div className="appContainer">
        <Header />
        <main className="mainContent">
          <Routes>
            <Route path="/" element={<MainTurns />} />
            {/*<Route path="/" element={<Home />} /> esto lo agregué para poder ver la home del cliente directamente*/}
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/:branchId" element={<BarbersByBranch />} />
            <Route path="/barbers/:barberId/appointments" element={<AppointmentsByBarber />} />
            {/* <Route path="/turnos/mainTurnos" element={<MainTurns />} />{" "}
            <Route path="/createTurnos" element={<CreateTurns />} />
            <Route path="/login" element={<Login />} />
            <Route path="/indexTurnos" element={<IndexTurns />} />
            <Route path="/turnos/:codTurno" element={<ShowTurn />} />
            <Route
              path="/turnos/modificarTurno/:codTurno"
              element={<UpdateTurn />}
            /> */}
            <Route path="/categories/createCategories" element={<CreateCategories />}/>
            <Route path="/categories/indexCategories" element={<IndexCategories />}/>
            <Route path="/categories/:codCategoria" element={<ShowCategories />}/>
            <Route path="/categories/updateCategories/:codCategoria" element={<UpdateCategories />}/>


            <Route path="/barbers/createBarbers" element={<CreateBarbers />} />
            <Route path="/barbers/indexBarbers" element={<IndexBarbers />} />
            <Route path="/barbers/:codUsuario" element={<ShowBarbers />} />
            <Route path="/barbers/updateBarber/:codUsuario" element={<UpdateBarbers />}/>
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
        {/* Alerts de Toaster */}
        <Toaster
          position="center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "500",
              padding: "20px 30px",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
              minWidth: "400px",
              textAlign: "center",
            },
            success: {
              duration: 2000,
              style: {
                background: "#38a169",
              },
            },
            error: {
              duration: 1500,
              style: {
                background: "#e53e3e",
              },
            },
          }}
          containerStyle={{
            // Subido más - de 40% a 35%
            top: "15%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            position: "fixed",
            zIndex: 9999,
          }}
        />
      </div>
    </Router>
  );
}

export default App;
