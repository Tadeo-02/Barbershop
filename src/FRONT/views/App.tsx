// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login.tsx";
import CreateUser from "./components/login/createUser.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";

import CreateCategories from "./components/Admin/categories/createCategories.tsx";
import UpdateCategories from "./components/Admin/categories/updateCategories.tsx";
import IndexCategories from "./components/Admin/categories/indexCategories.tsx";
import ShowCategories from "./components/Admin/categories/showCategories.tsx";

import CreateBarbers from "./components/Admin/barbers/createBarbers.tsx";
import IndexBarbers from "./components/Admin/barbers/indexBarbers.tsx";
import ShowBarbers from "./components/Admin/barbers/showBarbers.tsx";
import UpdateBarbers from "./components/Admin/barbers/updateBarbers.tsx";


import CreateTypeOfHaircut from "./components/Admin/typeOfHaircut/createTypeOfHaircut.tsx";
import IndexTypeOfHaircut from "./components/Admin/typeOfHaircut/indexTypeOfHaircut.tsx";
import UpdateTypeOfHaircut from "./components/Admin/typeOfHaircut/updateTypeOfHaircut.tsx";

import CreateSchedules from "./components/schedules/createSchedules.tsx";
import IndexSchedules from "./components/schedules/indexSchedules.tsx";
// import ShowSchedules from "./components/schedules/showSchedules.tsx";
import UpdateSchedules from "./components/schedules/updateSchedules.tsx";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { Toaster } from "react-hot-toast"; //libreria toaster para alerts
import HomePageClient from "./pages/Client/HomePageClient.tsx";
import CategoriesPage from "./pages/Admin/CategoriesPage.tsx";
import BarbersPage from "./pages/Admin/BarbersPage.tsx";
import SchedulesPage from "./pages/Admin/SchedulesPage.tsx";
import HairCutTypesPage from "./pages/Admin/HaircutTypesPage.tsx";
import HomePageBarber from "./pages/Barber/HomePageBarber.tsx";
import { AuthProvider } from "./components/login/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

// Importaciones para las rutas de branches y navegación
import Home from "./components/Client/home/home.tsx";
import Branches from "./components/Client/branches.tsx";
import BarbersByBranch from "./components/Client/barbersByBranch.tsx";
import AppointmentsByBarber from "./components/Client/appointmentsByBarber.tsx";
import ScheduleByBranch from "./components/Client/scheduleByBranch.tsx";
// import TurnsPage from "./pages/Admin/TurnsPage.tsx";

function App() {
  return (

    <Router>
      <div className="appContainer">
        <Header />
        <main className="mainContent">
          <Routes>
            {/* <Route path="/" element={<HomePageAdmin />} /> */}
            <Route path="/" element={<Home />} /*>esto lo agregué para poder ver la home del cliente directamente*/ />
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

              {/* Ruta temporal para testing */}
              <Route
                path="/test"
                element={
                  <div
                    style={{
                      padding: "20px",
                      background: "red",
                      color: "white",
                    }}
                  >
                    TEST ROUTE WORKING
                  </div>
                }
              />

              {/* Rutas del cliente para navegación por sucursales y barberos */}
              <Route path="/branches" element={<Branches />} />
              <Route
                path="/branches/:branchId/barbers"
                element={<BarbersByBranch />}
              />
              <Route
                path="/barbers/:barberId/appointments"
                element={<AppointmentsByBarber />}
              />
              <Route
                path="/branches/:branchId/schedule"
                element={<ScheduleByBranch />}
              />
              <Route
                path="/branches/:branchId/schedule/:scheduleId/barbers"
                element={<BarbersByBranch />}
              />

              {/* Rutas protegidas por tipo de usuario */}
              <Route
                path="/barber"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <HomePageBarber />
                  </ProtectedRoute>
                }
              />

              <Route path="/client" element={<HomePageClient />} />

              {/* Rutas de administración protegidas */}
              <Route
                path="/Admin/CategoriesPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/Admin/BarbersPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BarbersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/Admin/HaircutTypesPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <HairCutTypesPage />
                  </ProtectedRoute>
                }
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

              {/* <Route
                path="/Admin/TurnsPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <TurnsPage />
                  </ProtectedRoute>
                }
              /> */}

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

              <Route
                path="/barbers/createBarbers"
                element={<CreateBarbers />}
              />
              <Route path="/barbers/indexBarbers" element={<IndexBarbers />} />
              <Route path="/barbers/:codUsuario" element={<ShowBarbers />} />
              <Route
                path="/barbers/updateBarber/:codUsuario"
                element={<UpdateBarbers />}
              />

              <Route path="/login" element={<Login />} />
              <Route path="/signUp" element={<CreateUser />} />

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
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              position: "fixed",
              zIndex: 9999,
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
