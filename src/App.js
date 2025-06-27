// App.js
import React, { useState, useEffect } from "react";
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
import RacionesLactancia from "./pages/Alimentacion/RacionesLactancia";
import ComposicionBronatologica from "./pages/Alimentacion/ComposicionBronatologica";
import Inventario from "./pages/Gestion/Inventario";
import Informe from "./pages/Gestion/Informe";
import Desarrollador from "./pages/Desarrollador";
import Perfil from "./pages/Perfil";
import ChangePassword from "./pages/ChangePassword"; // Importación existente
import "./App.css";
import "./pages/IniciarSesion.css";
import { AuthProvider, useAuth } from "./AuthContext";
import Swal from "sweetalert2";

// Componente para la sección de "¿Olvidaste tu contraseña?"
const ForgotPasswordLink = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleForgotPassword = () => {
    if (loading) return;

    if (user) {
      // Si el usuario está autenticado, redirige a /cambiar-contrasena
      navigate("/cambiar-contrasena");
    } else {
      // Si no está autenticado, muestra un mensaje
      Swal.fire({
        title: "Acceso Restringido",
        text: "Debes iniciar sesión para cambiar tu contraseña. Por favor, inicia sesión primero.",
        icon: "warning",
        confirmButtonText: "Aceptar",
      }).then(() => {
        navigate("/iniciar-sesion");
      });
    }
  };

  return (
    <div className="forgot-password">
      <a href="#" onClick={handleForgotPassword}>
        ¿Olvidaste tu contraseña?
      </a>
    </div>
  );
};

