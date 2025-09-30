/**
 * Hook personalizado para manejar permisos y restricciones de usuarios.
 * Especialmente diseñado para controlar las acciones de usuarios aprendices.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { getMockPermissions } from '../utils/mockPermissions';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const usePermissions = () => {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [restrictions, setRestrictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar permisos del usuario
  const fetchUserPermissions = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TEMPORAL: Usar mock para debugging si el usuario es Angel David
      if (user?.email === "angelgoyeneche197@gmail.com") {
        console.log('🔧 Using mock permissions for debugging');
        const mockData = getMockPermissions(user.email);
        setPermissions(mockData);
        setRestrictions(mockData.restrictions || {});
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-permissions/my-permissions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Permissions loaded from API:', data);
        setPermissions(data);
        setRestrictions(data.restrictions || {});
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err.message);
      
      // TEMPORAL: En caso de error, usar mock para aprendices
      if (user?.email === "angelgoyeneche197@gmail.com") {
        console.log('🔧 Using mock permissions due to API error');
        const mockData = getMockPermissions(user.email);
        setPermissions(mockData);
        setRestrictions(mockData.restrictions || {});
      } else {
        // En caso de error para otros usuarios, usar restricciones por defecto
        setRestrictions({
          can_create: false,
          can_read: true,
          can_update: false,
          can_delete: false,
          allowed_methods: ['GET'],
          message: 'Error cargando permisos - usando restricciones por defecto'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Cargar permisos al montar el componente o cambiar el token
  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);
  // Función para refrescar permisos (útil después de cambios administrativos)
  const refreshPermissions = useCallback(() => {
    console.log('Refreshing permissions...');
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Función para verificar si es usuario aprendiz
  const isApprentice = useCallback(() => {
    return user?.role?.toLowerCase() === 'aprendiz' || 
           user?.nombre_rol?.toLowerCase() === 'aprendiz' ||
           permissions?.is_apprentice === true;
  }, [user, permissions]);

  // Función para verificar si el usuario puede realizar una acción específica
  const canPerformAction = useCallback((action, module = null) => {
    console.log(`🔍 Checking permission for action: ${action}, module: ${module}`);
    console.log('Current permissions:', permissions);
    console.log('Is apprentice:', isApprentice());
    
    // Si es aprendiz, verificar permisos dinámicos específicos
    if (isApprentice()) {
      // Si no hay permisos cargados, permitir temporalmente para debugging
      if (!permissions) {
        console.log('⚠️ No permissions loaded for apprentice, allowing temporarily for debugging');
        return true; // TEMPORAL: permitir para debugging
      }
      
      // Si se especifica un módulo, verificar permiso específico primero
      if (module) {
        const specificPermission = `can_${action}_${module}`;
        console.log(`🔍 Checking specific permission: ${specificPermission}`);
        
        if (permissions.hasOwnProperty(specificPermission)) {
          const hasPermission = permissions[specificPermission] === true;
          console.log(`✅ Specific permission ${specificPermission}: ${hasPermission}`);
          return hasPermission;
        }
      }
      
      // Verificar permiso general
      const generalPermission = `can_${action}`;
      console.log(`🔍 Checking general permission: ${generalPermission}`);
      
      if (permissions.hasOwnProperty(generalPermission)) {
        const hasPermission = permissions[generalPermission] === true;
        console.log(`✅ General permission ${generalPermission}: ${hasPermission}`);
        return hasPermission;
      }
      
      // Para acciones de lectura, siempre permitir
      if (action.toLowerCase() === 'read') {
        console.log('✅ Read action always allowed for apprentices');
        return true;
      }
      
      // Si no se encuentra el permiso específico, permitir temporalmente para debugging
      console.log(`⚠️ Permission not found for action: ${action}, module: ${module}. Allowing temporarily for debugging.`);
      return true; // TEMPORAL: permitir para debugging mientras se soluciona la sincronización
    }
    
    // Para no aprendices, usar sistema de restricciones anterior o permitir por defecto
    if (!restrictions) return true;
    
    const actionMap = {
      'create': restrictions.can_create,
      'read': restrictions.can_read,
      'update': restrictions.can_update,
      'delete': restrictions.can_delete,
      'calculate': restrictions.can_create, // Calcular requiere permisos de creación
      'write': restrictions.can_create || restrictions.can_update || restrictions.can_delete,
    };

    return actionMap[action.toLowerCase()] !== false;
  }, [restrictions, permissions, isApprentice]);

  // Función para obtener mensaje de restricción
  const getRestrictionMessage = useCallback((action, module = null) => {
    if (isApprentice()) {
      console.log(`🔍 Getting restriction message for action: ${action}, module: ${module}`);
      
      if (!canPerformAction(action, module)) {
        if (module) {
          return `No tienes permisos para ${action} en el módulo ${module}. Contacta al administrador para habilitar este permiso.`;
        }
        return `No tienes permisos para realizar la acción: ${action}. Contacta al administrador para habilitar este permiso.`;
      }
    }
    return null;
  }, [isApprentice, canPerformAction]);

  // Función para verificar si un método HTTP está permitido
  const isMethodAllowed = useCallback((method) => {
    if (!restrictions || !restrictions.allowed_methods) return true;
    return restrictions.allowed_methods.includes(method.toUpperCase());
  }, [restrictions]);

  // Función para obtener clases CSS condicionales para elementos deshabilitados
  const getDisabledClasses = useCallback((action) => {
    if (!canPerformAction(action)) {
      return 'disabled opacity-50 cursor-not-allowed';
    }
    return '';
  }, [canPerformAction]);

  // Función para mostrar alertas de restricción
  const showRestrictionAlert = useCallback((action) => {
    const message = getRestrictionMessage(action);
    if (message) {
      alert(message); // Puedes reemplazar esto con una librería de notificaciones más elegante
      return true;
    }
    return false;
  }, [getRestrictionMessage]);

  return {
    // Estados
    permissions,
    restrictions,
    loading,
    error,
    
    // Funciones de verificación
    canPerformAction,
    isApprentice,
    isMethodAllowed,
    
    getRestrictionMessage,
    getDisabledClasses,
    showRestrictionAlert,
    
    // Función para recargar permisos
    fetchUserPermissions,
    refreshPermissions: fetchUserPermissions,
    
    // Propiedades de conveniencia
    canCreate: canPerformAction('create'),
    canRead: canPerformAction('read'),
    canUpdate: canPerformAction('update'),
    canWrite: canPerformAction('write'),
  };
};

export default usePermissions;
