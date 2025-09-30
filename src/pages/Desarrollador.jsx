import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import './Desarrollador.css';

const Desarrollador = () => {
  const navigate = useNavigate();

  const handleDocumentation = () => {
    Swal.fire({
      title: 'Redirigiendo a la documentación',
      text: 'Cargando documentación...',
      icon: 'info',
      confirmButtonText: 'Okay',
    }).then(() => {
      // Abrir el manual en una nueva pestaña de forma segura
      const url = 'https://adsosenacbc.github.io/manuales_software_ganadero/';
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (win) {
        win.opener = null;
      }
    });
  };

  const handleSourceCode = () => {
    Swal.fire({
      title: 'Accediendo al Código Fuente',
      text: 'Redirigiendo a GitHub para ver el código fuente...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      const win = window.open('https://github.com/AdsoSenaCbc', '_blank', 'noopener,noreferrer');
      if (win) {
        win.opener = null;
      }
    });
  };

  return (
    <div className="developer-container">
      <div className="developer-header">
        <div className="logo-placeholder">CBC</div>
        <h1>CBC Software</h1>
        <p className="slogan">Soluciones Tecnológicas para la Ganadería Moderna</p>
      </div>

      <div className="developer-content">
        <section className="about-section">
          <h2>Sobre el Desarrollo</h2>
          <p>
            Bovinos App es una solución integral desarrollada por CBC Software para la gestión eficiente de hatos ganaderos. Nuestra aplicación combina tecnología moderna con funcionalidades diseñadas específicamente para las necesidades del sector ganadero. Utilizamos las últimas tecnologías en desarrollo web para ofrecer una experiencia de usuario fluida, segura y accesible desde cualquier dispositivo.
          </p>
          <p>
            Con Bovinos App, los ganaderos pueden gestionar registros de animales, analizar datos bromatológicos y optimizar la productividad de sus hatos. Nuestro enfoque se centra en la innovación y la sostenibilidad, proporcionando herramientas que facilitan la toma de decisiones informadas.
          </p>
        </section>

        <section className="tech-section">
          <h2>Tecnologías Utilizadas</h2>
          <div className="tech-icons">
            <span className="tech-icon">React</span>
            <span className="tech-icon">Material-UI</span>
            <span className="tech-icon">MySql</span>
            <span className="tech-icon">PhpMyAdmin</span>
            <span className="tech-icon">GraphQL</span>
          </div>
        </section>

        <section className="contact-section">
          <h2>Contacto</h2>
          <ul className="contact-list">
            <li>
              <span className="contact-icon">📧</span> Correo Electrónico: <a href="mailto:cbsoftware@bovinosapp.com">servicioalciudadano@sena.edu.co</a>
            </li>
            <li>
              <span className="contact-icon">📞</span> Teléfono: 5710101
            </li>
            <li>
              <span className="contact-icon">📍</span> Dirección: Km. 7 Vía a La Paz Valledupar
            </li>
          </ul>
        </section>

        <section className="actions-section">
          <h2>Recursos</h2>
          <div className="action-buttons">
            <button className="btn btn-documentation" onClick={handleDocumentation}>
              Manuales
            </button>
            <button className="btn btn-source" onClick={handleSourceCode}>
              Git Hub
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Desarrollador;