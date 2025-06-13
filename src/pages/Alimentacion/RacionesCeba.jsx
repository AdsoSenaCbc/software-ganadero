import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionesCeba.css';
import { FaTractor } from 'react-icons/fa';

const RacionesCeba = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // Datos simulados de las tablas proporcionadas
  const nrcCebaData = [
    { id: 1, PB: 16.5, EM: 2.8, ED: 3.1, Ca: 0.6, P: 0.4, MS_kg: 6.5, peso: 450, calcio: 0.8, liquido: 'Suficiente' },
    { id: 2, PB: 15.8, EM: 2.6, ED: 2.9, Ca: 0.5, P: 0.3, MS_kg: 7.2, peso: 550, calcio: 0.7, liquido: 'Suficiente' },
    { id: 3, PB: 17.2, EM: 3.3, ED: 0.5, Ca: 0.3, P: 5.8, MS_kg: 380, calcio: 0.9, liquido: 'Limitado' },
    { id: 4, PB: 16.2, EM: 2.7, ED: 0.6, Ca: 0.4, P: 6.0, MS_kg: 400, calcio: 0.8, liquido: 'Suficiente' },
    { id: 5, PB: 16.8, EM: 2.9, ED: 0.6, Ca: 0.4, P: 6.3, MS_kg: 420, calcio: 0.8, liquido: 'Suficiente' },
    { id: 6, PB: 15.5, EM: 2.8, ED: 0.5, Ca: 0.3, P: 7.5, MS_kg: 580, calcio: 0.7, liquido: 'Suficiente' },
    { id: 7, PB: 17.1, EM: 3.4, ED: 0.7, Ca: 0.5, P: 5.5, MS_kg: 390, calcio: 0.9, liquido: 'Limitado' },
    { id: 8, PB: 16.2, EM: 2.8, ED: 0.6, Ca: 0.4, P: 6.8, MS_kg: 510, calcio: 0.8, liquido: 'Suficiente' },
    { id: 9, PB: 15.7, EM: 2.9, ED: 0.5, Ca: 0.3, P: 6.4, MS_kg: 470, calcio: 0.7, liquido: 'Suficiente' },
    { id: 10, PB: 16.4, EM: 2.8, ED: 0.6, Ca: 0.4, P: 6.6, MS_kg: 440, calcio: 0.8, liquido: 'Suficiente' },
    { id: 11, PB: 16.1, EM: 2.7, ED: 0.6, Ca: 0.4, P: 6.9, MS_kg: 490, calcio: 0.8, liquido: 'Suficiente' },
    { id: 12, PB: 16.7, EM: 3.0, ED: 0.6, Ca: 0.4, P: 6.5, MS_kg: 460, calcio: 0.8, liquido: 'Suficiente' },
    { id: 13, PB: 15.7, EM: 2.9, ED: 0.5, Ca: 0.3, P: 7.3, MS_kg: 540, calcio: 0.7, liquido: 'Suficiente' },
    { id: 14, PB: 16.3, EM: 2.8, ED: 0.6, Ca: 0.4, P: 6.7, MS_kg: 430, calcio: 0.8, liquido: 'Suficiente' },
    { id: 15, PB: 16.3, EM: 2.8, ED: 0.6, Ca: 0.4, P: 6.7, MS_kg: 430, calcio: 0.8, liquido: 'Suficiente' },
  ];

  const racionCebaReqData = [
    { id_racion_ceva: 1, peso_animal: 400, produccion: 1.5, GDP: 1.0, tabla_nrc_ceva_id: 4, registro_animal_id: 1 },
    { id_racion_ceva: 2, peso_animal: 450, produccion: 1.2, GDP: 0.8, tabla_nrc_ceva_id: 2, registro_animal_id: 2 },
    { id_racion_ceva: 3, peso_animal: 380, produccion: 1.1, GDP: 0.7, tabla_nrc_ceva_id: 3, registro_animal_id: 3 },
    { id_racion_ceva: 4, peso_animal: 400, produccion: 1.0, GDP: 0.6, tabla_nrc_ceva_id: 4, registro_animal_id: 4 },
    { id_racion_ceva: 5, peso_animal: 420, produccion: 1.2, GDP: 0.8, tabla_nrc_ceva_id: 5, registro_animal_id: 5 },
    { id_racion_ceva: 6, peso_animal: 550, produccion: 1.6, GDP: 1.1, tabla_nrc_ceva_id: 6, registro_animal_id: 6 },
    { id_racion_ceva: 7, peso_animal: 390, produccion: 1.1, GDP: 0.7, tabla_nrc_ceva_id: 7, registro_animal_id: 7 },
    { id_racion_ceva: 8, peso_animal: 510, produccion: 1.4, GDP: 0.9, tabla_nrc_ceva_id: 8, registro_animal_id: 8 },
    { id_racion_ceva: 9, peso_animal: 470, produccion: 1.3, GDP: 0.8, tabla_nrc_ceva_id: 9, registro_animal_id: 9 },
    { id_racion_ceva: 10, peso_animal: 440, produccion: 1.2, GDP: 0.8, tabla_nrc_ceva_id: 10, registro_animal_id: 10 },
    { id_racion_ceva: 11, peso_animal: 490, produccion: 1.3, GDP: 0.9, tabla_nrc_ceva_id: 11, registro_animal_id: 11 },
    { id_racion_ceva: 12, peso_animal: 460, produccion: 1.2, GDP: 0.8, tabla_nrc_ceva_id: 12, registro_animal_id: 12 },
    { id_racion_ceva: 13, peso_animal: 540, produccion: 1.5, GDP: 1.0, tabla_nrc_ceva_id: 13, registro_animal_id: 13 },
    { id_racion_ceva: 14, peso_animal: 430, produccion: 1.1, GDP: 0.7, tabla_nrc_ceva_id: 14, registro_animal_id: 14 },
    { id_racion_ceva: 15, peso_animal: 430, produccion: 1.1, GDP: 0.7, tabla_nrc_ceva_id: 15, registro_animal_id: 15 },
    { id_racion_ceva: 0, peso_animal: 400, produccion: 0.6, GDP: 0.5, tabla_nrc_ceva_id: 2, registro_animal_id: 2 },
    { id_racion_ceva: 0, peso_animal: 500, produccion: 1.4, GDP: 0.9, tabla_nrc_ceva_id: 4, registro_animal_id: 4 },
    { id_racion_ceva: 0, peso_animal: 380, produccion: 2.5, GDP: 1.3, tabla_nrc_ceva_id: 3, registro_animal_id: 3 },
    { id_racion_ceva: 0, peso_animal: 380, produccion: 0.8, GDP: 0.2, tabla_nrc_ceva_id: 3, registro_animal_id: 3 },
    { id_racion_ceva: 0, peso_animal: 380, produccion: 1.1, GDP: 0.9, tabla_nrc_ceva_id: 3, registro_animal_id: 3 },
  ];

  // Estado para el formulario
  const [formData, setFormData] = useState({
    peso_animal: '',
    produccion: '',
    GDP: '',
  });

  // Estado para los resultados calculados
  const [results, setResults] = useState({
    promedioPB: 0,
    promedioPeso: 0,
    promedioProduccion: 0,
    promedioGDP: 0,
  });

  // Función para calcular promedios
  const calculateRations = () => {
    const nrcData = nrcCebaData.map(item => item.PB).filter(p => p > 0);
    const reqData = racionCebaReqData.map(item => ({
      peso_animal: item.peso_animal,
      produccion: item.produccion,
      GDP: item.GDP,
    })).filter(item => item.peso_animal > 0 && item.produccion > 0 && item.GDP > 0);

    const promedioPB = nrcData.reduce((sum, val) => sum + val, 0) / nrcData.length || 0;
    const promedioPeso = reqData.reduce((sum, val) => sum + val.peso_animal, 0) / reqData.length || 0;
    const promedioProduccion = reqData.reduce((sum, val) => sum + val.produccion, 0) / reqData.length || 0;
    const promedioGDP = reqData.reduce((sum, val) => sum + val.GDP, 0) / reqData.length || 0;

    setResults({
      promedioPB: promedioPB.toFixed(2),
      promedioPeso: promedioPeso.toFixed(2),
      promedioProduccion: promedioProduccion.toFixed(2),
      promedioGDP: promedioGDP.toFixed(2),
    });
  };

  // Efecto para calcular al montar el componente
  useEffect(() => {
    calculateRations();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const newReqData = [...racionCebaReqData, { ...formData, id_racion_ceva: 0, tabla_nrc_ceva_id: 1, registro_animal_id: racionCebaReqData.length + 1 }];
    const nrcMatch = nrcCebaData.find(item => Math.abs(item.peso - formData.peso_animal) < 50); // Aproximación
    const newNrcData = nrcMatch ? [nrcMatch, ...nrcCebaData] : nrcCebaData;

    const nrcData = newNrcData.map(item => item.PB).filter(p => p > 0);
    const reqData = newReqData.map(item => ({
      peso_animal: item.peso_animal,
      produccion: item.produccion,
      GDP: item.GDP,
    })).filter(item => item.peso_animal > 0 && item.produccion > 0 && item.GDP > 0);

    const promedioPB = nrcData.reduce((sum, val) => sum + val, 0) / nrcData.length || 0;
    const promedioPeso = reqData.reduce((sum, val) => sum + val.peso_animal, 0) / reqData.length || 0;
    const promedioProduccion = reqData.reduce((sum, val) => sum + val.produccion, 0) / reqData.length || 0;
    const promedioGDP = reqData.reduce((sum, val) => sum + val.GDP, 0) / reqData.length || 0;

    setResults({
      promedioPB: promedioPB.toFixed(2),
      promedioPeso: promedioPeso.toFixed(2),
      promedioProduccion: promedioProduccion.toFixed(2),
      promedioGDP: promedioGDP.toFixed(2),
    });
    setFormData({ peso_animal: '', produccion: '', GDP: '' }); // Resetear formulario
  };

  return (
    <div className="raciones-ceba-container">
      <h1 className="raciones-title">Gestión de Raciones Ceba</h1>


      {/* Formulario */}
      <div className="raciones-form" data-aos="fade-up">
        <h2>Ingresar Datos de Ración</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Peso Animal (kg)</label>
            <input
              type="number"
              name="peso_animal"
              value={formData.peso_animal}
              onChange={handleChange}
              placeholder="Ingrese peso"
              required
            />
          </div>
          <div className="form-group">
            <label>Producción (kg)</label>
            <input
              type="number"
              name="produccion"
              value={formData.produccion}
              onChange={handleChange}
              placeholder="Ingrese producción"
              required
            />
          </div>
          <div className="form-group">
            <label>GDP</label>
            <input
              type="number"
              name="GDP"
              value={formData.GDP}
              onChange={handleChange}
              placeholder="Ingrese GDP"
              step="0.1"
              required
            />
          </div>
          <button type="submit" className="submit-btn">Calcular</button>
        </form>
      </div>

      {/* Resultados */}
      <div className="raciones-results" data-aos="fade-up">
        <h2>Resultados Calculados</h2>
        <div className="result-card">
          <FaTractor className="result-icon" />
          <div>
            <p>Promedio PB: {results.promedioPB}%</p>
            <p>Promedio Peso: {results.promedioPeso} kg</p>
            <p>Promedio Producción: {results.promedioProduccion} kg</p>
            <p>Promedio GDP: {results.promedioGDP}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="raciones-nav" data-aos="fade-up">
        <Link to="/alimentacion/racion" className="nav-link">Volver a Raciones</Link>
        <Link to="/alimentacion/racion-lactancia" className="nav-link">Raciones Lactancia</Link>
      </div>
    </div>
  );
};

export default RacionesCeba;