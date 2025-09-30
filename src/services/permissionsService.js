/**
 * Servicio para manejar las llamadas API relacionadas con permisos y restricciones.
 * Centraliza la lógica de comunicación con el backend para permisos de usuarios.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PermissionsService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/user-permissions`;
  }

  /**
   * Obtiene el token de autenticación del localStorage
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Crea headers para las peticiones HTTP
   */
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Maneja errores de respuesta HTTP
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Obtiene los permisos del usuario autenticado
   */
  async getUserPermissions() {
    try {
      const response = await fetch(`${this.baseURL}/my-permissions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario puede realizar una acción específica
   */
  async checkActionPermission(action) {
    try {
      const response = await fetch(`${this.baseURL}/check-action/${action}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error checking permission for action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Intercepta llamadas API para verificar permisos antes de realizar acciones
   */
  async interceptApiCall(method, url, data = null) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Verificar si el método está permitido para aprendices
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      try {
        const permissions = await this.getUserPermissions();
        if (permissions.is_apprentice) {
          const allowedMethods = permissions.restrictions?.allowed_methods || [];
          if (!allowedMethods.includes(method.toUpperCase())) {
            throw new Error('Los usuarios aprendices no pueden realizar esta acción');
          }
        }
      } catch (permissionError) {
        console.warn('No se pudieron verificar permisos:', permissionError);
        // Continuar con la petición si no se pueden verificar permisos
      }
    }

    // Realizar la petición
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: this.getHeaders(),
      ...(data && { body: JSON.stringify(data) })
    });

    return await this.handleResponse(response);
  }

  /**
   * Wrapper para peticiones GET (siempre permitidas)
   */
  async get(url) {
    return this.interceptApiCall('GET', url);
  }

  /**
   * Wrapper para peticiones POST (restringidas para aprendices)
   */
  async post(url, data) {
    return this.interceptApiCall('POST', url, data);
  }

  /**
   * Wrapper para peticiones PUT (restringidas para aprendices)
   */
  async put(url, data) {
    return this.interceptApiCall('PUT', url, data);
  }

  /**
   * Wrapper para peticiones DELETE (restringidas para aprendices)
   */
  async delete(url) {
    return this.interceptApiCall('DELETE', url);
  }
}

// Crear una instancia singleton del servicio
const permissionsService = new PermissionsService();

export default permissionsService;
