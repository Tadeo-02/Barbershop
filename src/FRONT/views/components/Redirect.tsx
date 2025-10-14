import { useNavigate } from "react-router-dom";
import { useAuth } from "./login/AuthContext";
import React from "react";
import { toast } from "react-hot-toast";

export const useUserRedirect = () => {
  const navigate = useNavigate();

  const redirectUser = (user: any, message?: string) => {
    // Determinar tipo de usuario y redireccionar
    const userType =
      user.cuil === "1" ? "admin" : user.cuil ? "barber" : "client";

    console.log("Determined user type:", userType);

    if (userType === "admin") {
      console.log("Redirecting to admin page");
      navigate("/Admin/HomePageAdmin");
    } else if (userType === "barber") {
      console.log("Redirecting to barber home");
      navigate("/barber/home");
    } else {
      console.log("Redirecting to client page");
      navigate("/");
    }

    if (message) {
      toast.success(String(message));
    }
  };

  return { redirectUser };
};

// Componente para redirección automática basada en usuario autenticado
export const AutoRedirect = () => {
  const { user } = useAuth();
  const { redirectUser } = useUserRedirect();

  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      redirectUser(user);
    } else {
      // Si no hay usuario autenticado, ir a home
      navigate("/");
    }
  }, [user, redirectUser, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "200px",
        fontSize: "18px",
        color: "#666",
      }}
    >
      Redirigiendo...
    </div>
  );
};

export default useUserRedirect;
