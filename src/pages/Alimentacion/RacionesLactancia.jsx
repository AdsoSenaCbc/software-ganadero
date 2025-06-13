import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionesLactancia.css';
import { BsCup } from 'react-icons/bs';

const RacionesLactancia = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // Datos simulados de las tablas proporcionadas
  const nrcLactanciaData = [
    { id: 1, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.5, calcio: 0.8, fosforo: 0.5, vitamina: 12000, MS_kg: 7.2, peso: 550, liquido: 'Suficiente' },
    { id: 2, EN_mcal: 1.7, EM_mcal: 2.8, ED_mcal: 3.1, proteina: 16.0, calcio: 0.7, fosforo: 0.4, vitamina: 11000, MS_kg: 6.0, peso: 400, liquido: 'Suficiente' },
    { id: 3, EN_mcal: 1.9, EM_mcal: 3.0, ED_mcal: 3.3, proteina: 17.0, calcio: 0.9, fosforo: 0.6, vitamina: 13000, MS_kg: 7.5, peso: 580, liquido: 'Suficiente' },
    { id: 4, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.2, calcio: 0.8, fosforo: 0.5, vitamina: 12000, MS_kg: 6.8, peso: 510, liquido: 'Suficiente' },
    { id: 5, EN_mcal: 1.7, EM_mcal: 2.8, ED_mcal: 3.1, proteina: 15.9, calcio: 0.7, fosforo: 0.4, vitamina: 11000, MS_kg: 7.0, peso: 530, liquido: 'Suficiente' },
    { id: 6, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.1, calcio: 0.8, fosforo: 0.5, vitamina: 12000, MS_kg: 6.9, peso: 490, liquido: 'Suficiente' },
    { id: 7, EN_mcal: 1.7, EM_mcal: 2.8, ED_mcal: 3.1, proteina: 15.7, calcio: 0.7, fosforo: 0.4, vitamina: 11000, MS_kg: 6.3, peso: 440, liquido: 'Suficiente' },
    { id: 8, EN_mcal: 1.9, EM_mcal: 3.0, ED_mcal: 3.3, proteina: 17.2, calcio: 0.9, fosforo: 0.6, vitamina: 13000, MS_kg: 5.8, peso: 380, liquido: 'Limitado' },
    { id: 9, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.8, calcio: 0.8, fosforo: 0.5, vitamina: 12000, MS_kg: 6.3, peso: 420, liquido: 'Limitado' },
    { id: 10, EN_mcal: 1.7, EM_mcal: 2.8, ED_mcal: 3.1, proteina: 16.4, calcio: 0.7, fosforo: 0.4, vitamina: 11000, MS_kg: 6.6, peso: 440, liquido: 'Suficiente' },
    { id: 11, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.6, calcio: 0.8, fosforo: 0.5, vitamina: 12000, MS_kg: 6.5, peso: 460, liquido: 'Suficiente' },
    { id: 12, EN_mcal: 1.9, EM_mcal: 3.0, ED_mcal: 3.3, proteina: 17.5, calcio: 0.9, fosforo: 0.6, vitamina: 13000, MS_kg: 7.2, peso: 550, liquido: 'Suficiente' },
    { id: 13, EN_mcal: 1.8, EM_mcal: 2.9, ED_mcal: 3.2, proteina: 16.0, calcio: 0.8, fosforo: 0.5, vitamina: 12000, MS_kg: 6.7, peso: 430, liquido: 'Suficiente' },
    { id: 14, EN_mcal: 1.7, EM_mcal: 2.8, ED_mcal: 3.1, proteina: 15.6, calcio: 0.7, fosforo: 0.4, vitamina: 11000, MS_kg: 7.2, peso: 550, liquido: 'Suficiente' },
    { id: 15, EN_mcal: 1.9, EM_mcal: 3.0, ED_mcal: 3.3, proteina: 17.1, calcio: 0.9, fosforo: 0.6, vitamina: 13000, MS_kg: 5.5, peso: 390, liquido: 'Limitado' },
  ];

  const racionLactanciaReqData = [
    { id_racion_lactancia: 0, peso_animal: 400, produccion_de_leche: 1.7, Sigrasa: 0.5, tabla_nrc_lactancia_id: 2, registro_animal_id: 2 },
    { id_racion_lactancia: 1, peso_animal: 550, produccion_de_leche: 15.5, Sigrasa: 3.8, tabla_nrc_lactancia_id: 1, registro_animal_id: 2 },
    { id_racion_lactancia: 2, peso_animal: 400, produccion_de_leche: 12.0, Sigrasa: 3.2, tabla_nrc_lactancia_id: 2, registro_animal_id: 4 },
    { id_racion_lactancia: 3, peso_animal: 580, produccion_de_leche: 18.0, Sigrasa: 4.2, tabla_nrc_lactancia_id: 3, registro_animal_id: 6 },
    { id_racion_lactancia: 4, peso_animal: 510, produccion_de_leche: 14.5, Sigrasa: 3.6, tabla_nrc_lactancia_id: 4, registro_animal_id: 8 },
    { id_racion_lactancia: 5, peso_animal: 530, produccion_de_leche: 15.0, Sigrasa: 3.7, tabla_nrc_lactancia_id: 5, registro_animal_id: 10 },
    { id_racion_lactancia: 6, peso_animal: 490, produccion_de_leche: 13.5, Sigrasa: 3.4, tabla_nrc_lactancia_id: 6, registro_animal_id: 12 },
    { id_racion_lactancia: 7, peso_animal: 440, produccion_de_leche: 15.2, Sigrasa: 3.7, tabla_nrc_lactancia_id: 7, registro_animal_id: 14 },
    { id_racion_lactancia: 8, peso_animal: 380, produccion_de_leche: 10.5, Sigrasa: 2.8, tabla_nrc_lactancia_id: 8, registro_animal_id: 3 },
    { id_racion_lactancia: 9, peso_animal: 420, produccion_de_leche: 11.5, Sigrasa: 3.0, tabla_nrc_lactancia_id: 9, registro_animal_id: 5 },
    { id_racion_lactancia: 10, peso_animal: 440, produccion_de_leche: 12.0, Sigrasa: 3.1, tabla_nrc_lactancia_id: 10, registro_animal_id: 7 },
    { id_racion_lactancia: 11, peso_animal: 460, produccion_de_leche: 12.5, Sigrasa: 3.2, tabla_nrc_lactancia_id: 11, registro_animal_id: 9 },
    { id_racion_lactancia: 12, peso_animal: 550, produccion_de_leche: 15.5, Sigrasa: 3.8, tabla_nrc_lactancia_id: 12, registro_animal_id: 2 },
    { id_racion_lactancia: 13, peso_animal: 430, produccion_de_leche: 11.8, Sigrasa: 3.0, tabla_nrc_lactancia_id: 13, registro_animal_id: 11 },
    { id_racion_lactancia: 14, peso_animal: 550, produccion_de_leche: 15.5, Sigrasa: 3.8, tabla_nrc_lactancia_id: 14, registro_animal_id: 2 },
    { id_racion_lactancia: 15, peso_animal: 390, produccion_de_leche: 10.8, Sigrasa: 2.9, tabla_nrc_lactancia_id: 15, registro_animal_id: 7 },
  ];

  // Estado para el formulario
  const [formData, setFormData] = useState({
    peso_animal: '',
    produccion_de_leche: '',
    grasa_en_leche: '',
    gestante: false,
  });

  // Estado para los resultados calculados
  const [results, setResults] = useState({
    infoAnimal: { peso: 0, produccion_de_leche: 0, grasa_en_leche: 0, gestante: 'No' },
    requerimientosEnergeticos: { energia_neta: 0, energia_digestible: 0, energia_metabolizable: 0, tnd: 0 },
    requerimientosProteicos: { proteina_total: 0, proteina_digestible: 0, materia_seca: 0 },
    requerimientosMinerales: { calcio: 0, fosforo: 0 },
  });

  // Función para calcular resultados
  const calculateRations = () => {
    const nrcData = nrcLactanciaData.map(item => ({
      EN_mcal: item.EN_mcal,
      EM_mcal: item.EM_mcal,
      ED_mcal: item.ED_mcal,
      proteina: item.proteina,
      calcio: item.calcio,
      fosforo: item.fosforo,
      MS_kg: item.MS_kg,
    })).filter(item => item.EN_mcal > 0);

    const reqData = racionLactanciaReqData.map(item => ({
      peso_animal: item.peso_animal,
      produccion_de_leche: item.produccion_de_leche,
      Sigrasa: item.Sigrasa,
    })).filter(item => item.peso_animal > 0 && item.produccion_de_leche > 0 && item.Sigrasa > 0);

    const promedioEN = nrcData.reduce((sum, val) => sum + val.EN_mcal, 0) / nrcData.length || 0;
    const promedioED = nrcData.reduce((sum, val) => sum + val.ED_mcal, 0) / nrcData.length || 0;
    const promedioEM = nrcData.reduce((sum, val) => sum + val.EM_mcal, 0) / nrcData.length || 0;
    const promedioProteina = nrcData.reduce((sum, val) => sum + val.proteina, 0) / nrcData.length || 0;
    const promedioCalcio = nrcData.reduce((sum, val) => sum + val.calcio, 0) / nrcData.length || 0;
    const promedioFosforo = nrcData.reduce((sum, val) => sum + val.fosforo, 0) / nrcData.length || 0;
    const promedioMS = nrcData.reduce((sum, val) => sum + val.MS_kg, 0) / nrcData.length || 0;
    const promedioPeso = reqData.reduce((sum, val) => sum + val.peso_animal, 0) / reqData.length || 0;
    const promedioProduccion = reqData.reduce((sum, val) => sum + val.produccion_de_leche, 0) / reqData.length || 0;
    const promedioGrasa = reqData.reduce((sum, val) => sum + val.Sigrasa, 0) / reqData.length || 0;

    const tnd = (promedioED * 0.82) / 4.4; // Estimación simple basada en conversión

    setResults({
      infoAnimal: {
        peso: promedioPeso.toFixed(2),
        produccion_de_leche: promedioProduccion.toFixed(2),
        grasa_en_leche: (promedioGrasa * 100 / promedioProduccion).toFixed(2),
        gestante: 'No',
      },
      requerimientosEnergeticos: {
        energia_neta: (promedioEN * 10).toFixed(2), // Ajuste a Mcal/día
        energia_digestible: (promedioED * 10).toFixed(2),
        energia_metabolizable: (promedioEM * 10).toFixed(2),
        tnd: tnd.toFixed(2),
      },
      requerimientosProteicos: {
        proteina_total: (promedioProteina * promedioMS / 100).toFixed(3),
        proteina_digestible: (promedioProteina * promedioMS / 100 * 0.6).toFixed(3), // 60% digestibilidad estimada
        materia_seca: promedioMS.toFixed(2),
      },
      requerimientosMinerales: {
        calcio: (promedioCalcio * promedioMS / 100).toFixed(3),
        fosforo: (promedioFosforo * promedioMS / 100).toFixed(3),
      },
    });
  };

  // Efecto para calcular al montar el componente
  useEffect(() => {
    calculateRations();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const newReqData = [...racionLactanciaReqData, { ...formData, id_racion_lactancia: 0, tabla_nrc_lactancia_id: 1, registro_animal_id: racionLactanciaReqData.length + 1 }];
    const nrcMatch = nrcLactanciaData.find(item => Math.abs(item.peso - formData.peso_animal) < 50);

    const nrcData = nrcLactanciaData.map(item => ({
      EN_mcal: item.EN_mcal,
      EM_mcal: item.EM_mcal,
      ED_mcal: item.ED_mcal,
      proteina: item.proteina,
      calcio: item.calcio,
      fosforo: item.fosforo,
      MS_kg: item.MS_kg,
    })).filter(item => item.EN_mcal > 0);

    const reqData = newReqData.map(item => ({
      peso_animal: item.peso_animal,
      produccion_de_leche: item.produccion_de_leche,
      Sigrasa: item.Sigrasa || 0,
    })).filter(item => item.peso_animal > 0 && item.produccion_de_leche > 0);

    const promedioEN = nrcData.reduce((sum, val) => sum + val.EN_mcal, 0) / nrcData.length || 0;
    const promedioED = nrcData.reduce((sum, val) => sum + val.ED_mcal, 0) / nrcData.length || 0;
    const promedioEM = nrcData.reduce((sum, val) => sum + val.EM_mcal, 0) / nrcData.length || 0;
    const promedioProteina = nrcData.reduce((sum, val) => sum + val.proteina, 0) / nrcData.length || 0;
    const promedioCalcio = nrcData.reduce((sum, val) => sum + val.calcio, 0) / nrcData.length || 0;
    const promedioFosforo = nrcData.reduce((sum, val) => sum + val.fosforo, 0) / nrcData.length || 0;
    const promedioMS = nrcData.reduce((sum, val) => sum + val.MS_kg, 0) / nrcData.length || 0;
    const promedioPeso = reqData.reduce((sum, val) => sum + val.peso_animal, 0) / reqData.length || 0;
    const promedioProduccion = reqData.reduce((sum, val) => sum + val.produccion_de_leche, 0) / reqData.length || 0;
    const promedioGrasa = reqData.reduce((sum, val) => sum + (val.Sigrasa || 0), 0) / reqData.length || 0;

    const tnd = (promedioED * 0.82) / 4.4; // Estimación simple basada en conversión

    setResults({
      infoAnimal: {
        peso: formData.peso_animal || promedioPeso.toFixed(2),
        produccion_de_leche: formData.produccion_de_leche || promedioProduccion.toFixed(2),
        grasa_en_leche: formData.grasa_en_leche || (promedioGrasa * 100 / promedioProduccion).toFixed(2),
        gestante: formData.gestante ? 'Sí' : 'No',
      },
      requerimientosEnergeticos: {
        energia_neta: (promedioEN * 10).toFixed(2), // Ajuste a Mcal/día
        energia_digestible: (promedioED * 10).toFixed(2),
        energia_metabolizable: (promedioEM * 10).toFixed(2),
        tnd: tnd.toFixed(2),
      },
      requerimientosProteicos: {
        proteina_total: (promedioProteina * promedioMS / 100).toFixed(3),
        proteina_digestible: (promedioProteina * promedioMS / 100 * 0.6).toFixed(3), // 60% digestibilidad estimada
        materia_seca: promedioMS.toFixed(2),
      },
      requerimientosMinerales: {
        calcio: (promedioCalcio * promedioMS / 100).toFixed(3),
        fosforo: (promedioFosforo * promedioMS / 100).toFixed(3),
      },
    });
    setFormData({ peso_animal: '', produccion_de_leche: '', grasa_en_leche: '', gestante: false }); // Resetear formulario
  };

  return (
    <div className="raciones-lactancia-container">
      <h1 className="raciones-title">Gestión de Raciones Lactancia</h1>

      {/* Formulario */}
      <div className="raciones-form" data-aos="fade-up">
        <h2>Datos del Animal</h2>
        <p>Ingrese la información de la vaca para calcular sus requerimientos nutricionales según las tablas NRC.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Peso del Animal (kg)</label>
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
            <label>Producción de Leche (kg/día)</label>
            <input
              type="number"
              name="produccion_de_leche"
              value={formData.produccion_de_leche}
              onChange={handleChange}
              placeholder="Ingrese producción"
              step="0.1"
              required
            />
          </div>
          <div className="form-group">
            <label>Porcentaje de Grasa en Leche (%)</label>
            <input
              type="number"
              name="grasa_en_leche"
              value={formData.grasa_en_leche}
              onChange={handleChange}
              placeholder="Ingrese porcentaje"
              step="0.1"
              required
            />
          </div>
          <div className="form-group">
            <label>Gestante (últimos 2 meses)</label>
            <input
              type="checkbox"
              name="gestante"
              checked={formData.gestante}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="submit-btn">Calcular Requerimientos</button>
        </form>
      </div>

      {/* Resultados */}
      <div className="raciones-results" data-aos="fade-up">
        <h2>Resultados</h2>
        <div className="result-card">
          <BsCup className="result-icon" />
          <div>
            <h3>Información del Animal</h3>
            <p>Peso: {results.infoAnimal.peso} kg</p>
            <p>Producción de leche: {results.infoAnimal.produccion_de_leche} kg/día</p>
            <p>Grasa en leche: {results.infoAnimal.grasa_en_leche}%</p>
            <p>Gestante: {results.infoAnimal.gestante}</p>
            <h3>Requerimientos Energéticos</h3>
            <p>Energía Neta (Mcal): {results.requerimientosEnergeticos.energia_neta}</p>
            <p>Energía Digestible (Mcal): {results.requerimientosEnergeticos.energia_digestible}</p>
            <p>Energía Metabolizable (Mcal): {results.requerimientosEnergeticos.energia_metabolizable}</p>
            <p>TND (kg): {results.requerimientosEnergeticos.tnd}</p>
            <h3>Requerimientos Proteicos</h3>
            <p>Proteína Total (kg): {results.requerimientosProteicos.proteina_total}</p>
            <p>Proteína Digestible (kg): {results.requerimientosProteicos.proteina_digestible}</p>
            <p>Materia Seca (kg): {results.requerimientosProteicos.materia_seca}</p>
            <h3>Minerales</h3>
            <p>Calcio (kg): {results.requerimientosMinerales.calcio}</p>
            <p>Fósforo (kg): {results.requerimientosMinerales.fosforo}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="raciones-nav" data-aos="fade-up">
        <Link to="/alimentacion/racion" className="nav-link">Volver a Racion Animal</Link>
        <Link to="/alimentacion/racion-ceba" className="nav-link">Raciones Ceba</Link>
      </div>
    </div>
  );
};

export default RacionesLactancia;