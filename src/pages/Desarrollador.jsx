import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import './Desarrollador.css';

const Desarrollador = () => {
  const navigate = useNavigate();

  const handleDocumentation = () => {
    Swal.fire({
      title: 'Descargando Documentación',
      text: 'La documentación de Bovinos Pro v1.0 se está descargando...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      // Simulación de descarga (en un proyecto real, aquí iría la lógica de descarga)
      const link = document.createElement('a');
      link.href = 'https://example.com/bovinos-documentation.pdf'; // URL ficticia
      link.download = 'Bovinos_Pro_v1.0_Documentation.pdf';
      link.click();
    });
  };

  const handleSourceCode = () => {
    Swal.fire({
      title: 'Accediendo al Código Fuente',
      text: 'Redirigiendo a GitHub para ver el código fuente...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      window.open('https://github.com/cbc-software', '_blank');
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
              <span className="contact-icon">📧</span> Correo Electrónico: <a href="mailto:cbsoftware@bovinosapp.com">cbsoftware@bovinosapp.com</a>
            </li>
            <li>
              <span className="contact-icon">📞</span> Teléfono: +57 123 456 7890
            </li>
            <li>
              <span className="contact-icon">📍</span> Dirección: Calle 123 #45-67, Bogotá, Colombia
            </li>
            <li>
              <span className="contact-icon">🌐</span> Sitio Web: <a href="https://www.bovinosapp.com" target="_blank" rel="noopener noreferrer">www.bovinosapp.com</a>
            </li>
            <li>
              <span className="contact-icon">💻</span> GitHub: <a href="https://github.com/cbc-software" target="_blank" rel="noopener noreferrer">github.com/cbc-software</a>
            </li>
          </ul>
        </section>

        <section className="actions-section">
          <h2>Recursos</h2>
          <div className="action-buttons">
            <button className="btn btn-documentation" onClick={handleDocumentation}>
              Documentación
            </button>
            <button className="btn btn-source" onClick={handleSourceCode}>
              Código Fuente
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Desarrollador;