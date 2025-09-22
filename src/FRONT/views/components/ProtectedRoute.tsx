import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./login/AuthContext.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("client" | "barber" | "admin")[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userType, isAuthenticated } = useAuth();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no tiene el rol adecuado, redirigir a página no autorizada
  if (userType && !allowedRoles.includes(userType)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Acceso No Autorizado</h2>
        <p>No tienes permisos para acceder a esta página.</p>
        <p>Tipo de usuario: {userType}</p>
        <button onClick={() => window.history.back()}>Volver</button>
      </div>
    );
  }

  // Si está autenticado y tiene el rol correcto, mostrar el contenido
  return <>{children}</>;
}

export default ProtectedRoute;
