// import { useState } from "react";
import "./App.css";
// Componentes Generales
import Login from "./pages/Auth/login.tsx";
import CreateUser from "./pages/Auth/createUser.tsx";
import ResetSecurity from "./pages/Auth/resetSecurity.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast"; //libreria toaster para alerts
import { AuthProvider } from "./components/user/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { AutoRedirect } from "./components/Redirect.tsx"; // puede ser que no haga falta
import LandingPage from "./pages/LandingPage.tsx";

// Client
import ProfilePage from "./pages/Client/ProfilePage.tsx";
import Home from "./pages/Client/Home.tsx";

import Branches from "./pages/Client/Branches.tsx";
import BarbersByBranch from "./pages/Client/BarbersByBranch.tsx";
import ScheduleByBranch from "./pages/Client/ScheduleByBranch.tsx";
import ClientAppointments from "./pages/Client/ClientAppointments.tsx";
import ReceiptViewer from "./pages/Client/appointments/receiptViewer.tsx";
import ShowCategories from "./pages/Admin/categories/showCategories.tsx";

// Barber
import HomePageBarber from "./pages/Barber/HomePageBarber.tsx";
// import HomeBarber from "./components/Barber/home/home.tsx";
import BarberAppointments from "./pages/Barber/appointments/barberAppointments.tsx";
import BranchAppointments from "./pages/Barber/appointments/branchAppointments.tsx";
import BarberReceiptViewer from "./pages/Barber/appointments/receiptViewer.tsx";
import BarberAvailability from "./pages/Barber/appointments/barberAvailability.tsx";
import MyAvailability from "./pages/Barber/appointments/myAvailability.tsx";

