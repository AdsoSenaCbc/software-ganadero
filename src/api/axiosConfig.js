import axios from "axios";

// Base URL configurable via .env (Vite) or fallback to localhost
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create a reusable Axios instance
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para adjuntar token de acceso
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar 401 y refrescar token (placeholder)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // TODO: implementar refresh token si lo añades al backend
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
