import React, { useState } from 'react';
import { useAdminPanel } from '../hooks/useAdminPanel';
import ApprenticePermissionsPanel from '../components/ApprenticePermissionsPanel';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' o 'apprentice-permissions'
  
  const {
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
    refreshData
  } = useAdminPanel();

  if (loading) {
    return (
      <div className="admin-panel-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={refreshData} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <p>Gestión de usuarios del sistema</p>
        
        {/* Pestañas de Navegación */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users me-2"></i>
            Gestión de Usuarios
          </button>
          <button
            className={`tab-button ${activeTab === 'apprentice-permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('apprentice-permissions')}
          >
            <i className="fas fa-user-graduate me-2"></i>
            Permisos de Aprendices
          </button>
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'users' ? (
        <div className="users-management-content">
          {/* Estadísticas */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.total_users || 0}</h3>
                <p>Total Usuarios</p>
              </div>
            </div>
            <div className="stat-card active">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.active_users || 0}</h3>
                <p>Usuarios Activos</p>
              </div>
            </div>
            <div className="stat-card inactive">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <h3>{stats.inactive_users || 0}</h3>
                <p>Usuarios Inactivos</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔐</div>
              <div className="stat-content">
                <h3>{roles.length || 0}</h3>
                <p>Roles Disponibles</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filters-section">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Estado:</label>
                <select
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Rol:</label>
                <select
                  value={filters.rol_id}
                  onChange={(e) => handleFilterChange('rol_id', e.target.value)}
                >
                  <option value="">Todos los roles</option>
                  {roles.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Buscar:</label>
                <input
                  type="text"
                  placeholder="Nombre, correo o documento..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
              
              <div className="filter-actions">
                <button onClick={applyFilters} className="btn btn-primary">
                  Filtrar
                </button>
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="users-section">
            <div className="section-header">
              <h2>Usuarios ({pagination.total})</h2>
            </div>
            
            {users.length === 0 ? (
              <div className="no-users">
                <p>No se encontraron usuarios con los filtros aplicados.</p>
              </div>
            ) : (
              <React.Fragment>
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Documento</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(usuario => (
                        <tr key={usuario.id_usuario} className={!usuario.activo ? 'inactive-user' : ''}>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar">
                                {usuario.nombres.charAt(0)}{usuario.apellidos.charAt(0)}
                              </div>
                              <div>
                                <div className="user-name">
                                  {usuario.nombres} {usuario.apellidos}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{usuario.documento}</td>
                          <td>{usuario.correo}</td>
                          <td>{usuario.telefono}</td>
                          <td>
                            <span className={`role-badge role-${usuario.nombre_rol?.toLowerCase()}`}>
                              {usuario.nombre_rol}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${usuario.activo ? 'active' : 'inactive'}`}>
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            {usuario.fecha_creacion ? 
                              new Date(usuario.fecha_creacion).toLocaleDateString() : 
                              'N/A'
                            }
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => toggleUserStatus(usuario.id_usuario)}
                                className={`btn btn-sm ${usuario.activo ? 'btn-warning' : 'btn-success'}`}
                                title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              >
                                {usuario.activo ? '🔒' : '🔓'}
                              </button>
                              
                              <select
                                value={usuario.id_rol}
                                onChange={(e) => changeUserRole(usuario.id_usuario, parseInt(e.target.value))}
                                className="role-select"
                                title="Cambiar rol"
                              >
                                {roles.map(rol => (
                                  <option key={rol.id_rol} value={rol.id_rol}>
                                    {rol.nombre_rol}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => changePage(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                      className="btn btn-secondary"
                    >
                      Anterior
                    </button>
                    
                    <div className="page-info">
                      Página {pagination.current_page} de {pagination.pages}
                    </div>
                    
                    <button
                      onClick={() => changePage(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                      className="btn btn-secondary"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        </div>
      ) : (
        <ApprenticePermissionsPanel />
      )}
    </div>
  );
};

export default AdminPanel;
