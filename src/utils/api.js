// utils/api.js
// Centraliza la definición de la URL base del backend.
// Permite usar variable de entorno y facilitar cambios entre entornos.

/*
 * Establece la URL base leyendo la variable de entorno REACT_APP_API_URL.
 * Si no existe, asume mismo origin (vacío '').
 */
export const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';

/**
 * Devuelve una URL completa concatenando la ruta al backend.
 * @param {string} path - Ruta que comienza con '/'
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
