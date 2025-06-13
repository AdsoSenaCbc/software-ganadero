import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Inicio from "./pages/Inicio";
import RegistrarHacienda from "./pages/Registros/RegistrarHacienda";
import RegistrarAnimal from "./pages/Registros/RegistrarAnimal";
import RacionAnimal from "./pages/Alimentacion/RacionAnimal";
import RacionesCeba from "./pages/Alimentacion/RacionesCeba";
import RacionesLactancia from "./pages/Alimentacion/RacionesLactancia"; // Actualizado a RacionesLactancia
import ComposicionBronatologica from "./pages/Alimentacion/ComposicionBronatologica";
import Inventario from "./pages/Gestion/Inventario";
import Informe from "./pages/Gestion/Informe";
import Desarrollador from "./pages/Desarrollador";
import Perfil from "./pages/Perfil";
import "./App.css";
import "./pages/IniciarSesion.css";
import { AuthProvider, useAuth } from "./AuthContext";
import Swal from "sweetalert2";

const IniciarSesion = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [loginRole, setLoginRole] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("aprendiz");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validateLogin = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!emailRegex.test(loginEmail)) {
      newErrors.email = "Por favor, ingrese un correo electrónico válido";
    }

    if (!passwordRegex.test(loginPassword)) {
      newErrors.password =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleForm = () => {
    setShowLoginForm(!showLoginForm);
    setLoginRole("");
    setLoginEmail("");
    setLoginPassword("");
    setRegisterRole("aprendiz");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setErrors({});
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (loginRole && loginEmail && loginPassword) {
      if (validateLogin()) {
        login(loginRole, loginEmail.split("@")[0], loginEmail);
        Swal.fire({
          title: "Inicio de Sesión",
          text: `Bienvenido ${loginRole} con el correo ${loginEmail}`,
          icon: "success",
          confirmButtonText: "Aceptar",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/");
          }
        });
      }
    } else {
      Swal.fire({
        title: "Error",
        text: "Por favor, complete todos los campos",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (registerRole && registerName && registerEmail && registerPassword) {
      Swal.fire({
        title: "Registro Exitoso",
        text: `Usuario ${registerName} registrado como ${registerRole} con el correo ${registerEmail}`,
        icon: "success",
        confirmButtonText: "Aceptar",
      }).then(() => {
        toggleForm();
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

  return (
    <div className="container my-4">
      {showLoginForm ? (
        <div className="form-container" id="loginForm">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="role">Tipo de Rol</label>
              <select
                id="role"
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                required
              >
                <option value="" disabled>
                  Seleccione su rol
                </option>
                <option value="aprendiz">Aprendiz</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="Ingrese su correo"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              {errors.email && (
                <div className="text-danger">{errors.email}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="Ingrese su contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              {errors.password && (
                <div className="text-danger">{errors.password}</div>
              )}
            </div>
            <div className="button-group">
              <button type="button" onClick={toggleForm}>
                Registro
              </button>
              <button type="submit">Iniciar Sesión</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="form-container" id="registerForm">
          <h2>Registro</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="registerRole">Tipo de Rol</label>
              <select
                id="registerRole"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
                required
              >
                <option value="aprendiz">Aprendiz</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="name">Nombres y Apellidos</label>
              <input
                type="text"
                id="name"
                placeholder="Ingrese sus nombres y apellidos"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="registerEmail">Correo Electrónico</label>
              <input
                type="email"
                id="registerEmail"
                placeholder="Ingrese su correo"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="registerPassword">Contraseña</label>
              <input
                type="password"
                id="registerPassword"
                placeholder="Ingrese su contraseña"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>
            <div className="button-group">
              <button type="button" onClick={toggleForm}>
                Iniciar Sesión
              </button>
              <button type="submit">Registrarme</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="container my-4">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/iniciar-sesion" element={<IniciarSesion />} />
              <Route
                path="/registros/hacienda"
                element={
                  <ProtectedRoute>
                    <RegistrarHacienda />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registros/animal"
                element={
                  <ProtectedRoute>
                    <RegistrarAnimal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alimentacion/racion"
                element={
                  <ProtectedRoute>
                    <RacionAnimal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alimentacion/racion-ceba"
                element={
                  <ProtectedRoute>
                    <RacionesCeba />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alimentacion/racion-lactancia"
                element={
                  <ProtectedRoute>
                    <RacionesLactancia />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alimentacion/composicion"
                element={
                  <ProtectedRoute>
                    <ComposicionBronatologica />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gestion/inventario"
                element={
                  <ProtectedRoute>
                    <Inventario />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gestion/informe"
                element={
                  <ProtectedRoute>
                    <Informe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/desarrollador"
                element={
                  <ProtectedRoute>
                    <Desarrollador />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <footer
            style={{ backgroundColor: "#00324C" }}
            className="text-white text-center py-3 mt-auto"
          >
            <p>Software Ganadero © 2025</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
