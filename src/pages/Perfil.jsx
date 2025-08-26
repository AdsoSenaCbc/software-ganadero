import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaTag, FaEdit, FaSave } from 'react-icons/fa';
import userPerfil from '../assets/images/user_perfil.png';
import './Perfil.css';
import Swal from 'sweetalert2';

const Perfil = () => {
  const { user, token, logout, login } = useAuth();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    role: user?.role || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState({});
  const [imageMsg, setImageMsg] = useState('Formatos: JPG, PNG, WEBP. Máx 5MB. Óptimo: 500x500px');
  const [imageError, setImageError] = useState('');

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  // Nombre a mostrar: preferir el nombre editado, luego el del contexto, luego el correo (antes de @)
  const displayName = (editedUser.name && editedUser.name.trim())
    ? editedUser.name
    : (user?.name && user.name.trim())
      ? user.name
      : (user?.email ? user.email.split('@')[0] : 'Usuario');

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Reset messages
    setImageError('');

    // Type validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }

    // Size validation
    if (file.size > MAX_SIZE_BYTES) {
      setImageError('El archivo supera 5MB. Reduce el tamaño e inténtalo de nuevo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // Dimension validation via Image()
      const img = new Image();
      img.onload = () => {
        // Ocultar mensajes de dimensiones tras carga exitosa
        setImageMsg('');
        setImagePreview(dataUrl);
      };
      img.onerror = () => {
        setImageError('No se pudo leer la imagen. Intenta con otro archivo.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => setImageError('Error leyendo el archivo.');
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageMsg('Formatos: JPG, PNG, WEBP. Máx 5MB. Óptimo: 500x500px');
    setImageError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editedUser.name.trim()) newErrors.name = 'El nombre es requerido';
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
      // AuthContext.login expects (role, email, accessToken, permisos)
      // Reutilizamos el token actual y permisos actuales si existen
      login(user.role, editedUser.email, token, user?.permisos || []);
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    // Prefill con datos actuales del usuario
    const fallbackName = user?.name && user.name.trim()
      ? user.name
      : (user?.email ? user.email.split('@')[0] : '');
    setEditedUser({
      name: fallbackName,
      role: user?.role || editedUser.role || '',
      email: user?.email || editedUser.email || '',
    });
    setIsEditing(true);
  };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tu sesión se cerrará y volverás a la página de inicio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/');
        Swal.fire('Sesión cerrada', 'Has salido correctamente.', 'success');
      }
    });
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
          <h4>Bienvenido, {displayName}</h4>
        </div>
        {!isEditing && (
          <button className="btn btn-secondary edit-btn" onClick={handleStartEdit}>
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
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className="upload-hints">
          {imageError ? (
            <span className="error-text">{imageError}</span>
          ) : (!imagePreview && imageMsg ? (
            <span className="hint-text">{imageMsg}</span>
          ) : null)}
        </div>
        {imagePreview && (
          <div className="image-actions">
            <button type="button" className="btn btn-outline-danger remove-image-btn" onClick={handleRemoveImage}>
              Eliminar foto
            </button>
          </div>
        )}
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
              <input
                type="text"
                value={user.role}
                className="profile-input"
                disabled
                readOnly
              />
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
              <div className="profile-info-value">{displayName}</div>
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