// adminService.js
import axiosInstance from './axiosConfig';

class AdminService {
  // Obtener todos los usuarios con filtros
  async getUsers(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener detalles de un usuario específico
  async getUserDetails(userId) {
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cambiar estado activo/inactivo de un usuario
  async toggleUserStatus(userId) {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cambiar rol de un usuario
  async updateUserRole(userId, roleId) {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/role`, {
        id_rol: roleId
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener todos los roles disponibles
  async getRoles() {
    try {
      const response = await axiosInstance.get('/admin/roles');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener estadísticas de usuarios
  async getStats() {
    try {
      const response = await axiosInstance.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Manejar errores de manera consistente
  handleError(error) {
    if (error.response) {
      // El servidor respondió con un código de estado de error
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        case 403:
          return new Error('Acceso denegado. No tienes permisos para realizar esta acción.');
        case 404:
          return new Error('Recurso no encontrado.');
        case 422:
          return new Error(data.error || 'Datos de entrada inválidos.');
        case 500:
          return new Error('Error interno del servidor. Por favor, intenta más tarde.');
        default:
          return new Error(data.error || `Error del servidor: ${status}`);
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      return new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else {
      // Algo pasó al configurar la petición
      return new Error('Error inesperado. Por favor, intenta nuevamente.');
    }
  }
}

// Exportar una instancia del servicio
const adminService = new AdminService();
export default adminService;

// También exportar métodos individuales para facilidad de uso
export const {
  getUsers,
  getUserDetails,
  toggleUserStatus,
  updateUserRole,
  getRoles,
  getStats
} = adminService;
