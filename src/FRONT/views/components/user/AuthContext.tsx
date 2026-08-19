import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthStorage,
  decodeAuthToken,
  getStoredAuthToken,
  isTokenExpired,
  setStoredAuthToken,
} from "../../lib/authStorage";
import type { UserRole } from "../../lib/roles";

interface User {
  codUsuario: string;
  dni: string;
  cuil: string | null;
  codSucursal: string | null;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  userType: UserRole | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL ?? "";

function getRoleFromToken(token: string | null) {
  if (!token) return null;
  return decodeAuthToken(token)?.rol ?? null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    getStoredAuthToken(),
  );
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<
    UserRole | null
  >(() => getRoleFromToken(getStoredAuthToken()));
  const [isAuthLoading, setIsAuthLoading] = useState(() => !!token);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setUserType(null);
      setIsAuthLoading(false);
      return;
    }

    const payload = decodeAuthToken(token);
    if (!payload || isTokenExpired(payload)) {
      clearAuthStorage();
      setToken(null);
      setUser(null);
      setUserType(null);
      setIsAuthLoading(false);
      return;
    }

    if (user?.codUsuario === payload.codUsuario) {
      setUserType(payload.rol);
      setIsAuthLoading(false);
      return;
    }

    let isCurrent = true;
    setUserType(payload.rol);
    setIsAuthLoading(true);

    fetch(`${API_URL}/usuarios/profiles/${payload.codUsuario}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isCurrent) return;
        setUser((data?.data ?? data?.user ?? data) as User);
      })
      .catch((error) => {
        if (!isCurrent) return;
        console.warn("No se pudo restaurar la sesión", error);
        clearAuthStorage();
        setToken(null);
        setUser(null);
        setUserType(null);
      })
      .finally(() => {
        if (isCurrent) setIsAuthLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, user?.codUsuario]);

  const login = (userData: User, newToken: string) => {
    const payload = decodeAuthToken(newToken);
    if (!payload || isTokenExpired(payload)) {
      clearAuthStorage();
      setUser(null);
      setUserType(null);
      setToken(null);
      setIsAuthLoading(false);
      return;
    }

    setUser(userData);
    setUserType(payload.rol);
    setToken(newToken);
    setIsAuthLoading(false);

    try {
      setStoredAuthToken(newToken);
    } catch (e) {
      console.warn("No se pudo guardar el token de sesión", e);
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setToken(null);
    setIsAuthLoading(false);
    try {
      clearAuthStorage();
    } catch (e) {
      console.warn("No se pudo remover la sesión", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        token,
        login,
        logout,
        isAuthenticated: !!token,
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
