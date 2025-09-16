import React from "react";
import { Link } from "react-router-dom";

function HomePageBarber() {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Panel de Barbero</h1>
      <p>Bienvenido al sistema de gestión para barberos</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "20px",
          maxWidth: "600px",
          margin: "20px auto",
        }}
      >
        <div
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>Mis Turnos</h3>
          <p>Ver y gestionar turnos asignados</p>
          <Link
            to="/barber/turns"
            style={{
              background: "#007bff",
              color: "white",
              padding: "10px 20px",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Ver Turnos
          </Link>
        </div>

        <div
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>Mi Perfil</h3>
          <p>Editar información personal</p>
          <Link
            to="/barber/profile"
            style={{
              background: "#28a745",
              color: "white",
              padding: "10px 20px",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Ver Perfil
          </Link>
        </div>

        <div
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>Horarios</h3>
          <p>Configurar disponibilidad</p>
          <Link
            to="/barber/schedule"
            style={{
              background: "#ffc107",
              color: "black",
              padding: "10px 20px",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Horarios
          </Link>
        </div>

        <div
          style={{
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>Estadísticas</h3>
          <p>Ver rendimiento y ganancias</p>
          <Link
            to="/barber/stats"
            style={{
              background: "#17a2b8",
              color: "white",
              padding: "10px 20px",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Estadísticas
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePageBarber;
