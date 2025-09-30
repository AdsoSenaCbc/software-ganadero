/**
 * Componente de ejemplo que muestra cómo implementar restricciones de aprendiz en formularios.
 * Sirve como plantilla para otros formularios del sistema.
 */

import React, { useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from './PermissionGuard';
import ApprenticeAlert, { ApprenticeRestrictionBanner } from './ApprenticeAlert';

const RestrictedForm = ({ 
  title = "Formulario con Restricciones",
  onSubmit,
  children,
  submitAction = "create",
  className = ""
}) => {
  const { 
    canPerformAction, 
    isApprentice, 
    getDisabledClasses,
    showRestrictionAlert 
  } = usePermissions();
  
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar permisos antes de enviar
    if (!canPerformAction(submitAction)) {
      showRestrictionAlert(submitAction);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error al procesar el formulario: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isApprentice() && !canPerformAction(submitAction);

  return (
    <div className={`restricted-form ${className}`}>
      {/* Banner informativo para aprendices */}
      <ApprenticeRestrictionBanner className="mb-3" />
      
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{title}</h5>
          {isApprentice() && (
            <span className="badge bg-warning text-dark">
              <i className="fas fa-eye me-1"></i>
              Solo Lectura
            </span>
          )}
        </div>
        
        <div className="card-body">
          {/* Alerta específica para la acción */}
          <ApprenticeAlert action={submitAction} className="mb-3" />
          
          <form onSubmit={handleSubmit}>
            {/* Contenido del formulario */}
            <fieldset disabled={isFormDisabled}>
              {children || (
                <>
                  <div className="mb-3">
                    <label htmlFor="ejemplo" className="form-label">Campo de Ejemplo</label>
                    <input
                      type="text"
                      className="form-control"
                      id="ejemplo"
                      name="ejemplo"
                      value={formData.ejemplo || ''}
                      onChange={handleInputChange}
                      placeholder="Ingresa un valor"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      id="descripcion"
                      name="descripcion"
                      rows="3"
                      value={formData.descripcion || ''}
                      onChange={handleInputChange}
                      placeholder="Ingresa una descripción"
                    />
                  </div>
                </>
              )}
            </fieldset>
            
            {/* Botones de acción */}
            <div className="d-flex justify-content-between align-items-center">
              <div>
                {isApprentice() && (
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Los campos están deshabilitados porque eres un usuario aprendiz
                  </small>
                )}
              </div>
              
              <div className="btn-group">
                <PermissionGuard action="read">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => window.history.back()}
                  >
                    <i className="fas fa-arrow-left me-1"></i>
                    Volver
                  </button>
                </PermissionGuard>
                
                <PermissionGuard 
                  action={submitAction} 
                  showDisabled={true}
                  onRestricted={(action) => {
                    alert(`No tienes permisos para ${action}. Solo puedes consultar información.`);
                  }}
                >
                  <button
                    type="submit"
                    className={`btn btn-primary ${getDisabledClasses(submitAction)}`}
                    disabled={isSubmitting || isFormDisabled}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-1"></i>
                        Guardar
                      </>
                    )}
                  </button>
                </PermissionGuard>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestrictedForm;
