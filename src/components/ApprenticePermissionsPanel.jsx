/**
 * Panel administrativo para gestionar permisos dinámicos de usuarios aprendices.
 * Permite al administrador habilitar/deshabilitar permisos específicos.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './ApprenticePermissionsPanel.css';

const ApprenticePermissionsPanel = () => {
  const { token } = useAuth();
  const [apprentices, setApprentices] = useState([]);
  const [selectedApprentice, setSelectedApprentice] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Cargar lista de aprendices al montar el componente
  useEffect(() => {
    loadApprentices();
    loadTemplates();
  }, []);

  const makeRequest = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  };

  const loadApprentices = async () => {
    try {
      setLoading(true);
      const data = await makeRequest(`${API_BASE_URL}/admin/apprentices/apprentices`);
      setApprentices(data.apprentices || []);
      setError(null);
    } catch (error) {
      setError('Error al cargar la lista de aprendices: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await makeRequest(`${API_BASE_URL}/admin/apprentices/permissions/templates`);
      setTemplates(data.templates || {});
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadApprenticePermissions = async (userId) => {
    try {
      setLoading(true);
      const data = await makeRequest(`${API_BASE_URL}/admin/apprentices/apprentices/${userId}/permissions`);
      setPermissions(data.permissions);
      setSelectedApprentice(apprentices.find(a => a.id_usuario === userId));
      setError(null);
    } catch (error) {
      setError('Error al cargar permisos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePermissions = async (newPermissions) => {
    if (!selectedApprentice) return;

    try {
      setSaving(true);
      await makeRequest(
        `${API_BASE_URL}/admin/apprentices/apprentices/${selectedApprentice.id_usuario}/permissions`,
        {
          method: 'PUT',
          body: JSON.stringify(newPermissions),
        }
      );

      setPermissions({ ...permissions, ...newPermissions });
      setSuccessMessage('Permisos actualizados exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Recargar lista de aprendices para reflejar cambios
      loadApprentices();
    } catch (error) {
      setError('Error al actualizar permisos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = async (templateKey) => {
    if (!selectedApprentice || !templates[templateKey]) return;

    const templatePermissions = templates[templateKey].permissions;
    await updatePermissions(templatePermissions);
  };

  const enableAllPermissions = async () => {
    if (!selectedApprentice) return;

    try {
      setSaving(true);
      await makeRequest(
        `${API_BASE_URL}/admin/apprentices/apprentices/${selectedApprentice.id_usuario}/permissions/enable-all`,
        { method: 'POST' }
      );

      loadApprenticePermissions(selectedApprentice.id_usuario);
      setSuccessMessage('Todos los permisos habilitados');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error al habilitar permisos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const disableAllPermissions = async () => {
    if (!selectedApprentice) return;

    try {
      setSaving(true);
      await makeRequest(
        `${API_BASE_URL}/admin/apprentices/apprentices/${selectedApprentice.id_usuario}/permissions/disable-all`,
        { method: 'POST' }
      );

      loadApprenticePermissions(selectedApprentice.id_usuario);
      setSuccessMessage('Todos los permisos deshabilitados (solo lectura)');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error al deshabilitar permisos: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = (permissionKey, value) => {
    const newPermissions = { ...permissions, [permissionKey]: value };
    updatePermissions({ [permissionKey]: value });
  };

  const getPermissionStatus = (apprentice) => {
    const perms = apprentice.permissions;
    if (!perms) return 'Sin configurar';
    
    const totalPerms = 13; // Total de permisos disponibles
    const enabledPerms = Object.values(perms).filter(p => p === true).length - 4; // Excluir metadatos
    
    if (enabledPerms === 0) return 'Solo lectura';
    if (enabledPerms === totalPerms) return 'Completo';
    return `Parcial (${enabledPerms}/${totalPerms})`;
  };

  if (loading && apprentices.length === 0) {
    return (
      <div className="apprentice-permissions-panel">
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando aprendices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apprentice-permissions-panel">
      <div className="panel-header">
        <h2>
          <i className="fas fa-user-graduate me-2"></i>
          Gestión de Permisos de Aprendices
        </h2>
        <p className="text-muted">
          Administra los permisos específicos para usuarios con rol de aprendiz
        </p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row">
        {/* Lista de Aprendices */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Usuarios Aprendices ({apprentices.length})
              </h5>
            </div>
            <div className="card-body p-0">
              {apprentices.length === 0 ? (
                <div className="text-center p-4 text-muted">
                  <i className="fas fa-user-slash fa-2x mb-2"></i>
                  <p>No hay usuarios con rol de aprendiz</p>
                </div>
              ) : (
                <div className="apprentice-list">
                  {apprentices.map((apprentice) => (
                    <div
                      key={apprentice.id_usuario}
                      className={`apprentice-item ${
                        selectedApprentice?.id_usuario === apprentice.id_usuario ? 'active' : ''
                      }`}
                      onClick={() => loadApprenticePermissions(apprentice.id_usuario)}
                    >
                      <div className="apprentice-info">
                        <div className="apprentice-name">
                          {apprentice.nombres} {apprentice.apellidos}
                        </div>
                        <div className="apprentice-email text-muted">
                          {apprentice.correo}
                        </div>
                        <div className="apprentice-status">
                          <span className={`badge ${
                            getPermissionStatus(apprentice) === 'Solo lectura' ? 'bg-warning' :
                            getPermissionStatus(apprentice) === 'Completo' ? 'bg-success' :
                            getPermissionStatus(apprentice) === 'Sin configurar' ? 'bg-secondary' :
                            'bg-info'
                          }`}>
                            {getPermissionStatus(apprentice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de Permisos */}
        <div className="col-md-8">
          {selectedApprentice ? (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-key me-2"></i>
                  Permisos de {selectedApprentice.nombres} {selectedApprentice.apellidos}
                </h5>
                <div className="btn-group">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={enableAllPermissions}
                    disabled={saving}
                  >
                    <i className="fas fa-unlock me-1"></i>
                    Habilitar Todo
                  </button>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={disableAllPermissions}
                    disabled={saving}
                  >
                    <i className="fas fa-lock me-1"></i>
                    Solo Lectura
                  </button>
                </div>
              </div>
              
              <div className="card-body">
                {loading ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando permisos...</span>
                    </div>
                  </div>
                ) : permissions ? (
                  <>
                    {/* Plantillas Rápidas */}
                    <div className="mb-4">
                      <h6>Plantillas Rápidas:</h6>
                      <div className="btn-group flex-wrap">
                        {Object.entries(templates).map(([key, template]) => (
                          <button
                            key={key}
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => applyTemplate(key)}
                            disabled={saving}
                            title={template.description}
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Permisos Generales */}
                    <div className="permissions-section mb-4">
                      <h6>Permisos Generales</h6>
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="can_create"
                              checked={permissions.can_create || false}
                              onChange={(e) => handlePermissionChange('can_create', e.target.checked)}
                              disabled={saving}
                            />
                            <label className="form-check-label" htmlFor="can_create">
                              <i className="fas fa-plus text-success me-1"></i>
                              Crear
                            </label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="can_update"
                              checked={permissions.can_update || false}
                              onChange={(e) => handlePermissionChange('can_update', e.target.checked)}
                              disabled={saving}
                            />
                            <label className="form-check-label" htmlFor="can_update">
                              <i className="fas fa-edit text-warning me-1"></i>
                              Actualizar
                            </label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="can_delete"
                              checked={permissions.can_delete || false}
                              onChange={(e) => handlePermissionChange('can_delete', e.target.checked)}
                              disabled={saving}
                            />
                            <label className="form-check-label" htmlFor="can_delete">
                              <i className="fas fa-trash text-danger me-1"></i>
                              Eliminar
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permisos por Módulo */}
                    <div className="permissions-modules">
                      <h6>Permisos por Módulo</h6>
                      
                      {/* Animales */}
                      <div className="module-permissions mb-3">
                        <h6 className="text-primary">
                          <i className="fas fa-paw me-2"></i>
                          Animales
                        </h6>
                        <div className="row">
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_create_animals"
                                checked={permissions.can_create_animals || false}
                                onChange={(e) => handlePermissionChange('can_create_animals', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_create_animals">
                                Crear Animales
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_update_animals"
                                checked={permissions.can_update_animals || false}
                                onChange={(e) => handlePermissionChange('can_update_animals', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_update_animals">
                                Actualizar Animales
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_delete_animals"
                                checked={permissions.can_delete_animals || false}
                                onChange={(e) => handlePermissionChange('can_delete_animals', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_delete_animals">
                                Eliminar Animales
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Haciendas */}
                      <div className="module-permissions mb-3">
                        <h6 className="text-success">
                          <i className="fas fa-home me-2"></i>
                          Haciendas
                        </h6>
                        <div className="row">
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_create_haciendas"
                                checked={permissions.can_create_haciendas || false}
                                onChange={(e) => handlePermissionChange('can_create_haciendas', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_create_haciendas">
                                Crear Haciendas
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_update_haciendas"
                                checked={permissions.can_update_haciendas || false}
                                onChange={(e) => handlePermissionChange('can_update_haciendas', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_update_haciendas">
                                Actualizar Haciendas
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_delete_haciendas"
                                checked={permissions.can_delete_haciendas || false}
                                onChange={(e) => handlePermissionChange('can_delete_haciendas', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_delete_haciendas">
                                Eliminar Haciendas
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Raciones */}
                      <div className="module-permissions mb-3">
                        <h6 className="text-info">
                          <i className="fas fa-utensils me-2"></i>
                          Raciones
                        </h6>
                        <div className="row">
                          <div className="col-md-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_create_raciones"
                                checked={permissions.can_create_raciones || false}
                                onChange={(e) => handlePermissionChange('can_create_raciones', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_create_raciones">
                                Crear Raciones
                              </label>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_update_raciones"
                                checked={permissions.can_update_raciones || false}
                                onChange={(e) => handlePermissionChange('can_update_raciones', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_update_raciones">
                                Actualizar Raciones
                              </label>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_delete_raciones"
                                checked={permissions.can_delete_raciones || false}
                                onChange={(e) => handlePermissionChange('can_delete_raciones', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_delete_raciones">
                                Eliminar Raciones
                              </label>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="can_calculate_raciones"
                                checked={permissions.can_calculate_raciones || false}
                                onChange={(e) => handlePermissionChange('can_calculate_raciones', e.target.checked)}
                                disabled={saving}
                              />
                              <label className="form-check-label" htmlFor="can_calculate_raciones">
                                Calcular Raciones
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información de Modificación */}
                    {permissions.fecha_modificacion && (
                      <div className="mt-4 p-3 bg-light rounded">
                        <small className="text-muted">
                          <i className="fas fa-info-circle me-1"></i>
                          Última modificación: {new Date(permissions.fecha_modificacion).toLocaleString()}
                          {permissions.modificado_por && ` por usuario ID: ${permissions.modificado_por}`}
                        </small>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 text-muted">
                    <i className="fas fa-exclamation-circle fa-2x mb-2"></i>
                    <p>Error al cargar los permisos</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center p-5">
                <i className="fas fa-hand-pointer fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Selecciona un aprendiz</h5>
                <p className="text-muted">
                  Selecciona un usuario aprendiz de la lista para gestionar sus permisos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprenticePermissionsPanel;
