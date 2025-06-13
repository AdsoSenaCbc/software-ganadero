import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

// Función para manejar el inicio de sesión
export const loginUser = (event, role, email, password) => {
  event.preventDefault();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Simulación de autenticación (puedes reemplazar con una llamada a una API)
  if (role && email && password) {
    login(role, email.split("@")[0], email); // Usamos el nombre antes del @ como nombre temporal
    Swal.fire({
      title: "Inicio de Sesión",
      text: `Bienvenido ${role} con el correo ${email}`,
      icon: "success",
      confirmButtonText: "Aceptar",
    }).then(() => {
      navigate("/"); // Redirige a la página principal tras iniciar sesión
    });
  } else {
    Swal.fire({
      title: "Error",
      text: "Por favor, complete todos los campos",
      icon: "error",
      confirmButtonText: "Aceptar",
    });
  }
};

// Función para manejar el registro
export const registerUser = (event, role, name, email, password) => {
  event.preventDefault();
  const navigate = useNavigate();

  // Simulación de registro (puedes reemplazar con una llamada a una API)
  if (role && name && email && password) {
    Swal.fire({
      title: "Registro Exitoso",
      text: `Usuario ${name} registrado como ${role} con el correo ${email}`,
      icon: "success",
      confirmButtonText: "Aceptar",
    }).then(() => {
      navigate("/iniciar-sesion"); // Redirige al formulario de inicio de sesión tras registrar
    });
  } else {
    Swal.fire({
      title: "Error",
      text: "Por favor, complete todos los campos",
      icon: "error",
      confirmButtonText: "Aceptar",
    });
  }
};
