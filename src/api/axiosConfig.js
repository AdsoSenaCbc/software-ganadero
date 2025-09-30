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
      // Limpiar sesión y redirigir al login
      try { localStorage.removeItem("token"); } catch (_) {}
      // Evitar múltiples redirecciones en paralelo
      if (typeof window !== 'undefined') {
        const current = window.location.pathname;
        if (!current.includes('/iniciar-sesion')) {
          window.location.assign('/iniciar-sesion');
        }
      }
    } else if (error.response && error.response.status === 403) {
      if (typeof window !== 'undefined') {
        const current = window.location.pathname;
        if (!current.includes('/forbidden')) {
          window.location.assign('/forbidden');
        }
      }
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
  // Backend blueprint prefix: '/api/animals' with routes '/', '/<id>'
  ANIMALES: `${baseURL}/animals/`, // GET list, POST create
  ANIMALES_CRUD: `${baseURL}/animals/`, // base for GET detail, DELETE: `${...}/:id`
  RAZAS: `${baseURL}/razas/list`,
  SEXOS: `${baseURL}/sexos/list`,
  ESPECIES: `${baseURL}/especies/list`,
  ESTADOS: `${baseURL}/estados-animal/list`,
  ETAPAS: `${baseURL}/etapas-productivas/list`,
  MUNICIPIOS: `${baseURL}/municipios/list`,
  USERS: `${baseURL}/users/list`,
  // Endpoints de administración
  ADMIN_USERS: `${baseURL}/users/admin/users`,
  ADMIN_ROLES: `${baseURL}/users/admin/roles`,
  ADMIN_STATS: `${baseURL}/users/admin/stats`,
};
