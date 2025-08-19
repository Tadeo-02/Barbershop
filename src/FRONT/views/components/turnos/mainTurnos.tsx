import { Link } from "react-router-dom";
import styles from './turnos.module.css';
import React, { useState, useEffect } from "react";

// function TurnoNuevo() {
//   return <div>Formulario para solicitar un turno nuevo</div>;
// }
// function TurnosHistorial() {
//   return <div>Historial de turnos</div>;
// }

function MainTurnos() {
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
    <div className={styles.mainTurnos}>
        <h2>Sistema de Gestión de Barbería</h2>
        
        {/* Primera fila: Turnos y Barberos */}
        <div className={styles.mainTurnosGrid}>
          <div className={styles.mainTurnosCard}>
            <h3>Turnos</h3>
            <Link to="/createTurnos" className={`${styles.button} ${styles.buttonPrimary}`}>
              CREAR TURNOS
            </Link>
            <Link to="/indexTurnos" className={`${styles.button} ${styles.buttonPrimary}`}>
              VER TURNOS
            </Link>
          </div>
          
          <div className={styles.mainTurnosCard}>
            <h3>Barberos</h3>
            <Link to="/barberos/createBarberos" className={`${styles.button} ${styles.buttonPrimary}`}>
              CREAR BARBEROS
            </Link>
            <Link to="/barberos/indexBarberos" className={`${styles.button} ${styles.buttonPrimary}`}>
              VER BARBEROS
            </Link>
          </div>
        </div>
        
        {/* Segunda fila: Categorías y Tipos de Corte */}
        <div className={styles.mainTurnosGrid}>
          <div className={styles.mainTurnosCard}>
            <h3>Categorías</h3>
            <Link to="/categorias/createCategorias" className={`${styles.button} ${styles.buttonPrimary}`}>
              CREAR CATEGORIAS
            </Link>
            <Link to="/categorias/indexCategorias" className={`${styles.button} ${styles.buttonPrimary}`}>
              VER CATEGORIAS
            </Link>
          </div>
          
          <div className={styles.mainTurnosCard}>
            <h3>Tipo de Cortes</h3>
            <Link to="/tipoCortes/createTipoCortes" className={`${styles.button} ${styles.buttonPrimary}`}>
              CREAR TIPO CORTES
            </Link>
            <Link to="/tipoCortes/indexTipoCortes" className={`${styles.button} ${styles.buttonPrimary}`}>
              VER TIPO CORTES
            </Link>
          </div>
        </div>
        
        {/* Tercera fila: Sucursales */}
        <div className={styles.mainTurnosGrid}>
          <div className={styles.mainTurnosCard}>
            <h3>Sucursal Centro</h3>
            <img
              src="/images/sucursal1.jpeg"
              alt="Sucursal Centro"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
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
          
          <div className={styles.mainTurnosCard}>
            <h3>Sucursal Norte</h3>
            <img
              src="/images/sucursal2.jpg"
              alt="Sucursal Norte"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
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
export default MainTurnos;
