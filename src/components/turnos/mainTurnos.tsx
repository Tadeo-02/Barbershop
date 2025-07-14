import { Link, Routes, Route } from "react-router-dom";
import styles from './mainTurnos.module.css';

function TurnoNuevo() {
  return <div>Formulario para solicitar un turno nuevo</div>;
}
function TurnosHistorial() {
  return <div>Historial de turnos</div>;
}

function MainTurnos() {
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
        <h2 className={styles.title}>Sucursal Centro</h2>
        <div className={styles.branchGallery}>
          <img src="/images/sucursal1.jpeg" alt="Sucursal Centro" className={styles.branchImage} />
        </div>
        <a href="https://maps.app.goo.gl/ut38V2Tf414qxqs28" className={styles.mapLink}>Dirección: Mendoza 2774, Rosario </a>
      </div>
      <div className={styles.container}>
        <h2 className={styles.title}>Sucursal Norte</h2>
        <div className={styles.branchGallery}>
          <img src="/images/sucursal2.jpg" alt="Sucursal Norte" className={styles.branchImage} />
        </div>
        <a href="https://maps.app.goo.gl/KJnih2u2hf5S9jmB6" className={styles.mapLink}>Dirección: Juan B. Justo 1767, Rosario </a>
      </div>
    </div>
  );
}
export default MainTurnos;
