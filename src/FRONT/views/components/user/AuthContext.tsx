import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthStorage,
  getSessionUser,
  setSessionUser,
} from "../../lib/authStorage";
import type { UserRole } from "../../lib/roles";
import type { User } from "../../../types/user";

interface AuthContextType {
  user: User | null;
  userType: UserRole | null;
  login: (userData: User, userRole: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL ?? "";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserRole | null>(() => {
    return getSessionUser()?.rol ?? null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(() => {
    return !!getSessionUser();
  });

  useEffect(() => {
    const session = getSessionUser();
    if (!session) {
      setUser(null);
      setUserType(null);
      setIsAuthLoading(false);
      return;
    }

    if (user?.codUsuario === session.codUsuario) {
      setUserType(session.rol);
      setIsAuthLoading(false);
      return;
    }

    let isCurrent = true;
    setUserType(session.rol);
    setIsAuthLoading(true);

        const loadProfile = async () => {
      try {
        const res = await fetch(
          `${API_URL}/usuarios/profiles/${session.codUsuario}`,
          { credentials: "include" },
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (!isCurrent) return;
        setUser((data?.data ?? data?.user ?? data) as User);
      } catch {
        if (!isCurrent) return;
        clearAuthStorage();
        setUser(null);
        setUserType(null);
      } finally {
        if (isCurrent) setIsAuthLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isCurrent = false;
    };
  }, [user?.codUsuario]);

  const login = (userData: User, userRole: UserRole) => {
    setUser(userData);
    setUserType(userRole);
    setIsAuthLoading(false);

    setSessionUser({
      codUsuario: userData.codUsuario,
      codSucursal: userData.codSucursal,
      rol: userRole,
    });
  };

  const logout = async () => {
    setUser(null);
    setUserType(null);
    setIsAuthLoading(false);
    clearAuthStorage();

    try {
      await fetch(`${API_URL}/usuarios/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Logout cookie clearing is best-effort
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        login,
        logout,
        isAuthenticated: !!userType,
        isAuthLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
