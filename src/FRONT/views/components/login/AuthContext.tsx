// AuthContext.tsx (nuevo archivo)
import React, { createContext, useContext, useState } from "react";

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
  userType: "client" | "barber" | "admin" | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  

  // Inicializar estado desde localStorage de forma sincrónica para evitar
  // redirecciones prematuras al refrescar la página.
  const [user, setUser] = useState<User | null>(() => {
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
    try {
      const t = localStorage.getItem("userType");
      return t ? (t as "client" | "barber" | "admin") : null;
    } catch {
      return null;
    }
  });

  const login = (userData: User) => {
    const type =
      userData.cuil === "1" ? "admin" : userData.cuil ? "barber" : "client";
    setUser(userData);
    setUserType(type);
    try {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userType", type);
    } catch (e) {
      // Silencioso: localStorage puede fallar en modos strictos o de privacidad
      console.warn("No se pudo guardar en localStorage", e);
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    try {
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
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
