// useAdminPanel.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../api/adminService';
import Swal from 'sweetalert2';

export const useAdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados principales
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros y paginación
  const [filters, setFilters] = useState({
    estado: 'todos',
    rol_id: '',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });

  // Verificar permisos de administrador
  const checkAdminPermissions = useCallback(() => {
    if (!user) {
      navigate('/');
      return false;
    }
    
    if (!user.nombre_rol || user.nombre_rol.toLowerCase() !== 'administrador') {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para acceder al panel de administración.',
        confirmButtonColor: '#004b73'
      }).then(() => {
        navigate('/');
      });
      return false;
    }
    
    return true;
  }, [user, navigate]);

  // Cargar usuarios con filtros
  const loadUsers = useCallback(async (page = 1) => {
    try {
      const params = {
        page,
        per_page: pagination.per_page,
        ...filters
      };
      
      // Limpiar parámetros vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'todos') {
          delete params[key];
        }
      });

      const data = await adminService.getUsers(params);
      
      setUsers(data.users);
      setPagination({
        current_page: data.current_page,
        per_page: data.per_page,
        total: data.total,
        pages: data.pages,
        has_next: data.has_next,
        has_prev: data.has_prev
      });
      
      setError(null);
    } catch (error) {
      console.error('Error loading users:', error);
      if (error.message.includes('Acceso denegado')) {
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para ver esta información.',
          confirmButtonColor: '#004b73'
        });
      } else {
        setError(error.message || 'Error al cargar los usuarios');
      }
    }
  }, [filters, pagination.per_page]);

  // Cargar roles
  const loadRoles = useCallback(async () => {
    try {
      const data = await adminService.getRoles();
      setRoles(data.roles);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    if (!checkAdminPermissions()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadUsers(1),
        loadRoles(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos del panel');
    } finally {
      setLoading(false);
    }
  }, [checkAdminPermissions, loadUsers, loadRoles, loadStats]);

  // Manejar cambios en filtros
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    loadUsers(1);
  }, [loadUsers]);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      estado: 'todos',
      rol_id: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
    // Usar setTimeout para asegurar que los filtros se actualicen antes de cargar
    setTimeout(() => loadUsers(1), 100);
  }, [loadUsers]);

  // Cambiar estado de usuario
  const toggleUserStatus = useCallback(async (userId, currentStatus) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    
    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} usuario?`,
      text: `¿Estás seguro de que quieres ${action} este usuario?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004b73',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.toggleUserStatus(userId);
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: response.message,
          confirmButtonColor: '#004b73'
        });
        
        // Recargar usuarios y estadísticas
        await Promise.all([
          loadUsers(pagination.current_page),
          loadStats()
        ]);
      } catch (error) {
        console.error('Error toggling user status:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Error al cambiar el estado del usuario',
          confirmButtonColor: '#004b73'
        });
      }
    }
  }, [loadUsers, loadStats, pagination.current_page]);

  // Cambiar rol de usuario
  const changeUserRole = useCallback(async (userId, currentRoleId) => {
    const { value: newRoleId } = await Swal.fire({
      title: 'Cambiar Rol de Usuario',
      input: 'select',
      inputOptions: roles.reduce((options, role) => {
        options[role.id_rol] = role.nombre_rol;
        return options;
      }, {}),
      inputValue: currentRoleId,
      showCancelButton: true,
      confirmButtonColor: '#004b73',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar un rol';
        }
      }
    });

    if (newRoleId && newRoleId !== currentRoleId.toString()) {
      try {
        const response = await adminService.updateUserRole(userId, parseInt(newRoleId));
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: response.message,
          confirmButtonColor: '#004b73'
        });
        
        // Recargar usuarios y estadísticas
        await Promise.all([
          loadUsers(pagination.current_page),
          loadStats()
        ]);
      } catch (error) {
        console.error('Error changing user role:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Error al cambiar el rol del usuario',
          confirmButtonColor: '#004b73'
        });
      }
    }
  }, [roles, loadUsers, loadStats, pagination.current_page]);

  // Cambiar página
  const changePage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadUsers(newPage);
    }
  }, [loadUsers, pagination.pages]);

  // Refrescar datos
  const refreshData = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Efecto inicial
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    // Estados
    users,
    roles,
    stats,
    loading,
    error,
    filters,
    pagination,
    
    // Acciones
    handleFilterChange,
    applyFilters,
    clearFilters,
    toggleUserStatus,
    changeUserRole,
    changePage,
    refreshData,
    
    // Utilidades
    checkAdminPermissions
  };
};
