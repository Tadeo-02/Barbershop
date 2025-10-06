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
  reservations: any[];
  addReservation: (r: any) => void;
  removeReservation: (id: string | number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<
    "client" | "barber" | "admin" | null
  >(null);
  const [reservations, setReservations] = useState<any[]>([]);

  const login = (userData: User) => {
    const type =
      userData.cuil === "1" ? "admin" : userData.cuil ? "barber" : "client";
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
    localStorage.removeItem("reservations");
  };

  // Recuperar datos del localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedUserType = localStorage.getItem("userType");
    const savedReservations = localStorage.getItem("reservations");

    if (savedUser && savedUserType) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType as "client" | "barber" | "admin");
    }
    if (savedReservations) {
      try { setReservations(JSON.parse(savedReservations)); } catch { setReservations([]); }
    }
  }, []);

  const addReservation = (r: any) => {
    setReservations(prev => {
      try {
        // Avoid duplicates: prefer checking by id when available, otherwise by key fields
        const exists = prev.some(x => {
          if (x && x.id && r && r.id) return String(x.id) === String(r.id);
          return (
            x && r && x.fecha === r.fecha && x.hora === r.hora && x.codBarbero === r.codBarbero && x.codSucursal === r.codSucursal
          );
        });
        if (exists) return prev;
      } catch (e) {
        // if any error during check, fall through and append
      }
      const next = [...prev, r];
      localStorage.setItem('reservations', JSON.stringify(next));
      return next;
    });
  };

  const removeReservation = (id: string | number) => {
    setReservations(prev => {
      const next = prev.filter(x => x.id !== id);
      localStorage.setItem('reservations', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        login,
        logout,
        isAuthenticated: !!user,
        reservations,
        addReservation,
        removeReservation,
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
