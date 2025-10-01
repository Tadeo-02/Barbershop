// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login.tsx";
import CreateUser from "./components/login/createUser.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { Toaster } from "react-hot-toast"; //libreria toaster para alerts
import HomePageClient from "./pages/Client/HomePageClient.tsx";
import CategoriesPage from "./pages/Admin/CategoriesPage.tsx";
import BarbersPage from "./pages/Admin/BarbersPage.tsx";
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
import ProfilePage from "./pages/Client/ProfilePage.tsx";
// import TurnsPage from "./pages/Admin/TurnsPage.tsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="appContainer">
          <Header />
          <main className="mainContent">
            <Routes>
              <Route path="/" element={<Home />}>
                esto lo agregué para poder ver la home del cliente directamente{" "}
              </Route>
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
              <Route path="/client/profile" element={<ProfilePage />} />

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

              {/* <Route
                path="/Admin/TurnsPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <TurnsPage />
                  </ProtectedRoute>
                }
              /> */}


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