// Admin
import HomePageAdmin from "./pages/Admin/HomePageAdmin.tsx";
import IndexBarbers from "./pages/Admin/barbers/indexBarbers.tsx";
import CreateBarbers from "./pages/Admin/barbers/createBarbers.tsx";
import UpdateBarbers from "./pages/Admin/barbers/updateBarbers.tsx";
import ShowBarbers from "./pages/Admin/barbers/showBarbers.tsx";
import IndexBranches from "./pages/Admin/branches/indexBranches.tsx";
import CreateBranches from "./pages/Admin/branches/createBranches.tsx";
import UpdateBranches from "./pages/Admin/branches/updateBranches.tsx";
import ShowBranches from "./pages/Admin/branches/showBranches.tsx";
import IndexCategories from "./pages/Admin/categories/indexCategories.tsx";
import CreateCategories from "./pages/Admin/categories/createCategories.tsx";
import UpdateCategories from "./pages/Admin/categories/updateCategories.tsx";
import IndexTypeOfHaircut from "./pages/Admin/typeOfHaircut/indexTypeOfHaircut.tsx";
import CreateTypeOfHaircut from "./pages/Admin/typeOfHaircut/createTypeOfHaircut.tsx";
import UpdateTypeOfHaircut from "./pages/Admin/typeOfHaircut/updateTypeOfHaircut.tsx";
import IndexClients from "./pages/Admin/clients/indexClients.tsx";
import RentabilityByBranch from "./pages/Admin/RentabilityByBranch.tsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="appContainer">
          <Header />
          <main className="mainContent">
            <AutoRedirect />
            <Routes>
              <Route path="/" element={<LandingPage />} />
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
              <Route path="/Client/Home" element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <Home />
                </ProtectedRoute>
              }></Route>
              {/* Rutas del cliente para navegación por sucursales y barberos */}

              <Route
                path="/barbers/:codBarbero/appointments"
                element={<ScheduleByBranch />}
              />
              {/* Selección de horario primero */}
              <Route
                path="/branches/:codSucursal/schedule"
                element={<ScheduleByBranch />}
              />
              <Route
                path="/branches/:codSucursal/schedule/:scheduleId/barbers"
                element={<BarbersByBranch />}
              />
              <Route
                path="/client/appointments"
                element={
                  <ProtectedRoute allowedRoles={["client"]}>
                    <ClientAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/appointments/recibo/:codTurno"
                element={
                  <ProtectedRoute allowedRoles={["client"]}>
                    <ReceiptViewer />
                  </ProtectedRoute>
                }
              />
              <Route path="/branches" element={<Branches />} />
              <Route
                path="/branches/:codSucursal/barbers"
                element={<BarbersByBranch />}
              />
              <Route
                path="/branches/:codSucursal/schedule"
                element={<ScheduleByBranch />}
              />
              <Route
                path="/branches/:codSucursal/schedule/:fechaTurno/:horaDesde/barbers"
                element={<BarbersByBranch />}
              />
              {/* Vista de categorias para todos los usuarios (puede definirse para cliente pero da igual)*/}
              <Route
                path="/categorias/:codCategoria"
                element={<ShowCategories />}
              />
              {/* Rutas protegidas por tipo de usuario */}
              <Route //! BARBER
                path="/Barber/HomePageBarber"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <HomePageBarber />
                  </ProtectedRoute>
                }
              />
              <Route //! BARBER
                path="/Barber/MyAppointments"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <BarberAppointments />
                  </ProtectedRoute>
                }
              />
              <Route //! BARBER
                path="/Barber/BranchAppointments"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <BranchAppointments />
                  </ProtectedRoute>
                }
              />
              <Route //! BARBER
                path="/Barber/appointments/recibo/:codTurno"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <ReceiptViewer
                      backRoute="/Barber/MyAppointments"
                      backLabel="Volver a turnos de sucursal"
                    />
                  </ProtectedRoute>
                }
              />
              <Route //! BARBER
                path="/Barber/availability"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <BarberAvailability />
                  </ProtectedRoute>
                }
              />
              <Route //! BARBER
                path="/Barber/myAvailability"
                element={
                  <ProtectedRoute allowedRoles={["barber"]}>
                    <MyAvailability />
                  </ProtectedRoute>
                }
              />

              <Route path="/client/profile" element={
                <ProtectedRoute allowedRoles={["client"]}>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              {/* Rutas de administración protegidas */}
              <Route //! ADMIN
                path="/Admin/HomePageAdmin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <HomePageAdmin />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Categorías */}
              <Route
                path="/Admin/CategoriesPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <IndexCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/CategoriesPage/createCategories"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CreateCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/CategoriesPage/updateCategories/:codCategoria"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UpdateCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/CategoriesPage/:codCategoria"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ShowCategories />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Barberos */}
              <Route
                path="/Admin/BarbersPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <IndexBarbers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/BarbersPage/createBarbers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CreateBarbers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/BarbersPage/updateBarber/:codUsuario"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UpdateBarbers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/BarbersPage/:codUsuario"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ShowBarbers />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Sucursales */}
              <Route
                path="/Admin/BranchesPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <IndexBranches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/BranchesPage/createBranches"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CreateBranches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/BranchesPage/updateBranches/:codSucursal"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UpdateBranches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/BranchesPage/:codSucursal"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ShowBranches />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Tipos de corte */}
              <Route
                path="/Admin/HaircutTypesPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <IndexTypeOfHaircut />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/HaircutTypesPage/createTypeOfHaircut"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CreateTypeOfHaircut />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Admin/HaircutTypesPage/updateTypeOfHaircut/:codCorte"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UpdateTypeOfHaircut />
                  </ProtectedRoute>
                }
              />

              {/* Admin - Clientes */}
              <Route
                path="/Admin/ClientsPage"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <IndexClients />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/Admin/RentabilityByBranch"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <RentabilityByBranch />
                  </ProtectedRoute>
                }
              />
              {/* Rutas de Login y Signup */}
              <Route path="/login" element={<Login />} />
              <Route path="/signUp" element={<CreateUser />} />
              <Route path="/changePassword" element={<ResetSecurity />} />
              <Route path="/" element={<AutoRedirect />} />
              {/* con el '*' indico que tiene rutas anidadas*/}
            </Routes>
          </main>
          <Footer />
          {/* Alerts de Toaster */}
          <Toaster
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--color-gray-20)",
                color: "var(--color-white)",
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
                  background: "var(--color-success)",
                },
              },
              error: {
                duration: 1500,
                style: {
                  background: "var(--color-danger-bright)",
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
