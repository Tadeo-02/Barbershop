// import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./home.module.css";

const Home = () => {
  const navigate = useNavigate();

  console.log("Home component is rendering..."); // Debug log

  const handleSolicitarTurno = () => {
    console.log("Navigating to branches..."); // Debug log
    navigate("/branches");
  };
  const handlComprarProductos = () => {
    console.log("Comprar productos clicked"); // Debug log
    navigate("/products"); // Uncomment and implement when the route is ready
  }

  return (
    <div className={styles.homeContainer}>
      <h2>Bienvenido</h2>
      <div className={styles.optionsContainer}>
        <button className={styles.optionButton} onClick={handleSolicitarTurno} disabled>
          Solicitar turno
        </button>
        <button className={styles.optionButton} onClick={handlComprarProductos}>
          Comprar productos
        </button>
      </div>
    </div>
  );
};

export default Home;
