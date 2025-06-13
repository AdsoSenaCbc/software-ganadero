import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaTag, FaEdit, FaSave } from 'react-icons/fa';
import userPerfil from '../assets/images/user_perfil.png';
import './Perfil.css';

const Perfil = () => {
  const { user, updateProfileImage, logout, login } = useAuth();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    role: user?.role || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        updateProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editedUser.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!editedUser.role.trim()) newErrors.role = 'El rol es requerido';
    if (!editedUser.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedUser.email)) {
      newErrors.email = 'El correo no es válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      login(editedUser.role, editedUser.name, editedUser.email);
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return (
    <div className="profile-container">
      {/* Encabezado con botón Editar Perfil */}
      <div className="profile-header">
        <div>
          <h2>Perfil de Usuario</h2>
          <h4>Bienvenido, {user.name}</h4>
        </div>
        {!isEditing && (
          <button className="btn btn-secondary edit-btn" onClick={() => setIsEditing(true)}>
            <FaEdit /> Editar Perfil
          </button>
        )}
      </div>

      {/* Sección de Imagen de Perfil */}
      <div className="profile-image-section">
        <div className="profile-image-wrapper">
        <img src={imagePreview || userPerfil} alt="Imagen de Perfil" className="profile-image" />
          <label htmlFor="profileImageInput" className="profile-image-upload">
            +
            <input
              type="file"
              id="profileImageInput"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Sección de Información del Usuario */}
      <div className="profile-info-section">
        <h5>Información Personal</h5>
        {isEditing ? (
          <>
            <div className="profile-info-item">
              <div className="profile-info-label">
                <FaUser className="profile-icon" />
                <span>Nombre:</span>
              </div>
              <input
                type="text"
                name="name"
                value={editedUser.name}
                onChange={handleEditChange}
                className="profile-input"
              />
              {errors.name && <div className="text-danger">{errors.name}</div>}
            </div>
            <div className="profile-info-item">
              <div className="profile-info-label">
                <FaTag className="profile-icon" />
                <span>Rol:</span>
              </div>
              <select
                name="role"
                value={editedUser.role}
                onChange={handleEditChange}
                className="profile-input"
              >
                <option value="aprendiz">Aprendiz</option>
                <option value="instructor">Instructor</option>
              </select>
              {errors.role && <div className="text-danger">{errors.role}</div>}
            </div>
            <div className="profile-info-item">
              <div className="profile-info-label">
                <FaEnvelope className="profile-icon" />
                <span>Correo Electrónico:</span>
              </div>
              <input
                type="email"
                name="email"
                value={editedUser.email}
                onChange={handleEditChange}
                className="profile-input"
              />
              {errors.email && <div className="text-danger">{errors.email}</div>}
            </div>
            <div className="profile-actions-section edit-mode">
              <button className="btn btn-success me-2" onClick={handleSave}>
                <FaSave /> Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="profile-info-item">
              <div className="profile-info-label">
                <FaUser className="profile-icon" />
                <span>Nombre:</span>
              </div>
              <div className="profile-info-value">{user.name}</div>
            </div>
            <div className="profile-info-item">
              <div className="profile-info-label">
                <FaTag className="profile-icon" />
                <span>Rol:</span>
              </div>
              <div className="profile-info-value">{user.role}</div>
            </div>
            <div className="profile-info-item">
              <div className="profile-info-label">
                <FaEnvelope className="profile-icon" />
                <span>Correo Electrónico:</span>
              </div>
              <div className="profile-info-value">{user.email}</div>
            </div>
          </>
        )}
      </div>

      {/* Sección de Cerrar Sesión */}
      <div className="logout-section">
        <button className="btn btn-danger" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Perfil;