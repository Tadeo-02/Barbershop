import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./login/AuthContext";
import React from "react";
import "./Redirect.module.css";


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

    if (message) alert(message);
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
    // Compute target path for the current user state
    const getTarget = (u: any) =>
      u
        ? u.cuil === "1"
          ? "/Admin/HomePageAdmin"
          : u.cuil
          ? "/Barber/HomePageBarber"
          : "/Client/Home"
        : "/";

    const target = getTarget(user);

    if (location.pathname !== target) {
      // show overlay while redirecting
      setIsRedirecting(true);
      if (user) {
        redirectUser(user);
      } else {
        navigate(target, { replace: true });
      }
      // If navigation didn't unmount this component (same pathname), hide overlay
      // Small timeout to allow transition/visual feedback; will be cancelled by unmount on actual navigation
      const t = setTimeout(() => setIsRedirecting(false), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Render an overlay while redirecting so the user has feedback
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
