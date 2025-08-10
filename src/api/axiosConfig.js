import axios from "axios";

// Base URL configurable via .env (Vite) or fallback to localhost
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Instancia pública (sin token)
export const axiosPublic = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Instancia autenticada (adjunta JWT)
export const axiosAuth = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para adjuntar token de acceso
axiosAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar 401 y refrescar token (placeholder)
axiosAuth.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // TODO: implementar refresh token si lo añades al backend
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

// Exportar por defecto la instancia autenticada para mantener compatibilidad
export default axiosAuth;



// Rutas base de los recursos API
export const API_ROUTES = {
  DEPARTAMENTOS: `${baseURL}/departamentos/list`,
  // Endpoints públicos (sin token)
  // Lista y CRUD de haciendas (protegido)
  HACIENDAS: `${baseURL}/haciendas/list`,
  HACIENDAS_CRUD: `${baseURL}/haciendas/`,
  // Endpoints protegidos (JWT)
  // Lista y CRUD de animales (protegido)
  ANIMALES_CRUD: `${baseURL}/animals/`,
  ANIMALES: `${baseURL}/animal`,
  RAZAS: `${baseURL}/razas/list`,
  SEXOS: `${baseURL}/sexos/list`,
  ESPECIES: `${baseURL}/especies/list`,
  ESTADOS: `${baseURL}/estados-animal/list`,
  ETAPAS: `${baseURL}/etapas-productivas/list`,
  MUNICIPIOS: `${baseURL}/municipios/list`,
  USERS: `${baseURL}/users/list`,
};
