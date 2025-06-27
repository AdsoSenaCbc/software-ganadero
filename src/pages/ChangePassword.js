// src/pages/ChangePassword.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Swal from "sweetalert2";
import "./ChangePassword.css"; // Importa el archivo CSS

const ChangePassword = () => {
  const { token } = useAuth(); // Obtener el token del contexto
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState({});

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    if (!currentPassword)
      newErrors.currentPassword = "La contraseña actual es requerida";
    if (!newPassword)
      newErrors.newPassword = "La nueva contraseña es requerida";
    else if (newPassword.length < 6)
      newErrors.newPassword =
        "La nueva contraseña debe tener al menos 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambio de contraseña
  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch("http://localhost:5000/cambiar-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Enviar token JWT
          },
          body: JSON.stringify({
            password_actual: currentPassword,
            password_nueva: newPassword,
          }),
        });
        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            title: "Éxito",
            text: data.message || "Contraseña cambiada exitosamente",
            icon: "success",
            confirmButtonText: "Aceptar",
          }).then(() => {
            navigate("/iniciar-sesion"); // Redirigir al login tras éxito
          });
        } else {
          Swal.fire({
            title: "Error",
            text: data.error || "No se pudo cambiar la contraseña",
            icon: "error",
            confirmButtonText: "Aceptar",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "No se pudo conectar con el servidor. Verifique que el backend esté activo en http://localhost:5000",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
    }
  };

  return (
    <div className="container my-4">
      <div className="change-password-container">
        <div className="card">
          <div className="card-header text-center">
            <h2>Cambiar Contraseña</h2>
          </div>
          <div className="card-body">
            <form
              onSubmit={handleChangePassword}
              className="change-password-form"
            >
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className="form-control"
                  placeholder="Ingrese su contraseña actual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                {errors.currentPassword && (
                  <div className="text-danger">{errors.currentPassword}</div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  placeholder="Ingrese su nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                {errors.newPassword && (
                  <div className="text-danger">{errors.newPassword}</div>
                )}
              </div>
              <div className="button-group mt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/perfil")}
                >
                  Volver
                </button>
                <button type="submit" className="btn btn-primary">
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
