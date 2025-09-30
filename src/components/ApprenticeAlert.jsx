/**
 * Componente para mostrar alertas específicas para usuarios aprendices.
 * Informa sobre las restricciones de permisos de manera clara y amigable.
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const ApprenticeAlert = ({ action, className = '' }) => {
  const { isApprentice, getRestrictionMessage } = usePermissions();

  if (!isApprentice()) {
    return null;
  }

  const message = getRestrictionMessage(action);

  if (!message) {
    return null;
  }

  return (
    <div className={`alert alert-warning d-flex align-items-center ${className}`} role="alert">
      <i className="fas fa-exclamation-triangle me-2"></i>
      <div>
        <strong>Acceso Restringido:</strong> {message}
      </div>
    </div>
  );
};

// Componente para mostrar un banner general de restricciones para aprendices
export const ApprenticeRestrictionBanner = ({ className = '' }) => {
  const { isApprentice } = usePermissions();

  if (!isApprentice()) {
    return null;
  }

  return (
    <div className={`alert alert-info d-flex align-items-center ${className}`} role="alert">
      <i className="fas fa-info-circle me-2"></i>
      <div>
        <strong>Modo de Solo Lectura:</strong> Como usuario aprendiz, solo puedes consultar información. 
        No tienes permisos para crear, modificar o eliminar contenido.
      </div>
    </div>
  );
};

export default ApprenticeAlert;
