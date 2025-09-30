import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  const login = (role, email, accessToken, permisos = [], userData = {}) => {
    const userInfo = { 
      role, 
      email, 
      permisos,
      nombre_rol: userData.nombre_rol || role,
      activo: userData.activo !== undefined ? userData.activo : true,
      ...userData
    };
    setUser(userInfo);
    setToken(accessToken);
    localStorage.setItem("token", accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  // Validar token al cargar el contexto
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);
          const now = Date.now() / 1000; // segundos
          if (decodedToken.exp && decodedToken.exp < now) {
            // Token expirado
            logout();
            return;
          }
          const role = decodedToken.rol;
          const email = decodedToken.email;
          const permisos = Array.isArray(decodedToken.permisos) ? decodedToken.permisos : [];
          const nombre_rol = decodedToken.nombre_rol || role;
          setUser({ 
            role, 
            email, 
            permisos, 
            nombre_rol,
            activo: true // Asumimos activo si está logueado
          });
          setToken(storedToken);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
