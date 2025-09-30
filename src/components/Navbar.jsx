import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from './PermissionGuard';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isApprentice, canCreate } = usePermissions();

  const hasPerm = (p) => Array.isArray(user?.permisos) && user.permisos.includes(p);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Software Ganadero</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>Inicio</NavLink>
            </li>
            {user ? (
              <>
                <PermissionGuard action="create" showDisabled={true}>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="registrosDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Registros
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="registrosDropdown">
                      <li>
                        <PermissionGuard action="create" showDisabled={true}>
                          <NavLink className="dropdown-item" to="/registros/hacienda">Registrar Hacienda</NavLink>
                        </PermissionGuard>
                      </li>
                      <li>
                        <PermissionGuard action="create" showDisabled={true}>
                          <NavLink className="dropdown-item" to="/registros/animal">Registrar Animal</NavLink>
                        </PermissionGuard>
                      </li>
                    </ul>
                  </li>
                </PermissionGuard>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="alimentacionDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Alimentación
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="alimentacionDropdown">
                    <li>
                      <NavLink className="dropdown-item" to="/alimentacion/racion">
                        <i className="fas fa-utensils me-2"></i>Ración Animal
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/alimentacion/composicion">
                        <i className="fas fa-flask me-2"></i>Composición Bromatológica
                      </NavLink>
                    </li>
                  </ul>
                </li>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="gestionDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Gestión
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="gestionDropdown">
                    <li>
                      <NavLink className="dropdown-item" to="/gestion/inventario">
                        <i className="fas fa-boxes me-2"></i>Inventario
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/gestion/informe">
                        <i className="fas fa-chart-bar me-2"></i>Informe
                      </NavLink>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/desarrollador">Desarrollador</NavLink>
                </li>
                <li className="nav-item">
                  <div className="nav-link dropdown">
                    <span className="dropdown-toggle" href="#" id="usuarioDropdown" data-bs-toggle="dropdown" role="button" aria-expanded="false">
                      {user.email}
                    </span>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="usuarioDropdown">
                      <li><NavLink className="dropdown-item" to="/perfil">Perfil</NavLink></li>
                      {user?.nombre_rol?.toLowerCase() === 'administrador' && (
                        <>
                          <li><hr className="dropdown-divider" /></li>
                          <li><NavLink className="dropdown-item" to="/admin">Panel de Administración</NavLink></li>
                        </>
                      )}
                      <li><hr className="dropdown-divider" /></li>
                      <li><button className="dropdown-item" onClick={() => { logout(); }}>
                        Cerrar Sesión
                      </button></li>
                    </ul>
                  </div>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <NavLink className="nav-link" to="/iniciar-sesion">Iniciar Sesión</NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;