import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionAnimal.css';
import { FaTractor } from 'react-icons/fa';
import { BsCup } from 'react-icons/bs';
import { apiUrl } from '../../api/api';

const RacionAnimal = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // Estados para promedios calculados desde la API
  const [cebaStats, setCebaStats] = useState({ promedioPB: '-', promedioPeso: '-' });
  const [lactStats, setLactStats] = useState({ promedioProteina: '-', promedioProduccion: '-' });

  useEffect(() => {
    AOS.init({ duration: 1000 });

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(apiUrl('/api/raciones/api'), { headers });
        if (!resp.ok) return;
        const raciones = await resp.json();
        const ceba = raciones.filter((r) => r.id_requerimiento && r.id_requerimiento === 2); // ejemplo etapa id 2
        const lact = raciones.filter((r) => r.id_requerimiento && r.id_requerimiento === 1); // ejemplo etapa id 1
        if (ceba.length) {
          const avgPeso = (ceba.reduce((s, x) => s + (x.ms_total || 0), 0) / ceba.length).toFixed(1);
          setCebaStats({ promedioPB: '-', promedioPeso: avgPeso });
        }
        if (lact.length) {
          setLactStats({ promedioProteina: '-', promedioProduccion: '-' });
        }
      } catch (err) {
        console.error('Error obteniendo stats raciones', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="racion-container">
      <h1 className="racion-title">Gestión de Raciones Animales</h1>
      <div className="racion-cards" data-aos="fade-up">
        <Link to="/alimentacion/racion-ceba" className="racion-card premium-card">
          <FaTractor className="card-icon" />
          <h3>Ración Ceba</h3>
          <p>Promedio PB: {cebaStats.promedioPB}%</p>
          <p>Promedio Peso: {cebaStats.promedioPeso} kg</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '70%' }}></div>
          </div>
        </Link>
        <Link to="/alimentacion/racion-lactancia" className="racion-card premium-card">
          <BsCup className="card-icon" />
          <h3>Ración Lactancia</h3>
          <p>Promedio Proteína: {lactStats.promedioProteina}%</p>
          <p>Promedio Producción: {lactStats.promedioProduccion} L</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '65%' }}></div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default RacionAnimal;