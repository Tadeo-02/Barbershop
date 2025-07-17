import { Link } from "react-router-dom";
import styles from './mainTurnos.module.css';
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
    <div>
      <div className={styles.container}>
        <Link to="/createTurnos" className={styles.link}>
          CREAR TURNOS
        </Link>
        <Link to="/indexTurnos" className={styles.link}>
          VER TURNOS
        </Link>
        <Link to="/indexTurnos" className={styles.link}>
          MODIFICAR TURNOS  
        </Link>
        <h2 className={styles.title}>Sucursal Centro</h2>
        <div className={styles.branchGallery}>
          <img
            src="/images/sucursal1.jpeg"
            alt="Sucursal Centro"
            className={styles.branchImage}
          />
        </div>
        <a
          href="https://maps.app.goo.gl/ut38V2Tf414qxqs28"
          className={styles.mapLink}
        >
          Dirección: Mendoza 2774, Rosario{" "}
        </a>
        <Link to="/deleteTurnos" className={styles.link}>
          ANIQUILAR TURNOS
        </Link>
      </div>
      <div className={styles.container}>
        <h2 className={styles.title}>Sucursal Norte</h2>
        <div className={styles.branchGallery}>
          <img
            src="/images/sucursal2.jpg"
            alt="Sucursal Norte"
            className={styles.branchImage}
          />
        </div>
        <a
          href="https://maps.app.goo.gl/KJnih2u2hf5S9jmB6"
          className={styles.mapLink}
        >
          Dirección: Juan B. Justo 1767, Rosario{" "}
        </a>

        <Link to="/tipoCortes/createTipoCortes" className={styles.link}>
          CREAR TIPO CORTES
        </Link>
        <Link to="/indexTipoCortes" className={styles.link}>
          VER TIPO CORTES
        </Link>
      </div>
    </div>
  );
}
export default MainTurnos;
