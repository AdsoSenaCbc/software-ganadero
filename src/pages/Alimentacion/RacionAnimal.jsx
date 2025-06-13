import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionAnimal.css';
import { FaTractor } from 'react-icons/fa';
import { BsCup } from 'react-icons/bs';

const RacionAnimal = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // Datos simulados de las tablas para cálculos (puedes reemplazar con API/backend)
  const nrcCebaData = [
    { id: 1, PB: 16.5, EM: 2.8, ED: 3.1, Ca: 0.6, P: 0.4, MS_kg: 6.5, peso: 450, calcio: 0.8, liquido: 'Suficiente' },
    { id: 2, PB: 15.8, EM: 2.6, ED: 2.9, Ca: 0.5, P: 0.3, MS_kg: 7.2, peso: 550, calcio: 0.7, liquido: 'Suficiente' },
    // ... otros datos de tabla_nrc_ceva
  ];

  const racionCebaReqData = [
    { id_racion_ceva: 1, peso_animal: 450, produccion: 1.2, GDP: 0.8, tabla_nrc_ceva_id: 1, registro_animal_id: 1 },
    { id_racion_ceva: 2, peso_animal: 550, produccion: 1.5, GDP: 1.0, tabla_nrc_ceva_id: 2, registro_animal_id: 2 },
    // ... otros datos de racion_ceva_requerimiento
  ];

  const nrcLactanciaData = [
    { id: 1, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.5, calcio: 0.8, fosforo: 0.4, vitamina: 12000, MS_kg: 7.2, peso: 550, liquido: 'Suficiente' },
    { id: 2, EN_mcal: 1.7, EM_mcal: 2.8, ED_mcal: 3.1, proteina: 16.0, calcio: 0.7, fosforo: 0.3, vitamina: 11000, MS_kg: 6.8, peso: 450, liquido: 'Suficiente' },
    // ... otros datos de tabla_nrc_lactancia
  ];

  const racionLactanciaReqData = [
    { id_racion_lactancia: 1, peso_animal: 550, produccion_de_leche: 15.5, Sigrasa: 3.8, tabla_nrc_lactancia_id: 1, registro_animal_id: 2 },
    { id_racion_lactancia: 2, peso_animal: 400, produccion_de_leche: 12.0, Sigrasa: 3.2, tabla_nrc_lactancia_id: 2, registro_animal_id: 4 },
    // ... otros datos de racion_lactancia_requerimiento
  ];

  // Cálculo básico simulado (puedes expandir con lógica real)
  const calculateCebaRation = () => {
    const totalPB = nrcCebaData.reduce((sum, item) => sum + item.PB, 0) / nrcCebaData.length;
    const totalPeso = racionCebaReqData.reduce((sum, item) => sum + item.peso_animal, 0) / racionCebaReqData.length;
    return { promedioPB: totalPB.toFixed(2), promedioPeso: totalPeso };
  };

  const calculateLactanciaRation = () => {
    const totalProteina = nrcLactanciaData.reduce((sum, item) => sum + item.proteina, 0) / nrcLactanciaData.length;
    const totalProduccion = racionLactanciaReqData.reduce((sum, item) => sum + item.produccion_de_leche, 0) / racionLactanciaReqData.length;
    return { promedioProteina: totalProteina.toFixed(2), promedioProduccion: totalProduccion.toFixed(2) };
  };

  const cebaStats = calculateCebaRation();
  const lactanciaStats = calculateLactanciaRation();

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
          <p>Promedio Proteína: {lactanciaStats.promedioProteina}%</p>
          <p>Promedio Producción: {lactanciaStats.promedioProduccion} L</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '65%' }}></div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default RacionAnimal;