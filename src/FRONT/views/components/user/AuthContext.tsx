
import React, { createContext, useContext, useState } from "react";

export interface User {
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
  userType: "client" | "barber" | "admin" | null;
  token: string | null; // NUEVO
  login: (userData: User, token: string) => void; // firma cambiada
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const [user, setUser] = useState<User | null>(() => {
    if (!getStoredToken()) return null;
    try {
      const saved = localStorage.getItem("user");
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  const [userType, setUserType] = useState<
    "client" | "barber" | "admin" | null
  >(() => {
    if (!getStoredToken()) return null;
    try {
      const t = localStorage.getItem("userType");
      return t ? (t as "client" | "barber" | "admin") : null;
    } catch {
      return null;
    }
  });

  // CAMBIO: recibe token explícitamente, rol viene del payload del token
  const login = (userData: User, newToken: string) => {
    const payload = JSON.parse(atob(newToken.split(".")[1]));
    const type = payload.rol as "client" | "barber" | "admin";

    setUser(userData);
    setUserType(type);
    setToken(newToken);

    try {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userType", type);
    } catch (e) {
      console.warn("No se pudo guardar en localStorage", e);
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    setToken(null);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
    } catch (e) {
      console.warn("No se pudo remover localStorage", e);
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
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
