// import { useState } from "react";
import "./App.css";
import Login from "./components/login/login.tsx";
import CreateUser from "./components/login/createUser.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";

import CreateTurns from "./components/Client/turns/createTurns.tsx";
import IndexTurns from "./components/Client/turns/indexTurns.tsx";
import ShowTurn from "./components/Client/turns/showTurns.tsx";
import UpdateTurn from "./components/Client/turns/updateTurn.tsx";

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
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { Toaster } from "react-hot-toast"; //libreria toaster para alerts
import HomePageClient from "./pages/Client/HomePageClient.tsx";
import CategoriesPage from "./pages/Admin/CategoriesPage.tsx";
import BarbersPage from "./pages/Admin/BarbersPage.tsx";
import HairCutTypesPage from "./pages/Admin/HaircutTypesPage.tsx";
import HomePageBarber from "./pages/Barber/HomePageBarber.tsx";
import { AuthProvider } from "./components/login/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="appContainer">
          <Header />
          <main className="mainContent">
            <Routes>
              <Route path="/" element={<HomePageClient />} />

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
              {/* <Route path="/Admin/TurnsPage" element={<TurnsPage />} /> */}

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
