// src/api/api.js
// Centraliza la base URL del backend y ayuda a construir rutas completas.
// Si REACT_APP_API_URL está definida la usa, en caso contrario intenta inferir
// la URL del backend en desarrollo (localhost:5000).

let base = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
if (!base && typeof window !== 'undefined') {
  const { protocol, hostname } = window.location;
  // En desarrollo, asumir backend en el mismo host pero puerto 5000
  base = `${protocol}//${hostname}:5000`;
}
export const API_BASE = base;

// Devuelve un objeto con el encabezado Authorization cuando exista un JWT.
export const authHeader = () => {
  if (typeof window === 'undefined') return {};
  let token = localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token');
  if (!token && typeof document !== 'undefined') {
    // Buscar en cookies comunes
    const m1 = document.cookie.match(/(^|;)\s*jwt_token=([^;]+)/);
    const m2 = document.cookie.match(/(^|;)\s*access_token=([^;]+)/);
    if (m1) token = m1[2];
    else if (m2) token = m2[2];
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Construye URL absoluta a la API.
export const apiUrl = (path) => `${API_BASE}${path}`;
