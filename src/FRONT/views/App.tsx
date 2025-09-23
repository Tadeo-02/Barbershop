// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login.tsx";
import CreateUser from "./components/login/createUser.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import MainTurns from "./components/appointments/mainAppointments.tsx";
import Home from "./components/clients/home/home.tsx";

import CreateAppointment from "./components/appointments/createAppointments.tsx";
import IndexAppointment from "./components/appointments/indexAppointments.tsx";
import ShowAppointment from "./components/appointments/showAppointment.tsx";
import UpdateAppointments from "./components/appointments/updateAppointment.tsx";

import CreateCategories from "./components/categories/createCategories.tsx";
import UpdateCategories from "./components/categories/updateCategories.tsx";
import IndexCategories from "./components/categories/indexCategories.tsx";
import ShowCategories from "./components/categories/showCategories.tsx";

import CreateBarbers from "./components/barbers/createBarbers.tsx";
import IndexBarbers from "./components/barbers/indexBarbers.tsx";
import ShowBarbers from "./components/barbers/showBarbers.tsx";
import UpdateBarbers from "./components/barbers/updateBarbers.tsx";

import CreateSchedules from "./components/schedules/createSchedules.tsx";
import IndexSchedules from "./components/schedules/indexSchedules.tsx";
// import ShowSchedules from "./components/schedules/showSchedules.tsx";
import UpdateSchedules from "./components/schedules/updateSchedules.tsx";

import CreateTypeOfHaircut from "./components/typeOfHaircut/createTypeOfHaircut.tsx";
import IndexTypeOfHaircut from "./components/typeOfHaircut/indexTypeOfHaircut.tsx";
import UpdateTypeOfHaircut from "./components/typeOfHaircut/updateTypeOfHaircut.tsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Branches from "./components/clients/branches.tsx";
import BarbersByBranch from "./components/clients/barbersByBranch.tsx";
import AppointmentsByBarber from "./components/clients/appointmentsByBarber.tsx";
import ScheduleByBranch from "./components/clients/scheduleByBranch.tsx";

import { Toaster } from "react-hot-toast"; //libreria toaster para alerts
import HomePageAdmin from "./pages/Admin/HomePageAdmin.tsx";
import CategoriesPage from "./pages/Admin/CategoriesPage.tsx";
import BarbersPage from "./pages/Admin/BarbersPage.tsx";
import SchedulesPage from "./pages/Admin/SchedulesPage.tsx";
import HairCutTypesPage from "./pages/Admin/HaircutTypesPage.tsx";
import TurnsPage from "./pages/Admin/AppointmentsPage.tsx";

function App() {
  return (
    <Router>
      <div className="appContainer">
        <Header />
        <main className="mainContent">
          <Routes>
            <Route path="/" element={<HomePageAdmin />} />
            {/* <Route path="/" element={<Home />} />esto lo agregué para poder ver la home del cliente directamente */}
            <Route path="/branches" element={<Branches />} />
            {/* Selección de barbero primero */}
            <Route
              path="/branches/:branchId/barbers"
              element={<BarbersByBranch />}
            />
            <Route
              path="/barbers/:barberId/appointments"
              element={<AppointmentsByBarber />}
            />
            {/* Selección de horario primero */}
            <Route
              path="/branches/:branchId/schedule"
              element={<ScheduleByBranch />}
            />
            <Route
              path="/branches/:branchId/schedule/:scheduleId/barbers"
              element={<BarbersByBranch />}
            />

            {/* <Route path="/turnos/mainTurnos" element={<MainTurns />} />{" "}
            <Route path="/createTurnos" element={<CreateTurns />} />
            <Route path="/login" element={<Login />} />
            <Route path="/indexTurnos" element={<IndexTurns />} />
            <Route path="/turnos/:codTurno" element={<ShowTurn />} />
            <Route
              path="/turnos/modificarTurno/:codTurno"
              element={<UpdateTurn />}
            /> */}

            <Route path="/Admin/CategoriesPage" element={<CategoriesPage />} />
            <Route path="/Admin/BarbersPage" element={<BarbersPage />} />
            <Route path="/Admin/SchedulesPage" element={<SchedulesPage />} />
            <Route
              path="/Admin/HaircutTypesPage"
              element={<HairCutTypesPage />}
            />
            <Route path="/Admin/TurnsPage" element={<TurnsPage />} />

            <Route
              path="/categories/createCategories"
              element={<CreateCategories />}
            />
            <Route
              path="/categories/indexCategories"
              element={<IndexCategories />}
            />
            <Route
              path="/categories/:codCategoria"
              element={<ShowCategories />}
            />
            <Route
              path="/categories/updateCategories/:codCategoria"
              element={<UpdateCategories />}
            />

            <Route path="/barbers/createBarbers" element={<CreateBarbers />} />
            <Route path="/barbers/indexBarbers" element={<IndexBarbers />} />
            <Route path="/barbers/:codUsuario" element={<ShowBarbers />} />
            <Route
              path="/barbers/updateBarber/:codUsuario"
              element={<UpdateBarbers />}
            />

            <Route
              path="/schedules/createSchedules"
              element={<CreateSchedules />}
            />
            <Route
              path="/schedules/indexSchedules"
              element={<IndexSchedules />}
            />
            <Route
              path="/schedules/:codHorario"
              element={
                <div>Show Schedule Details - Component not implemented yet</div>
              }
            />
            <Route
              path="/schedules/updateSchedules/:codHorario"
              element={<UpdateSchedules />}
            />

            <Route
              path="/categories/createCategories"
              element={<CreateCategories />}
            />
            <Route
              path="/categories/indexCategories"
              element={<IndexCategories />}
            />
            <Route
              path="/categories/:codCategoria"
              element={<ShowCategories />}
            />
            <Route
              path="/categories/updateCategories/:codCategoria"
              element={<UpdateCategories />}
            />

            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<CreateUser />} />

            <Route
              path="/typeOfHaircut/createTypeOfHaircut"
              element={<CreateTypeOfHaircut />}
            />
            <Route
              path="/typeOfHaircut/createTypeOfHaircut"
              element={<CreateTypeOfHaircut />}
            />
            <Route
              path="/typeOfHaircut/indexTypeOfHaircut"
              element={<IndexTypeOfHaircut />}
            />
            <Route
              path="/typeOfHaircut/updateTypeOfHaircut/:codCorte"
              element={<UpdateTypeOfHaircut />}
            />

            {/* con el '*' indico que tiene rutas anidadas*/}
          </Routes>
        </main>
        <Footer />
        {/* Alerts de Toaster */}
        <Toaster
          toastOptions={{
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
            top: "55%",
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
