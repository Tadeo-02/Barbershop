import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../components/login/AuthContext.tsx";
import styles from "./HomePageBarber.module.css";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuth();

  console.log("Home component is rendering..."); // Debug log

  useEffect(() => {
    // Evitar redirecciones prematuras: si hay usuario en localStorage, esperar a que AuthProvider lo cargue
    const savedUser = localStorage.getItem("user");

    if (!isAuthenticated && !savedUser) {
      // No hay sesión guardada => enviar a login
      navigate("/login");
      return;
    }

    // Si ya estamos autenticados pero no somos barbero, redirigir a home público
    if (isAuthenticated && userType && userType !== "barber") {
      navigate("/");
    }
  }, [isAuthenticated, userType, navigate]);

  const handleVerTurnos = () => {
    console.log("Navigating to appointments..."); // Debug log
    navigate("/appointments/endAppointment");
  };

  const handleEntregarPedidos = () => {
    console.log("Navigating to orders..."); // Debug log
    navigate("/orders/orders");
  };

  return (
    <div className={styles.homeContainer}>
      <h2>Bienvenido</h2>
      <div className={styles.optionsContainer}>
        <button className={styles.optionButton} onClick={handleVerTurnos}>
          Ver turnos
        </button>
        <button className={styles.optionButton} onClick={handleEntregarPedidos}>
          Entregar pedidos
        </button>
      </div>
    </div>
  );
};

export default Home;
