// AuthContext.tsx (nuevo archivo)
import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<
    "client" | "barber" | "admin" | null
  >(null);

  const login = (userData: User) => {
    const type = userData.cuil ? "barber" : "client";
    setUser(userData);
    setUserType(type);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("userType", type);
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
  };

  // Recuperar datos del localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedUserType = localStorage.getItem("userType");

    if (savedUser && savedUserType) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType as "client" | "barber" | "admin");
    }
  }, []);

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
