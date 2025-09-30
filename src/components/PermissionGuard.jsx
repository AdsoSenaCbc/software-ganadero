/**
 * Componente para controlar la visibilidad y funcionalidad de elementos basado en permisos.
 * Especialmente útil para restringir acciones de usuarios aprendices.
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const PermissionGuard = ({ 
  children, 
  action, 
  fallback = null, 
  showDisabled = false,
  onRestricted = null 
}) => {
  const { canPerformAction, getDisabledClasses, showRestrictionAlert } = usePermissions();

  const isAllowed = canPerformAction(action);

  // Si no está permitido y no queremos mostrar deshabilitado, mostrar fallback
  if (!isAllowed && !showDisabled) {
    return fallback;
  }

  // Si no está permitido pero queremos mostrar deshabilitado
  if (!isAllowed && showDisabled) {
    return React.cloneElement(children, {
      className: `${children.props.className || ''} ${getDisabledClasses(action)}`.trim(),
      disabled: true,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRestricted) {
          onRestricted(action);
        } else {
          showRestrictionAlert(action);
        }
      }
    });
  }

  // Si está permitido, renderizar normalmente
  return children;
};

export default PermissionGuard;
