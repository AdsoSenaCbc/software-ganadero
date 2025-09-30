import { useEffect } from 'react';
import usePermissions from '../hooks/usePermissions';

/**
 * Componente para refrescar permisos automáticamente cuando sea necesario
 */
const PermissionRefresher = () => {
  const { refreshPermissions, isApprentice } = usePermissions();

  useEffect(() => {
    // Refrescar permisos cada 30 segundos si es aprendiz
    // Esto asegura que los cambios del administrador se reflejen rápidamente
    if (isApprentice()) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing permissions for apprentice user');
        refreshPermissions();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [isApprentice, refreshPermissions]);

  // También refrescar cuando la ventana vuelve a tener foco
  useEffect(() => {
    const handleFocus = () => {
      if (isApprentice()) {
        console.log('Window focused, refreshing permissions');
        refreshPermissions();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isApprentice, refreshPermissions]);

  return null; // Este componente no renderiza nada
};

export default PermissionRefresher;
