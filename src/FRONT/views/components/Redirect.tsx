import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./login/AuthContext";
import React from "react";
import "./Redirect.module.css";
import toast from "react-hot-toast";


export const useUserRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectUser = React.useCallback((user: any, message?: string) => {
    // Determinar tipo de usuario y redireccionar
    const userType =
      user.cuil === "1" ? "admin" : user.cuil ? "barber" : "client";
    const target =
      userType === "admin"
        ? "/Admin/HomePageAdmin"
        : userType === "barber"
        ? "/Barber/HomePageBarber"
        : "/Client/Home";
    // solo navegar si no estamos ya en el destino
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }

  if (message) toast.success(message);
  }, [navigate, location]);

  return { redirectUser };
};

// Componente para redirección automática basada en usuario autenticado
export const AutoRedirect = () => {
  const { user } = useAuth();
  const { redirectUser } = useUserRedirect();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    if (location.pathname === "/") {
      redirectUser(user);
    }
  }, [user, location.pathname, redirectUser]);

  React.useEffect(() => {
    if (user) {
      setIsRedirecting(false);
      return;
    }

    const publicRoutes = ["/", "/login", "/signUp", "/changePassword"];
    if (publicRoutes.includes(location.pathname)) {
      setIsRedirecting(false);
      return;
    }

    const target = "/";
    if (location.pathname !== target) {
      setIsRedirecting(true);
      navigate(target, { replace: true });
      const t = setTimeout(() => setIsRedirecting(false), 800);
      return () => clearTimeout(t);
    }

    setIsRedirecting(false);
  }, [user, location.pathname, navigate]);

  if (isRedirecting) {
    return (
      <div className="redirect-overlay">
        <div className="redirect-box">
          <svg
            width="40"
            height="40"
            viewBox="0 0 50 50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g transform="translate(25,25)">
              <circle cx="0" cy="0" r="18" stroke="#e6e6e6" strokeWidth="6" fill="none" />
              <path
                d="M18 0 A18 18 0 0 1 0 18"
                stroke="#333"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="0.9s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </svg>
          <div className="redirect-message">Redirigiendo...</div>
        </div>
      </div>
    );
  }

  return null;
};

export default useUserRedirect;
