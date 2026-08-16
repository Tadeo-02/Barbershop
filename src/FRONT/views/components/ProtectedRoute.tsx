import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./user/AuthContext.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("client" | "barber" | "admin")[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { userType, isAuthenticated } = useAuth();

  // if not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // wrong role, redirect to unauthorized page
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

  // if authenticated and has the correct role, show the content
  return <>{children}</>;
}

export default ProtectedRoute;
