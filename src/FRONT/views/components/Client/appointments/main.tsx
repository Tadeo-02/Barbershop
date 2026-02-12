//No se usa

import { Link, Routes, Route } from "react-router-dom";
import styles from "./mainBranch.module.css";

function Ubicacion() {
  return <div>Formulario para solicitar un turno nuevo</div>;
}
function Horarios() {
  return <div>Historial de turnos</div>;
}
function Barberos() {
  return <div>Historial de turnos</div>;
}
function AgendarTurno() {
  return <div>Formulario para solicitar un turno nuevo</div>;
}
function Categorias() {
  return <div>Categorias</div>;
}

function MainTurnos() {
  return (
    <div>
      <h1 style={{ fontSize: 40 }}>Sucursal N°1</h1>
      <img src="/public/images/fotoSucursal.jpg" alt="logo-sucursal" />
      <nav>
        <div className={styles.mainSucursal}>
          <Link to="Ubicación">Ubicación</Link>
        </div>
        <div className={styles.mainSucursal}>
          <Link to="Horarios">Horarios</Link>
        </div>
        <div className={styles.mainSucursal}>
          <Link to="Barberos">Barberos</Link>
        </div>
        <div className={styles.mainSucursal}>
          <Link to="Agendar Turnos">Agendar Turnos</Link>
        </div>
        <div className={styles.mainSucursal}>
          <Link to="Categorias">Categorias</Link>
        </div>
      </nav>
      <Routes>
        <Route path="Ubicación" element={<Ubicacion />} />
        <Route path="Horarios" element={<Horarios />} />
        <Route path="Barberos" element={<Barberos />} />
        <Route path="Categorias" element={<Categorias />} />
        <Route path="Agendar Turnos" element={<AgendarTurno />} />
      </Routes>
    </div>
  );
}
export default MainTurnos;
