import { Link } from "react-router-dom";
import styles from "./HomePageClient.module.css";
import React, { useState, useEffect } from "react";

// function TurnoNuevo() {
//   return <div>Formulario para solicitar un turno nuevo</div>;
// }
// function TurnosHistorial() {
//   return <div>Historial de turnos</div>;
// }

function HomePageClient() {
  const [turnos, setTurnos] = useState([]); // Initialize as an empty array

  useEffect(() => {
    const fetchTurnos = async () => {
      try {
        const response = await fetch("/turnos"); // Fetch all turnos from the backend
        if (response.ok) {
          const data = await response.json();
          setTurnos(data);
        } else {
          console.error("Failed to fetch turnos");
        }
      } catch (error) {
        console.error("Error fetching turnos:", error);
      }
    };

    fetchTurnos();
  }, []);

  return (
    /*
    <div className={styles.container}>
      <h2 className={styles.title}>Turnos</h2>
      <nav className={styles.navBar}>
        <Link to="nuevo" className={styles.link}>
          Nuevo Turno
        </Link>
        <Link to="historial" className={styles.link}>Historial</Link>
      </nav>
      <div className={styles.content}>
        <Routes>
          <Route path="nuevo" element={<TurnoNuevo />} />
          <Route path="historial" element={<TurnosHistorial />} />
          <Route path="" element={<div>Selecciona una opción</div>} />
        </Routes>
      </div>
      */
    /*MUESTRA DE SUCURSALES */
    <div className={styles.HomePageAdmin}>
      <h2>Sistema de Gestión de Barbería</h2>

      {/* Primera fila: Turnos y Barberos */}
      <div className={styles.HomePageAdminGrid}>
        <div className={styles.HomePageAdminCard}>
          <Link
            to="/Admin/TurnsPage"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            TURNOS
          </Link>
        </div>

        <div className={styles.HomePageAdminCard}>
          <Link
            to="/Admin/BarbersPage"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            BARBEROS
          </Link>
        </div>
      </div>

      {/* Segunda fila: Categorías y Tipos de Corte */}
      <div className={styles.HomePageAdminGrid}>
        <div className={styles.HomePageAdminCard}>
          <Link
            to="/Admin/CategoriesPage"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            CATEGORÍAS
          </Link>
        </div>

        <div className={styles.HomePageAdminCard}>
          <Link
            to="/Admin/HaircutTypesPage"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            TIPOS DE CORTES
          </Link>
        </div>
      </div>

      {/* Tercera fila: Sucursales */}
    
    </div>
  );
}
export default HomePageClient;
