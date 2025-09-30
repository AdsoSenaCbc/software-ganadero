import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../api/axiosConfig';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      validateToken(tokenFromUrl);
    } else {
      setValidatingToken(false);
      setTokenValid(false);
    }
  }, [searchParams]);

  const validateToken = async (tokenToValidate) => {
    try {
      const response = await axiosInstance.post('/auth/validate-reset-token', {
        token: tokenToValidate
      });

      if (response.data.valid) {
        setTokenValid(true);
        setUserEmail(response.data.user_email || '');
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debe confirmar la contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        token: token,
        password: password
      });

      if (response.status === 200) {
        Swal.fire({
          title: 'Contraseña Actualizada',
          text: 'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
          icon: 'success',
          confirmButtonText: 'Ir a Iniciar Sesión'
        }).then(() => {
          navigate('/iniciar-sesion');
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      const errorMessage = error.response?.data?.error || 'Hubo un problema al actualizar la contraseña';
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="container my-4">
        <div className="reset-password-container">
          <div className="loading-message">
            <div className="loading-icon">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <h2>Validando enlace...</h2>
            <p>Por favor espere mientras verificamos su enlace de recuperación.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="container my-4">
        <div className="reset-password-container">
          <div className="error-message">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2>Enlace Inválido o Expirado</h2>
            <p>
              El enlace de recuperación de contraseña no es válido o ha expirado. 
              Esto puede suceder por las siguientes razones:
            </p>
            <ul className="error-reasons">
              <li>El enlace ha expirado (los enlaces son válidos por 24 horas)</li>
              <li>El enlace ya fue utilizado</li>
              <li>El enlace está malformado o incompleto</li>
            </ul>
            <div className="action-buttons">
              <Link to="/forgot-password" className="btn-primary">
                Solicitar nuevo enlace
              </Link>
              <Link to="/iniciar-sesion" className="btn-secondary">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <div className="icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2>Restablecer Contraseña</h2>
          {userEmail && (
            <p>Creando nueva contraseña para: <strong>{userEmail}</strong></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="Ingrese su nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            {errors.password && (
              <div className="error-text">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirme su nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
            {errors.confirmPassword && (
              <div className="error-text">{errors.confirmPassword}</div>
            )}
          </div>

          <div className="password-requirements">
            <h4>Requisitos de la contraseña:</h4>
            <ul>
              <li className={password.length >= 6 ? 'valid' : ''}>
                <i className={`fas ${password.length >= 6 ? 'fa-check' : 'fa-times'}`}></i>
                Al menos 6 caracteres
              </li>
              <li className={password === confirmPassword && password ? 'valid' : ''}>
                <i className={`fas ${password === confirmPassword && password ? 'fa-check' : 'fa-times'}`}></i>
                Las contraseñas coinciden
              </li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Actualizando...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Actualizar Contraseña
              </>
            )}
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/iniciar-sesion">
            <i className="fas fa-arrow-left"></i>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
