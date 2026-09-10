import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deriveRole } from "../lib/roles";

type RedirectUser = {
  cuil: string | null;
};

export const useUserRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectUser = React.useCallback(
    (user: RedirectUser, message?: string) => {
      const userType = deriveRole(user.cuil);
      const target =
        userType === "admin"
          ? "/Admin/HomePageAdmin"
          : userType === "barber"
            ? "/Barber/HomePageBarber"
            : "/Client/Home";

      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }

      if (message) toast.success(message);
    },
    [navigate, location.pathname],
  );

  return { redirectUser };
};
