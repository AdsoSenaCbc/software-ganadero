import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../api/axiosConfig';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, ingrese su correo electrónico',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, ingrese un correo electrónico válido',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/forgot-password', {
        correo: email
      });

      if (response.status === 200) {
        setEmailSent(true);
        Swal.fire({
          title: 'Correo Enviado',
          text: 'Si el correo existe en nuestro sistema, se ha enviado un enlace de recuperación. Por favor, revise su bandeja de entrada y carpeta de spam.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al enviar el correo de recuperación. Por favor, inténtelo de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container my-4">
        <div className="forgot-password-container">
          <div className="success-message">
            <div className="success-icon">
              <i className="fas fa-envelope-circle-check"></i>
            </div>
            <h2>Correo Enviado</h2>
            <p>
              Si el correo <strong>{email}</strong> está registrado en nuestro sistema, 
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <div className="instructions">
              <h4>Instrucciones:</h4>
              <ul>
                <li>Revisa tu bandeja de entrada</li>
                <li>Verifica también la carpeta de spam</li>
                <li>El enlace expirará en 24 horas</li>
                <li>Solo puedes usar el enlace una vez</li>
              </ul>
            </div>
            <div className="action-buttons">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
              >
                Enviar a otro correo
              </button>
              <Link to="/iniciar-sesion" className="btn-primary">
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
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <div className="icon">
            <i className="fas fa-key"></i>
          </div>
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>
            No te preocupes, ingresa tu correo electrónico y te enviaremos 
            un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="Ingrese su correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Enviando...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Enviar enlace de recuperación
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

export default ForgotPassword;
