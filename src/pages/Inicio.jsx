import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'react-bootstrap';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './Inicio.css';
import { useAuth } from '../AuthContext';

// Importar imágenes desde src/assets/images/
import Ganaderia1 from '../assets/images/GANADERIA_1.jpg';
import Ganaderia2 from '../assets/images/GANADERIA_2.jpg';
import Ganaderia3 from '../assets/images/GANADERIA_3.jpg';
import Ganaderia4 from '../assets/images/GANADERIA_4.jpg';
import Bovino1 from '../assets/images/BOVINO_1.jpg';
import { FaHome, FaUser, FaBoxOpen, FaUtensils, FaChartBar, FaBell } from 'react-icons/fa';

const Inicio = () => {
  const { user } = useAuth();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  if (user) {
    // Contenido para usuarios autenticados
    return (
      <div className="inicio-auth-container">
        <section className="welcome-section">
          <div className="welcome-header" data-aos="fade-up">
            <h1>¡Bienvenido Software Ganadero!</h1>
          </div>
        </section>

        {/* Estadísticas Rápidas (Premium) */}
        <section className="stats-section">
          <h2>Estadísticas Rápidas</h2>
          <div className="dashboard-cards premium" data-aos="zoom-in">
            <div className="dashboard-card premium-card">
              <FaHome className="card-icon" />
              <h3>Registrar Hacienda</h3>
              <p><strong>3 haciendas</strong> | Última actualización: 03/06/2025</p>
              <p>Estado: <span className="status active">Activo</span> | Crecimiento: +15%</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="dashboard-card premium-card">
              <FaUser className="card-icon" />
              <h3>Registrar Animal</h3>
              <p><strong>12 animales</strong> | 5 nuevos este mes</p>
              <p>Estado: <span className="status active">Monitoreo Activo</span> | Crecimiento: +10%</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="dashboard-card premium-card">
              <FaBoxOpen className="card-icon" />
              <h3>Inventario</h3>
              <p><strong>5 ítems</strong> | 2 con bajo stock</p>
              <p>Última revisión: 04/06/2025 | Alerta: -20% stock</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="dashboard-card premium-card">
              <FaUtensils className="card-icon" />
              <h3>Composición Bromatológica</h3>
              <p><strong>3 raciones</strong> | 1 pendiente de análisis</p>
              <p>Última ración: 02/06/2025 | Eficiencia: 85%</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="dashboard-card premium-card">
              <FaChartBar className="card-icon" />
              <h3>Informes</h3>
              <p><strong>2 informes</strong> | Último: 04/06/2025</p>
              <p>Estado: <span className="status complete">Completado</span> | Calidad: 90%</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Notificaciones */}
        <section className="notifications-section" data-aos="fade-right">
          <h2>Notificaciones</h2>
          <div className="notification">
            <FaBell className="notification-icon" />
            <p>2 ítems con bajo stock: Medicamento A (3 unidades) y Alimento B (5 unidades). Revisar inventario.</p>
          </div>
          <div className="notification">
            <FaBell className="notification-icon" />
            <p>Último informe generado el 04/06/2025 a las 14:30 PM -05. Descargar para revisión.</p>
          </div>
          <div className="notification">
            <FaBell className="notification-icon" />
            <p>1 animal nuevo registrado hoy: ID #1234, raza Holstein. Ver detalles.</p>
          </div>
        </section>

        {/* Acciones Rápidas */}
        <section className="quick-actions-section" data-aos="fade-left">
          <h2>Acciones Rápidas</h2>
          <div className="quick-actions">
            <Link to="/registros/animal" className="action-button">Registrar Animal</Link>
            <Link to="/alimentacion/racion" className="action-button">Gestion Ración Animal</Link>
          </div>
        </section>
      </div>
    );
  }

  // Contenido original para usuarios no autenticados
  return (
    <div>
      {/* Sección Hero */}
      <section className="hero-section">
        <div className="hero-content" data-aos="fade-right">
          <h1>Bienvenido</h1>
          <p>
            Nos complace tenerte aquí, donde te ofrecemos una plataforma innovadora y fácil de usar diseñada específicamente para facilitar la gestión y administración de tus operaciones ganaderas. Nuestro objetivo es simplificar tus tareas diarias, optimizar la productividad y brindarte herramientas eficientes para monitorear y mejorar la salud, el rendimiento y la rentabilidad de tu ganado.
          </p>
          <Link to="/iniciar-sesion" className="start-button">Comienza Ahora</Link>
        </div>

        {/* Carrusel */}
        <div className="carousel" data-aos="fade-left">
          <Carousel>
            <Carousel.Item>
              <img className="d-block w-100" src={Ganaderia1} alt="Ganado 1" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={Ganaderia2} alt="Ganado 2" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={Ganaderia3} alt="Ganado 3" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={Ganaderia4} alt="Ganado 4" />
            </Carousel.Item>
            <Carousel.Item>
              <img className="d-block w-100" src={Bovino1} alt="Ganado 5" />
            </Carousel.Item>
          </Carousel>
        </div>
      </section>

      {/* Sección de Beneficios */}
      <section className="benefits-section">
        <div className="benefits-header" data-aos="fade-up">
          <h2>Beneficios del Software de Balance y Cálculo de Raciones</h2>
          <p>
            El aplicativo web del software de balance y cálculo de raciones para bovinos desarrollado en el Centro Biotecnológico del Caribe (CBC) ofrece múltiples beneficios a los productores y técnicos ganaderos en sus distintas etapas productivas, contribuyendo a una gestión más eficiente y precisa de la alimentación y nutrición del ganado.
          </p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card" data-aos="zoom-in">
            <h3>1. Optimización de la Alimentación</h3>
            <p>El software permite el cálculo de raciones específicas para cada etapa de producción de los bovinos, como crecimiento, desarrollo, lactancia y engorde.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="100">
            <h3>2. Ahorro en Costos</h3>
            <p>Reduce los costos de alimentación mediante el uso de ingredientes locales y accesibles, minimizando la necesidad de suplementos costosos.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="200">
            <h3>3. Mejora de la Salud Animal</h3>
            <p>Considera los requisitos nutricionales para prevenir problemas de salud asociados con deficiencias o excesos de nutrientes.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="300">
            <h3>4. Facilidad de Uso</h3>
            <p>Al ser un aplicativo web, los productores pueden acceder al software desde cualquier dispositivo con conexión a internet.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="400">
            <h3>5. Incremento de la Productividad</h3>
            <p>Optimiza la producción de leche y carne, maximizando el retorno sobre la inversión y aumentando la rentabilidad.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="500">
            <h3>6. Contribución a la Sostenibilidad</h3>
            <p>Promueve prácticas de alimentación responsables que favorecen la sostenibilidad en la producción ganadera.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="600">
            <h3>7. Monitoreo en Tiempo Real</h3>
            <p>Permite un seguimiento continuo de las raciones y el estado nutricional del ganado, facilitando ajustes inmediatos para optimizar resultados.</p>
          </div>
          <div className="benefit-card" data-aos="zoom-in" data-aos-delay="700">
            <h3>8. Soporte Técnico Especializado</h3>
            <p>Ofrece acceso a un equipo de soporte técnico para resolver dudas y optimizar el uso del software en tus operaciones ganaderas.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Inicio;