const IniciarSesion = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("Aprendiz");
  const [registerNombres, setRegisterNombres] = useState("");
  const [registerApellidos, setRegisterApellidos] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerDocumento, setRegisterDocumento] = useState("");
  const [registerTelefono, setRegisterTelefono] = useState("");
  const [registerFechaNacimiento, setRegisterFechaNacimiento] = useState("");
  const [registerRole, setRegisterRole] = useState("Aprendiz");
  const [errors, setErrors] = useState({});

  // Validar login
  const validateLogin = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      newErrors.email = "Por favor, ingrese un correo electrónico válido";
    }
    if (!loginPassword) {
      newErrors.password = "La contraseña es requerida";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar registro
  const validateRegister = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const documentoRegex = /^[a-zA-Z0-9]{6,20}$/;
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!registerNombres.trim()) {
      newErrors.nombres = "Los nombres son obligatorios";
    } else if (registerNombres.length < 2) {
      newErrors.nombres = "Los nombres deben tener al menos 2 caracteres";
    }
    if (!registerApellidos.trim()) {
      newErrors.apellidos = "Los apellidos son obligatorios";
    } else if (registerApellidos.length < 2) {
      newErrors.apellidos = "Los apellidos deben tener al menos 2 caracteres";
    }
    if (!emailRegex.test(registerEmail)) {
      newErrors.email = "Por favor, ingrese un correo electrónico válido";
    }
    if (!registerPassword || registerPassword.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    if (!documentoRegex.test(registerDocumento)) {
      newErrors.documento =
        "El documento debe tener 6-20 caracteres alfanuméricos";
    }
    if (registerTelefono && !/^\d{8,15}$/.test(registerTelefono)) {
      newErrors.telefono = "El teléfono debe tener 8-15 dígitos";
    }
    if (registerFechaNacimiento && !fechaRegex.test(registerFechaNacimiento)) {
      newErrors.fechaNacimiento = "Formato de fecha inválido (YYYY-MM-DD)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Alternar entre login y registro
  const toggleForm = () => {
    setShowLoginForm(!showLoginForm);
    setLoginEmail("");
    setLoginPassword("");
    setLoginRole("Aprendiz");
    setRegisterNombres("");
    setRegisterApellidos("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterDocumento("");
    setRegisterTelefono("");
    setRegisterFechaNacimiento("");
    setRegisterRole("Aprendiz");
    setErrors({});
  };

  // Manejar login
  const handleLogin = async (event) => {
    event.preventDefault();
    if (loginEmail && loginPassword) {
      if (validateLogin()) {
        try {
          const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: loginEmail,
              password: loginPassword,
              rol: loginRole,
            }),
          });
          const data = await response.json();

          if (response.ok) {
            const { access_token, usuario } = data;
            const registeredRole = usuario.rol;

            if (loginRole !== registeredRole) {
              Swal.fire({
                title: "Error",
                text: `El usuario está registrado como ${registeredRole}. No puede iniciar sesión como ${loginRole}.`,
                icon: "error",
                confirmButtonText: "Aceptar",
              });
              return;
            }

            login(registeredRole, loginEmail, access_token);
            if (
              registeredRole === "Aprendiz" ||
              registeredRole === "Instructor"
            ) {
              Swal.fire({
                title: "Inicio de Sesión",
                text: `Bienvenido ${registeredRole} con el correo ${loginEmail}`,
                icon: "success",
                confirmButtonText: "Aceptar",
              }).then(() => {
                navigate("/");
              });
            } else if (registeredRole === "Administrador") {
              Swal.fire({
                title: "Inicio de Sesión",
                text: `Bienvenido ${registeredRole} con el correo ${loginEmail}`,
                icon: "success",
                confirmButtonText: "Aceptar",
              });
            }
          } else {
            Swal.fire({
              title: "Error",
              text: data.error || "Credenciales inválidas",
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
    } else {
      Swal.fire({
        title: "Error",
        text: "Por favor, complete todos los campos obligatorios",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  // Manejar registro
  const handleRegister = async (event) => {
    event.preventDefault();
    console.log("Intentando registrar:", {
      nombres: registerNombres,
      apellidos: registerApellidos,
      email: registerEmail,
      password: registerPassword,
      documento: registerDocumento,
      telefono: registerTelefono,
      fecha_nacimiento: registerFechaNacimiento,
      rol: registerRole,
    });
    if (
      registerNombres &&
      registerApellidos &&
      registerEmail &&
      registerPassword &&
      registerDocumento
    ) {
      if (validateRegister()) {
        try {
          const response = await fetch(
            "http://localhost:5000/api/auth/registrar",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombres: registerNombres,
                apellidos: registerApellidos,
                email: registerEmail,
                password: registerPassword,
                documento: registerDocumento,
                telefono: registerTelefono || "",
                fecha_nacimiento: registerFechaNacimiento || "",
                rol: registerRole,
              }),
            }
          );
          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              title: "Registro Exitoso",
              text: `Usuario ${registerNombres} ${registerApellidos} registrado como ${data.usuario.rol}`,
              icon: "success",
              confirmButtonText: "Aceptar",
            }).then(() => {
              setShowLoginForm(true);
              setLoginEmail(registerEmail);
              setLoginPassword(registerPassword);
              setLoginRole(registerRole);
            });
          } else {
            Swal.fire({
              title: "Error",
              text: data.error || "Error al registrar",
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
      } else {
        console.log("Errores de validación:", errors);
        Swal.fire({
          title: "Error de Validación",
          text: "Por favor, corrija los errores en el formulario",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
    } else {
      Swal.fire({
        title: "Error",
        text: "Por favor, complete todos los campos obligatorios",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="container my-4">
      {showLoginForm ? (
        <div className="form-container" id="loginForm">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="loginRole">Rol</label>
              <select
                id="loginRole"
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                required
              >
                <option value="Aprendiz">Aprendiz</option>
                <option value="Instructor">Instructor</option>
                <option value="Administrador">Administrador</option>
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
            <ForgotPasswordLink />
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
              <label htmlFor="registerRole">Rol</label>
              <select
                id="registerRole"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
                required
              >
                <option value="Aprendiz">Aprendiz</option>
                <option value="Instructor">Instructor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="nombres">Nombres</label>
              <input
                type="text"
                id="nombres"
                placeholder="Ingrese sus nombres"
                value={registerNombres}
                onChange={(e) => setRegisterNombres(e.target.value)}
                required
              />
              {errors.nombres && (
                <div className="text-danger">{errors.nombres}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos</label>
              <input
                type="text"
                id="apellidos"
                placeholder="Ingrese sus apellidos"
                value={registerApellidos}
                onChange={(e) => setRegisterApellidos(e.target.value)}
                required
              />
              {errors.apellidos && (
                <div className="text-danger">{errors.apellidos}</div>
              )}
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
              {errors.email && (
                <div className="text-danger">{errors.email}</div>
              )}
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
              {errors.password && (
                <div className="text-danger">{errors.password}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="registerDocumento">Documento</label>
              <input
                type="text"
                id="registerDocumento"
                placeholder="Ingrese su documento"
                value={registerDocumento}
                onChange={(e) => setRegisterDocumento(e.target.value)}
                required
              />
              {errors.documento && (
                <div className="text-danger">{errors.documento}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="registerTelefono">Teléfono (Opcional)</label>
              <input
                type="tel"
                id="registerTelefono"
                placeholder="Ingrese su teléfono"
                value={registerTelefono}
                onChange={(e) => setRegisterTelefono(e.target.value)}
              />
              {errors.telefono && (
                <div className="text-danger">{errors.telefono}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="registerFechaNacimiento">
                Fecha de Nacimiento (Opcional)
              </label>
              <input
                type="date"
                id="registerFechaNacimiento"
                value={registerFechaNacimiento}
                onChange={(e) => setRegisterFechaNacimiento(e.target.value)}
              />
              {errors.fechaNacimiento && (
                <div className="text-danger">{errors.fechaNacimiento}</div>
              )}
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/iniciar-sesion");
    }
  }, [user, loading, navigate]);

  return !loading && user ? children : null;
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
                path="/cambiar-contrasena"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
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
