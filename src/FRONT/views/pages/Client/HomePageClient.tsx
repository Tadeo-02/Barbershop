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
  const response = await fetch("/appointments"); // Fetch all turnos from the backend
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


      {/* Tercera fila: Horarios y Sucursales */}
      <div className={styles.HomePageAdminGrid}>
        <div className={styles.HomePageAdminCard}>
          <Link
            to="/Admin/SchedulesPage"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            HORARIOS
          </Link>
        </div>
      </div>

      {/* Cuarta fila: Sucursales */}
      <div className={styles.HomePageAdminGrid}>
        <div className={styles.HomePageAdminCard}>
          <h3>Sucursal Centro</h3>
          <img
            src="/images/sucursal1.jpeg"
            alt="Sucursal Centro"
            style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }}
          />
          <a
            href="https://maps.app.goo.gl/ut38V2Tf414qxqs28"
            className={`${styles.button} ${styles.buttonSuccess}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mendoza 2774, Rosario
          </a>
        </div>

        <div className={styles.HomePageAdminCard}>
          <h3>Sucursal Norte</h3>
          <img
            src="/images/sucursal2.jpg"
            alt="Sucursal Norte"
            style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }}
          />
          <a
            href="https://maps.app.goo.gl/KJnih2u2hf5S9jmB6"
            className={`${styles.button} ${styles.buttonSuccess}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Juan B. Justo 1767, Rosario
          </a>
        </div>
      </div>
    </div>
  );
}
export default HomePageClient;
