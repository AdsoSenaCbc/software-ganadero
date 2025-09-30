import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionesLactancia.css';
import { GiCow, GiMeal } from 'react-icons/gi';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../../components/PermissionGuard';
import { apiUrl, authHeader } from '../../api/api';

// Estilos CSS para animaciones
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const RacionesLactancia = () => {
  // Hook de permisos
  const { permissions, loading: permissionsLoading } = usePermissions();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Estados para datos del animal
  const [animalesLactancia, setAnimalesLactancia] = useState([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [animalData, setAnimalData] = useState({
    peso: '',
    produccion_leche: '',
    grasa_leche: 3.5,
    edad_meses: 24,
    condicion_corporal: 3.0,
    estado_fisiologico: 'lactancia_media'
  });

  // Estados para ingredientes
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [tipoIngrediente, setTipoIngrediente] = useState('forraje');
  const [nombreIngrediente, setNombreIngrediente] = useState('');
  const [cantidadIngrediente, setCantidadIngrediente] = useState('');

  // Estados para configuración
  const [modoAuto, setModoAuto] = useState(true);
  const [usarNRC, setUsarNRC] = useState(true);
  const [proporcionFC, setProporcionFC] = useState('60/40');
  // Estados para resultados
  const [requerimientos, setRequerimientos] = useState(null);
  const [aporteRacion, setAporteRacion] = useState(null);
  const [balanceRacion, setBalanceRacion] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [showCalculoDetalle, setShowCalculoDetalle] = useState(false);
  const [requerimientosMantenimiento, setRequerimientosMantenimiento] = useState(null);
  const [requerimientosPorGrasa, setRequerimientosPorGrasa] = useState(null);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    AOS.init({ duration: 700 });
    cargarIngredientesDisponibles();
    cargarAnimalesLactancia();
  }, []);

  // Cargar lista de animales en lactancia
  const cargarAnimalesLactancia = async () => {
    try {
      console.log('Cargando animales en lactancia...');
      const response = await fetch(apiUrl('/api/animals/lactancia'), {
        headers: authHeader()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Animales en lactancia cargados:', data);
        
        // Asegurarse de que los datos tengan el formato esperado
        const animalesFormateados = data.map(animal => ({
          ...animal,
          // Asegurar que los campos requeridos existan
          id_animal: animal.id_animal,
          identificador_unico: animal.identificador_unico || `Animal #${animal.id_animal}`,
          nombre: animal.nombre || 'Sin nombre',
          peso: animal.peso ? parseFloat(animal.peso) : null,
          edad_meses: animal.edad_meses || 24,
          raza: animal.raza || 'No especificada',
          especie: animal.especie || 'No especificada'
        }));
        
        setAnimalesLactancia(animalesFormateados);
      } else {
        const errorText = await response.text();
        console.error('Error al cargar animales en lactancia:', response.status, errorText);
        setApiError(`Error al cargar animales: ${errorText}`);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      setApiError('Error de conexión con el servidor');
      
      // Datos de ejemplo para desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.warn('Usando datos de ejemplo para desarrollo');
        const datosEjemplo = [
          {
            id_animal: 1,
            identificador_unico: 'VACA-001',
            nombre: 'Lola',
            peso: 550.5,
            edad_meses: 36,
            raza: 'Holstein',
            especie: 'Bovino'
          },
          {
            id_animal: 2,
            identificador_unico: 'VACA-002',
            nombre: 'Rosita',
            peso: 480.0,
            edad_meses: 48,
            raza: 'Jersey',
            especie: 'Bovino'
          }
        ];
        setAnimalesLactancia(datosEjemplo);
      }
    }
  };

  // Manejar cambio de animal seleccionado
  const handleAnimalChange = (idAnimal) => {
    console.log('Animal seleccionado ID:', idAnimal);
    
    if (!idAnimal) {
      setAnimalSeleccionado(null);
      setAnimalData(prev => ({
        ...prev,
        peso: '',
        edad_meses: 24,
        produccion_leche: '',
        grasa_leche: 3.5,
        // Preservar condición corporal seleccionada
        condicion_corporal: prev.condicion_corporal || 3.0
      }));
      return;
    }
    
    const animal = animalesLactancia.find(a => a.id_animal == idAnimal);
    console.log('Animal encontrado:', animal);
    
    if (animal) {
      setAnimalSeleccionado(animal);
      setAnimalData(prev => ({
        ...prev,
        peso: animal.peso || '',
        edad_meses: animal.edad_meses || 24,
        // Mantener los valores existentes si no se especifican
        produccion_leche: prev.produccion_leche || '',
        grasa_leche: prev.grasa_leche || 3.5,
        // Preservar condición corporal seleccionada
        condicion_corporal: prev.condicion_corporal || 3.0
      }));
      
      // Mostrar notificación de éxito
      console.log(`Animal seleccionado: ${animal.identificador_unico} - ${animal.nombre}`);
    } else {
      console.warn('No se encontró el animal con ID:', idAnimal);
      setApiError('No se pudo cargar la información del animal seleccionado');
    }
  };

  // Verificar ingredientes disponibles cuando cambien
  useEffect(() => {
    if (ingredientesDisponibles.length > 0) {
      console.log(`✅ ${ingredientesDisponibles.length} ingredientes cargados correctamente`);
    }
  }, [ingredientesDisponibles]);

  // Calcular requerimientos automáticamente cuando cambien los datos del animal
  useEffect(() => {
    if (animalData.peso && animalData.produccion_leche) {
      const requerimientosCalculados = calcularRequerimientosBasicos(
        animalData.peso,
        animalData.produccion_leche,
        animalData.grasa_leche
      );
      setRequerimientos(requerimientosCalculados);
    }
  }, [animalData.peso, animalData.produccion_leche, animalData.grasa_leche]);

  // Tabla de requerimientos por porcentaje de grasa en leche
  const tablaRequerimientosPorGrasa = [
    { porcentaje_grasa: 2.5, proteina_total_g: 66.000, proteina_digestible_g: 42.000, energia_neta_mcal: 0.590000, energia_digestible_mcal: 1.120000, energia_metabolizable_mcal: 0.910000, tnd_g: 255.000, calcio_g: 2.400, fosforo_g: 1.700 },
    { porcentaje_grasa: 3.0, proteina_total_g: 70.000, proteina_digestible_g: 45.000, energia_neta_mcal: 0.640000, energia_digestible_mcal: 1.230000, energia_metabolizable_mcal: 0.980000, tnd_g: 280.000, calcio_g: 2.500, fosforo_g: 1.800 },
    { porcentaje_grasa: 3.5, proteina_total_g: 74.000, proteina_digestible_g: 48.000, energia_neta_mcal: 0.690000, energia_digestible_mcal: 1.340000, energia_metabolizable_mcal: 1.060000, tnd_g: 305.000, calcio_g: 2.600, fosforo_g: 1.900 },
    { porcentaje_grasa: 4.0, proteina_total_g: 78.000, proteina_digestible_g: 51.000, energia_neta_mcal: 0.740000, energia_digestible_mcal: 1.460000, energia_metabolizable_mcal: 1.130000, tnd_g: 330.000, calcio_g: 2.700, fosforo_g: 2.000 },
    { porcentaje_grasa: 4.5, proteina_total_g: 82.000, proteina_digestible_g: 54.000, energia_neta_mcal: 0.790000, energia_digestible_mcal: 1.570000, energia_metabolizable_mcal: 1.210000, tnd_g: 355.000, calcio_g: 2.800, fosforo_g: 2.100 },
    { porcentaje_grasa: 5.0, proteina_total_g: 86.000, proteina_digestible_g: 56.000, energia_neta_mcal: 0.830000, energia_digestible_mcal: 1.680000, energia_metabolizable_mcal: 1.280000, tnd_g: 380.000, calcio_g: 2.900, fosforo_g: 2.200 },
    { porcentaje_grasa: 5.5, proteina_total_g: 90.000, proteina_digestible_g: 58.000, energia_neta_mcal: 0.880000, energia_digestible_mcal: 1.790000, energia_metabolizable_mcal: 1.350000, tnd_g: 405.000, calcio_g: 3.000, fosforo_g: 2.300 },
    { porcentaje_grasa: 6.0, proteina_total_g: 94.000, proteina_digestible_g: 60.000, energia_neta_mcal: 0.930000, energia_digestible_mcal: 1.900000, energia_metabolizable_mcal: 1.430000, tnd_g: 430.000, calcio_g: 3.100, fosforo_g: 2.400 }
  ];

  // Tabla de requerimientos de mantenimiento basada en peso
  const tablaRequerimientosMantenimiento = [
    { peso_kg: 350, materia_seca_kg: 5.0, proteina_total_g: 468.0, proteina_digestible_g: 220.0, energia_neta_mcal: 6.90, energia_digestible_mcal: 12.30, energia_metabolizable_mcal: 10.10, calcio_g: 2800.0, fosforo_g: 14.00 },
    { peso_kg: 400, materia_seca_kg: 5.5, proteina_total_g: 521.0, proteina_digestible_g: 245.0, energia_neta_mcal: 7.60, energia_digestible_mcal: 13.60, energia_metabolizable_mcal: 11.20, calcio_g: 3100.0, fosforo_g: 17.00 },
    { peso_kg: 450, materia_seca_kg: 6.0, proteina_total_g: 585.0, proteina_digestible_g: 275.0, energia_neta_mcal: 8.30, energia_digestible_mcal: 15.00, energia_metabolizable_mcal: 12.30, calcio_g: 3400.0, fosforo_g: 18.00 },
    { peso_kg: 500, materia_seca_kg: 6.5, proteina_total_g: 638.0, proteina_digestible_g: 300.0, energia_neta_mcal: 9.00, energia_digestible_mcal: 16.30, energia_metabolizable_mcal: 13.40, calcio_g: 3700.0, fosforo_g: 20.00 },
    { peso_kg: 550, materia_seca_kg: 7.0, proteina_total_g: 691.0, proteina_digestible_g: 325.0, energia_neta_mcal: 9.60, energia_digestible_mcal: 17.60, energia_metabolizable_mcal: 14.40, calcio_g: 4000.0, fosforo_g: 21.00 },
    { peso_kg: 600, materia_seca_kg: 7.5, proteina_total_g: 734.0, proteina_digestible_g: 345.0, energia_neta_mcal: 10.30, energia_digestible_mcal: 18.90, energia_metabolizable_mcal: 15.50, calcio_g: 4200.0, fosforo_g: 22.00 },
    { peso_kg: 650, materia_seca_kg: 8.0, proteina_total_g: 776.0, proteina_digestible_g: 365.0, energia_neta_mcal: 10.90, energia_digestible_mcal: 19.80, energia_metabolizable_mcal: 16.20, calcio_g: 4500.0, fosforo_g: 23.00 },
    { peso_kg: 700, materia_seca_kg: 8.5, proteina_total_g: 830.0, proteina_digestible_g: 390.0, energia_neta_mcal: 11.50, energia_digestible_mcal: 21.10, energia_metabolizable_mcal: 17.30, calcio_g: 4800.0, fosforo_g: 25.00 },
    { peso_kg: 750, materia_seca_kg: 9.0, proteina_total_g: 872.0, proteina_digestible_g: 410.0, energia_neta_mcal: 12.20, energia_digestible_mcal: 22.00, energia_metabolizable_mcal: 18.00, calcio_g: 5000.0, fosforo_g: 26.00 },
    { peso_kg: 800, materia_seca_kg: 9.5, proteina_total_g: 915.0, proteina_digestible_g: 430.0, energia_neta_mcal: 12.80, energia_digestible_mcal: 23.30, energia_metabolizable_mcal: 19.10, calcio_g: 5300.0, fosforo_g: 27.00 }
  ];

  // Función para obtener requerimientos de mantenimiento por peso
  const obtenerRequerimientosMantenimiento = (pesoAnimal) => {
    const peso = parseFloat(pesoAnimal);
    if (!peso || peso <= 0) return null;

    // Buscar el rango más cercano en la tabla
    let requerimiento = null;
    let menorDiferencia = Infinity;

    for (const req of tablaRequerimientosMantenimiento) {
      const diferencia = Math.abs(req.peso_kg - peso);
      if (diferencia < menorDiferencia) {
        menorDiferencia = diferencia;
        requerimiento = req;
      }
    }

    // Si el peso está entre dos valores, hacer interpolación lineal
    if (requerimiento && menorDiferencia > 0) {
      const reqAnterior = tablaRequerimientosMantenimiento.find(r => r.peso_kg < peso && Math.abs(r.peso_kg - peso) <= 50);
      const reqSiguiente = tablaRequerimientosMantenimiento.find(r => r.peso_kg > peso && Math.abs(r.peso_kg - peso) <= 50);
      
      if (reqAnterior && reqSiguiente) {
        const factor = (peso - reqAnterior.peso_kg) / (reqSiguiente.peso_kg - reqAnterior.peso_kg);
        requerimiento = {
          peso_kg: peso,
          materia_seca_kg: reqAnterior.materia_seca_kg + (reqSiguiente.materia_seca_kg - reqAnterior.materia_seca_kg) * factor,
          proteina_total_g: reqAnterior.proteina_total_g + (reqSiguiente.proteina_total_g - reqAnterior.proteina_total_g) * factor,
          proteina_digestible_g: reqAnterior.proteina_digestible_g + (reqSiguiente.proteina_digestible_g - reqAnterior.proteina_digestible_g) * factor,
          energia_neta_mcal: reqAnterior.energia_neta_mcal + (reqSiguiente.energia_neta_mcal - reqAnterior.energia_neta_mcal) * factor,
          energia_digestible_mcal: reqAnterior.energia_digestible_mcal + (reqSiguiente.energia_digestible_mcal - reqAnterior.energia_digestible_mcal) * factor,
          energia_metabolizable_mcal: reqAnterior.energia_metabolizable_mcal + (reqSiguiente.energia_metabolizable_mcal - reqAnterior.energia_metabolizable_mcal) * factor,
          calcio_g: reqAnterior.calcio_g + (reqSiguiente.calcio_g - reqAnterior.calcio_g) * factor,
          fosforo_g: reqAnterior.fosforo_g + (reqSiguiente.fosforo_g - reqAnterior.fosforo_g) * factor
        };
      }
    }

    return requerimiento;
  };

  // Función para obtener requerimientos por porcentaje de grasa
  const obtenerRequerimientosPorGrasa = (porcentajeGrasa) => {
    const grasa = parseFloat(porcentajeGrasa);
    if (!grasa || grasa <= 0) return null;

    // Buscar el rango más cercano en la tabla
    let requerimiento = null;
    let menorDiferencia = Infinity;

    for (const req of tablaRequerimientosPorGrasa) {
      const diferencia = Math.abs(req.porcentaje_grasa - grasa);
      if (diferencia < menorDiferencia) {
        menorDiferencia = diferencia;
        requerimiento = req;
      }
    }

    // Si el porcentaje está entre dos valores, hacer interpolación lineal
    if (requerimiento && menorDiferencia > 0) {
      const reqAnterior = tablaRequerimientosPorGrasa.find(r => r.porcentaje_grasa < grasa && Math.abs(r.porcentaje_grasa - grasa) <= 0.5);
      const reqSiguiente = tablaRequerimientosPorGrasa.find(r => r.porcentaje_grasa > grasa && Math.abs(r.porcentaje_grasa - grasa) <= 0.5);
      
      if (reqAnterior && reqSiguiente) {
        const factor = (grasa - reqAnterior.porcentaje_grasa) / (reqSiguiente.porcentaje_grasa - reqAnterior.porcentaje_grasa);
        requerimiento = {
          porcentaje_grasa: grasa,
          proteina_total_g: reqAnterior.proteina_total_g + (reqSiguiente.proteina_total_g - reqAnterior.proteina_total_g) * factor,
          proteina_digestible_g: reqAnterior.proteina_digestible_g + (reqSiguiente.proteina_digestible_g - reqAnterior.proteina_digestible_g) * factor,
          energia_neta_mcal: reqAnterior.energia_neta_mcal + (reqSiguiente.energia_neta_mcal - reqAnterior.energia_neta_mcal) * factor,
          energia_digestible_mcal: reqAnterior.energia_digestible_mcal + (reqSiguiente.energia_digestible_mcal - reqAnterior.energia_digestible_mcal) * factor,
          energia_metabolizable_mcal: reqAnterior.energia_metabolizable_mcal + (reqSiguiente.energia_metabolizable_mcal - reqAnterior.energia_metabolizable_mcal) * factor,
          tnd_g: reqAnterior.tnd_g + (reqSiguiente.tnd_g - reqAnterior.tnd_g) * factor,
          calcio_g: reqAnterior.calcio_g + (reqSiguiente.calcio_g - reqAnterior.calcio_g) * factor,
          fosforo_g: reqAnterior.fosforo_g + (reqSiguiente.fosforo_g - reqAnterior.fosforo_g) * factor
        };
      }
    }

    return requerimiento;
  };

  // Efecto para cargar requerimientos de mantenimiento cuando cambie el peso
  useEffect(() => {
    if (animalData.peso && animalData.peso !== 'custom') {
      const requerimientos = obtenerRequerimientosMantenimiento(animalData.peso);
      setRequerimientosMantenimiento(requerimientos);
      console.log('Requerimientos de mantenimiento cargados para peso', animalData.peso, ':', requerimientos);
    } else {
      setRequerimientosMantenimiento(null);
    }
  }, [animalData.peso]);

  // Efecto para cargar requerimientos por porcentaje de grasa
  useEffect(() => {
    if (animalData.grasa_leche) {
      const requerimientos = obtenerRequerimientosPorGrasa(animalData.grasa_leche);
      setRequerimientosPorGrasa(requerimientos);
      console.log('Requerimientos por grasa cargados para', animalData.grasa_leche, '%:', requerimientos);
    } else {
      setRequerimientosPorGrasa(null);
    }
  }, [animalData.grasa_leche]);

  // Efecto para recalcular requerimientos cuando cambien los datos de mantenimiento o grasa
  useEffect(() => {
    if (animalData.peso && animalData.produccion_leche && (requerimientosMantenimiento || requerimientosPorGrasa)) {
      console.log('Recalculando requerimientos con datos actualizados');
      const requerimientosCalculados = calcularRequerimientosBasicos(
        animalData.peso,
        animalData.produccion_leche,
        animalData.grasa_leche
      );
      setRequerimientos(requerimientosCalculados);
    }
  }, [requerimientosMantenimiento, requerimientosPorGrasa, animalData.peso, animalData.produccion_leche, animalData.grasa_leche]);

  const cargarIngredientesDisponibles = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/ingredientes/api'), {
        headers: authHeader()
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos de API recibidos:', data);
        
        // Normalizar datos de la API para que tengan la estructura correcta
        const datosNormalizados = Array.isArray(data) ? data.map(ing => ({
          id_ingrediente: ing.id_ingrediente || ing.id,
          nombre_ingrediente: ing.nombre_ingrediente || ing.nombre,
          tipo: ing.tipo,
          // Mapear campos nutricionales con múltiples posibles nombres
          materia_seca: ing.materia_seca || ing.ms_pct || ing.ms || 0,
          proteina_bruta: ing.proteina_bruta || ing.pb_pct || ing.pb || 0,
          energia_metabolizable: ing.energia_metabolizable || ing.em_mcal || ing.em || 0,
          calcio: ing.calcio || ing.ca_pct || ing.ca || 0,
          fosforo: ing.fosforo || ing.p_pct || ing.p || 0
        })) : [];
        
        console.log('📊 Datos normalizados:', datosNormalizados);
        setIngredientesDisponibles(datosNormalizados);
        
        // Verificar si los datos tienen valores nutricionales
        const conDatos = datosNormalizados.filter(ing => 
          ing.materia_seca > 0 || ing.proteina_bruta > 0 || ing.energia_metabolizable > 0
        );
        console.log(`✅ ${conDatos.length}/${datosNormalizados.length} ingredientes con datos nutricionales`);
        
      } else {
        console.warn('No se pudieron cargar ingredientes desde API, usando datos locales');
        const ingredientesLocales = getIngredientesLocales();
        console.log('Ingredientes locales cargados:', ingredientesLocales);
        setIngredientesDisponibles(ingredientesLocales);
      }
    } catch (error) {
      console.error('Error cargando ingredientes:', error);
      const ingredientesLocales = getIngredientesLocales();
      console.log('Ingredientes locales por error:', ingredientesLocales);
      setIngredientesDisponibles(ingredientesLocales);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener ingredientes locales con valores nutricionales
  const getIngredientesLocales = () => {
    return [
      // FORRAJES
      {
        id_ingrediente: 1,
        nombre_ingrediente: 'Pasto Kikuyo',
        tipo: 'forraje',
        materia_seca: 22.0,
        proteina_bruta: 18.5,
        energia_metabolizable: 2.4,
        calcio: 0.65,
        fosforo: 0.35
      },
      {
        id_ingrediente: 2,
        nombre_ingrediente: 'Pasto Brachiaria',
        tipo: 'forraje',
        materia_seca: 25.0,
        proteina_bruta: 12.8,
        energia_metabolizable: 2.2,
        calcio: 0.45,
        fosforo: 0.28
      },
      {
        id_ingrediente: 3,
        nombre_ingrediente: 'Ensilaje de Maíz',
        tipo: 'forraje',
        materia_seca: 35.0,
        proteina_bruta: 8.5,
        energia_metabolizable: 2.6,
        calcio: 0.25,
        fosforo: 0.22
      },
      {
        id_ingrediente: 4,
        nombre_ingrediente: 'Heno de Alfalfa',
        tipo: 'forraje',
        materia_seca: 88.0,
        proteina_bruta: 19.2,
        energia_metabolizable: 2.3,
        calcio: 1.35,
        fosforo: 0.24
      },
      // CONCENTRADOS
      {
        id_ingrediente: 5,
        nombre_ingrediente: 'Concentrado Comercial 16%',
        tipo: 'concentrado',
        materia_seca: 88.0,
        proteina_bruta: 16.0,
        energia_metabolizable: 3.1,
        calcio: 0.8,
        fosforo: 0.6
      },
      {
        id_ingrediente: 6,
        nombre_ingrediente: 'Maíz Molido',
        tipo: 'concentrado',
        materia_seca: 86.0,
        proteina_bruta: 9.5,
        energia_metabolizable: 3.4,
        calcio: 0.03,
        fosforo: 0.28
      },
      {
        id_ingrediente: 7,
        nombre_ingrediente: 'Torta de Soya',
        tipo: 'concentrado',
        materia_seca: 88.0,
        proteina_bruta: 44.0,
        energia_metabolizable: 3.3,
        calcio: 0.27,
        fosforo: 0.65
      },
      {
        id_ingrediente: 8,
        nombre_ingrediente: 'Salvado de Trigo',
        tipo: 'concentrado',
        materia_seca: 87.0,
        proteina_bruta: 15.8,
        energia_metabolizable: 2.0,
        calcio: 0.13,
        fosforo: 1.18
      },
      // MINERALES
      {
        id_ingrediente: 9,
        nombre_ingrediente: 'Sal Mineralizada',
        tipo: 'mineral',
        materia_seca: 95.0,
        proteina_bruta: 0.0,
        energia_metabolizable: 0.0,
        calcio: 18.0,
        fosforo: 8.0
      },
      {
        id_ingrediente: 10,
        nombre_ingrediente: 'Carbonato de Calcio',
        tipo: 'mineral',
        materia_seca: 98.0,
        proteina_bruta: 0.0,
        energia_metabolizable: 0.0,
        calcio: 38.0,
        fosforo: 0.0
      },
      {
        id_ingrediente: 11,
        nombre_ingrediente: 'Fosfato Bicálcico',
        tipo: 'mineral',
        materia_seca: 96.0,
        proteina_bruta: 0.0,
        energia_metabolizable: 0.0,
        calcio: 23.0,
        fosforo: 18.0
      }
    ];
  };

  const agregarIngrediente = () => {
    if (!nombreIngrediente || !cantidadIngrediente) return;

    const ingrediente = ingredientesDisponibles.find(
      ing => (ing.id_ingrediente == nombreIngrediente) || (ing.id == nombreIngrediente)
    );
    
    if (!ingrediente) {
      console.error('No se encontró el ingrediente con ID:', nombreIngrediente);
      return;
    }

    // Mapeo robusto de datos nutricionales
    const ms_valor = parseFloat(ingrediente.materia_seca || ingrediente.ms_pct || ingrediente.ms || 0);
    const pb_valor = parseFloat(ingrediente.proteina_bruta || ingrediente.pb_pct || ingrediente.pb || 0);
    const em_valor = parseFloat(ingrediente.energia_metabolizable || ingrediente.em_mcal || ingrediente.em || 0);
    const ca_valor = parseFloat(ingrediente.calcio || ingrediente.ca_pct || ingrediente.ca || 0);
    const p_valor = parseFloat(ingrediente.fosforo || ingrediente.p_pct || ingrediente.p || 0);

    const nuevoIngrediente = {
      id: ingrediente.id_ingrediente || ingrediente.id,
      nombre: ingrediente.nombre_ingrediente || ingrediente.nombre,
      tipo: ingrediente.tipo || tipoIngrediente,
      cantidad: parseFloat(cantidadIngrediente),
      ms_pct: ms_valor,
      pb_pct: pb_valor,
      em_mcal: em_valor,
      ca_pct: ca_valor,
      p_pct: p_valor
    };
    
    // Verificar si el ingrediente tiene datos nutricionales
    const tieneDatos = ms_valor > 0 || pb_valor > 0 || em_valor > 0;
    
    console.log('✅ Ingrediente agregado:', {
      nombre: nuevoIngrediente.nombre,
      tieneDatos: tieneDatos,
      valores: {
        MS: nuevoIngrediente.ms_pct + '%',
        PB: nuevoIngrediente.pb_pct + '%',
        EM: nuevoIngrediente.em_mcal + ' Mcal/kg',
        Ca: nuevoIngrediente.ca_pct + '%',
        P: nuevoIngrediente.p_pct + '%'
      }
    });
    
    // Mostrar advertencia si no tiene datos nutricionales
    if (!tieneDatos) {
      console.warn('⚠️ El ingrediente no tiene datos nutricionales completos');
      setApiError(`Advertencia: El ingrediente "${nuevoIngrediente.nombre}" no tiene datos nutricionales. Los cálculos pueden no ser precisos.`);
    } else {
      setApiError(null); // Limpiar errores si el ingrediente tiene datos
    }
    setIngredientesSeleccionados([...ingredientesSeleccionados, nuevoIngrediente]);
    setNombreIngrediente('');
    setCantidadIngrediente('');
  };

  const eliminarIngrediente = (index) => {
    const nuevosIngredientes = ingredientesSeleccionados.filter((_, i) => i !== index);
    setIngredientesSeleccionados(nuevosIngredientes);
  };

  const limpiarTodo = () => {
    // Limpiar ingredientes seleccionados
    setIngredientesSeleccionados([]);
    
    // Limpiar resultados de cálculos
    setRequerimientos(null);
    setAporteRacion(null);
    setBalanceRacion(null);
    setRecomendaciones([]);
    
    // Limpiar errores
    setApiError(null);
    
    // Resetear datos del animal a valores por defecto
    setAnimalData({
      peso: '',
      produccion_leche: '',
      grasa_leche: 3.5,
      edad_meses: 24,
      condicion_corporal: 3.0,
      estado_fisiologico: 'lactancia_media'
    });
    
    // Resetear campos de ingredientes
    setNombreIngrediente('');
    setCantidadIngrediente('');
    setTipoIngrediente('forraje');
    
    console.log('✅ Formulario limpiado completamente');
  };

  // Función para calcular requerimientos básicos usando fórmulas NRC simplificadas
  const calcularRequerimientosBasicos = (peso, produccionLeche, grasaLeche) => {
    const pesoKg = parseFloat(peso);
    const lecheKg = parseFloat(produccionLeche);
    const grasaPct = parseFloat(grasaLeche);

    // Usar datos de la tabla de mantenimiento si están disponibles, sino usar fórmulas básicas
    let mantenimiento;
    if (requerimientosMantenimiento) {
      console.log('Usando datos de tabla de mantenimiento NRC para cálculos');
      mantenimiento = {
        ms: requerimientosMantenimiento.materia_seca_kg,
        pb: requerimientosMantenimiento.proteina_total_g,
        em: requerimientosMantenimiento.energia_metabolizable_mcal,
        ca: requerimientosMantenimiento.calcio_g,
        p: requerimientosMantenimiento.fosforo_g
      };
    } else {
      console.log('Usando fórmulas básicas NRC para mantenimiento');
      mantenimiento = {
        ms: pesoKg * 0.026, // 2.6% del peso vivo
        pb: pesoKg * 0.96, // gramos de proteína para mantenimiento
        em: pesoKg * 0.077, // Mcal EM para mantenimiento
        ca: pesoKg * 0.043, // gramos de calcio
        p: pesoKg * 0.028 // gramos de fósforo
      };
    }

    // Usar datos de la tabla por grasa si están disponibles, sino usar valores por defecto
    let porKgLeche;
    if (requerimientosPorGrasa) {
      console.log('Usando datos de tabla por porcentaje de grasa para REQUER/kg leche');
      porKgLeche = {
        ms: 0.372, // Este valor se mantiene constante según NRC
        pb: requerimientosPorGrasa.proteina_total_g, // gramos PB por kg leche desde tabla
        em: requerimientosPorGrasa.energia_metabolizable_mcal, // Mcal EM por kg leche desde tabla
        ca: requerimientosPorGrasa.calcio_g, // gramos Ca por kg leche desde tabla
        p: requerimientosPorGrasa.fosforo_g // gramos P por kg leche desde tabla
      };
    } else {
      console.log('Usando valores por defecto para REQUER/kg leche');
      porKgLeche = {
        ms: 0.372, // kg MS por kg de leche
        pb: 78, // gramos PB por kg leche
        em: 0.64, // Mcal EM por kg leche
        ca: 2.7, // gramos Ca por kg leche
        p: 1.8 // gramos P por kg leche
      };
    }

    const produccion = {
      ms: lecheKg * porKgLeche.ms,
      pb: lecheKg * porKgLeche.pb,
      em: lecheKg * porKgLeche.em,
      ca: lecheKg * porKgLeche.ca,
      p: lecheKg * porKgLeche.p
    };

    const total = {
      ms: mantenimiento.ms + produccion.ms,
      pb: mantenimiento.pb + produccion.pb,
      em: mantenimiento.em + produccion.em,
      ca: mantenimiento.ca + produccion.ca,
      p: mantenimiento.p + produccion.p
    };

    console.log('📊 Requerimientos calculados:', {
      fuente_mantenimiento: requerimientosMantenimiento ? 'Tabla NRC' : 'Fórmulas básicas',
      fuente_por_kg_leche: requerimientosPorGrasa ? 'Tabla por grasa' : 'Valores por defecto',
      peso: pesoKg,
      produccion_leche: lecheKg,
      grasa_leche: grasaPct,
      mantenimiento,
      por_kg_leche: porKgLeche,
      total
    });

    return {
      mantenimiento,
      por_kg_leche: porKgLeche,
      produccion,
      total
    };
  };

  // Función de validación mejorada
  const validarDatos = () => {
    const errores = [];
    
    if (!animalData.peso || parseFloat(animalData.peso) <= 0) {
      errores.push('El peso del animal es obligatorio y debe ser mayor a 0');
    }
    
    if (!animalData.produccion_leche || parseFloat(animalData.produccion_leche) < 0) {
      errores.push('La producción de leche es obligatoria y debe ser mayor o igual a 0');
    }
    
    if (parseFloat(animalData.peso) < 200 || parseFloat(animalData.peso) > 1000) {
      errores.push('El peso debe estar entre 200 y 1000 kg');
    }
    
    if (parseFloat(animalData.produccion_leche) > 60) {
      errores.push('La producción de leche no puede ser mayor a 60 L/día');
    }
    
    if (ingredientesSeleccionados.length === 0) {
      errores.push('Debe seleccionar al menos un ingrediente');
    }
    
    return errores;
  };

  const balancearRacion = async () => {
    const errores = validarDatos();
    if (errores.length > 0) {
      setApiError(errores.join('. '));
      return;
    }

    setCalculating(true);
    setApiError(null);

    try {
      // Intentar primero con las rutas NRC específicas, si fallan usar rutas genéricas
      let reqResponse, balanceResponse;
      
      try {
        // Paso 1: Calcular requerimientos NRC
        reqResponse = await fetch(apiUrl('/api/nrc-balancer/calculate_requirements'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader()
          },
          body: JSON.stringify({
            peso: parseFloat(animalData.peso),
            produccion_leche: parseFloat(animalData.produccion_leche),
            grasa_leche: animalData.grasa_leche,
            edad_meses: animalData.edad_meses,
            condicion_corporal: animalData.condicion_corporal,
            estado_fisiologico: animalData.estado_fisiologico
          })
        });
      } catch (error) {
        // Backend tiene errores de BD, usar cálculo local directo
        console.warn('Backend con errores de BD, usando cálculo local de requerimientos');
        setApiError(''); // Limpiar errores previos
        const requerimientosLocales = calcularRequerimientosBasicos(
          animalData.peso, 
          animalData.produccion_leche, 
          animalData.grasa_leche
        );
        console.log('Requerimientos calculados localmente:', requerimientosLocales);
        setRequerimientos(requerimientosLocales);
        reqResponse = { ok: true }; // Simular respuesta exitosa
      }

      if (!reqResponse.ok) {
        throw new Error('Error al calcular requerimientos nutricionales');
      }

      // Solo hacer json() si no es el fallback local
      if (reqResponse.json) {
        const reqData = await reqResponse.json();
        setRequerimientos(reqData.requerimientos || reqData);
      }
      // Si es fallback local, los requerimientos ya están seteados

      try {
        // Paso 2: Balancear ración con ingredientes seleccionados
        balanceResponse = await fetch(apiUrl('/api/nrc-balancer/balance_ration'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader()
          },
          body: JSON.stringify({
            animal: {
              peso: parseFloat(animalData.peso),
              produccion_leche: parseFloat(animalData.produccion_leche),
              grasa_leche: animalData.grasa_leche,
              edad_meses: animalData.edad_meses,
              condicion_corporal: animalData.condicion_corporal,
              estado_fisiologico: animalData.estado_fisiologico
            },
            ingredientes: ingredientesSeleccionados.map(ing => ({
              id_ingrediente: ing.id,
              cantidad: ing.cantidad
            })),
            configuracion: {
              modo_auto: modoAuto,
              usar_nrc: usarNRC,
              proporcion_fc: proporcionFC
            }
          })
        });
      } catch (error) {
        // Backend tiene errores de BD, usar cálculo local directo
        console.warn('Backend con errores de BD, usando cálculo local directo');
        balanceResponse = { ok: true }; // Simular respuesta exitosa para usar cálculo local
      }

      if (!balanceResponse.ok) {
        throw new Error('Error al balancear la ración');
      }

      // Solo hacer json() si no es el fallback local
      let balanceData = {};
      if (balanceResponse.json) {
        balanceData = await balanceResponse.json();
      } else {
        // Para fallback local, crear estructura básica
        balanceData = { success: true };
      }
      
      if (balanceData.success !== false) {
        // Calcular aportes basándose en los ingredientes seleccionados
        const ingredientesConAporte = ingredientesSeleccionados.map(ing => {
          // Usar los datos ya almacenados en el ingrediente seleccionado
          const cantidad = parseFloat(ing.cantidad);
          const ms_pct = parseFloat(ing.ms_pct || 0);
          const pb_pct = parseFloat(ing.pb_pct || 0);
          const em_mcal = parseFloat(ing.em_mcal || 0);
          const ca_pct = parseFloat(ing.ca_pct || 0);
          const p_pct = parseFloat(ing.p_pct || 0);
          
          return {
            nombre: ing.nombre,
            cantidad: cantidad,
            ms_pct: ms_pct,
            ms_aporte: cantidad * ms_pct / 100, // kg de MS
            pb_pct: pb_pct,
            pb_aporte: cantidad * pb_pct / 100 * 1000, // gramos de PB (kg * % * 1000)
            em_mcal: em_mcal,
            em_aporte: cantidad * em_mcal, // Mcal de EM (kg * Mcal/kg)
            ca_pct: ca_pct,
            ca_aporte: cantidad * ca_pct / 100 * 1000, // gramos de Ca (kg * % * 1000)
            p_pct: p_pct,
            p_aporte: cantidad * p_pct / 100 * 1000 // gramos de P (kg * % * 1000)
          };
        });

        const aporteCalculado = {
          ingredientes: ingredientesConAporte,
          ms_total: ingredientesConAporte.reduce((total, ing) => total + ing.ms_aporte, 0),
          pb_total: ingredientesConAporte.reduce((total, ing) => total + ing.pb_aporte, 0),
          em_total: ingredientesConAporte.reduce((total, ing) => total + ing.em_aporte, 0),
          ca_total: ingredientesConAporte.reduce((total, ing) => total + ing.ca_aporte, 0),
          p_total: ingredientesConAporte.reduce((total, ing) => total + ing.p_aporte, 0)
        };

        setAporteRacion(balanceData.aporte_racion || aporteCalculado);
        
        // Calcular balance usando los datos calculados
        const aportes = balanceData.aporte_racion || aporteCalculado;
        const reqs = requerimientos || {};
        
        // Calcular suficiencias según lógica de RACIONES6 (APORTE / REQUERIMIENTO * 100)
        const suficienciaMS = reqs.total?.ms ? ((aportes.ms_total || 0) / reqs.total.ms * 100) : 0;
        const suficienciaPB = reqs.total?.pb ? ((aportes.pb_total || 0) / reqs.total.pb * 100) : 0;
        const suficienciaEM = reqs.total?.em ? ((aportes.em_total || 0) / reqs.total.em * 100) : 0;
        const suficienciaCa = reqs.total?.ca ? ((aportes.ca_total || 0) / reqs.total.ca * 100) : 0;
        const suficienciaP = reqs.total?.p ? ((aportes.p_total || 0) / reqs.total.p * 100) : 0;

        console.log('📊 Suficiencias calculadas (RACIONES6 - Rango 85-100%):', {
          MS: suficienciaMS.toFixed(1) + '%',
          PB: suficienciaPB.toFixed(1) + '%', 
          EM: suficienciaEM.toFixed(1) + '%',
          Ca: suficienciaCa.toFixed(1) + '%',
          P: suficienciaP.toFixed(1) + '%'
        });
        
        const balanceCalculado = {
          aporte: {
            ms: aportes.ms_total || 0,
            pb: aportes.pb_total || 0,
            em: aportes.em_total || 0,
            ca: aportes.ca_total || 0,
            p: aportes.p_total || 0
          },
          requerimiento: {
            ms: reqs.total?.ms || 0,
            pb: reqs.total?.pb || 0,
            em: reqs.total?.em || 0,
            ca: reqs.total?.ca || 0,
            p: reqs.total?.p || 0
          },
          cumplimiento: {
            ms: suficienciaMS >= 85 && suficienciaMS <= 100,
            pb: suficienciaPB >= 85 && suficienciaPB <= 100,
            em: suficienciaEM >= 85 && suficienciaEM <= 100,
            ca: suficienciaCa >= 85 && suficienciaCa <= 100,
            p: suficienciaP >= 85 && suficienciaP <= 100
          },
          suficiencia: {
            ms: reqs.total?.ms ? ((aportes.ms_total || 0) / reqs.total.ms * 100) : 0,
            pb: reqs.total?.pb ? ((aportes.pb_total || 0) / reqs.total.pb * 100) : 0,
            em: reqs.total?.em ? ((aportes.em_total || 0) / reqs.total.em * 100) : 0,
            ca: reqs.total?.ca ? ((aportes.ca_total || 0) / reqs.total.ca * 100) : 0,
            p: reqs.total?.p ? ((aportes.p_total || 0) / reqs.total.p * 100) : 0
          }
        };

        setBalanceRacion(balanceData.balance_racion || balanceCalculado);
        
        // Generar recomendaciones automáticas
        const recomendacionesGeneradas = generarRecomendaciones(balanceCalculado, reqs, aportes);
        setRecomendaciones(balanceData.recomendaciones || recomendacionesGeneradas);
      } else {
        throw new Error(balanceData.error || 'Error en el balanceo de la ración');
      }

    } catch (error) {
      console.error('Error en balanceo:', error);
      setApiError(error.message);
    } finally {
      setCalculating(false);
    }
  };

  // Función helper para determinar estado según lógica RACIONES6 (85-100%)
  const getEstadoSuficiencia = (suficiencia) => {
    if (suficiencia >= 85 && suficiencia <= 100) {
      return { texto: '✅ Correcto', color: '#2e7d32', cumple: true };
    } else if (suficiencia < 85) {
      return { texto: '⚠️ Bajo', color: '#f57c00', cumple: false };
    } else {
      return { texto: 'ℹ️ Exceso', color: '#1976d2', cumple: true };
    }
  };

  // Función para calcular aportes de ingredientes
  const calcularAportesIngredientes = (ingredientes) => {
    return ingredientes.reduce((total, ing) => {
      const cantidad = parseFloat(ing.cantidad || 0);
      const ms_pct = parseFloat(ing.ms_pct || 0) / 100;
      const pb_pct = parseFloat(ing.pb_pct || 0) / 100;
      const em_mcal = parseFloat(ing.em_mcal || 0);
      const ca_pct = parseFloat(ing.ca_pct || 0) / 100;
      const p_pct = parseFloat(ing.p_pct || 0) / 100;

      return {
        ms_total: total.ms_total + (cantidad * ms_pct),
        pb_total: total.pb_total + (cantidad * pb_pct * 1000), // convertir a gramos
        em_total: total.em_total + (cantidad * em_mcal),
        ca_total: total.ca_total + (cantidad * ca_pct * 1000), // convertir a gramos
        p_total: total.p_total + (cantidad * p_pct * 1000) // convertir a gramos
      };
    }, {
      ms_total: 0,
      pb_total: 0,
      em_total: 0,
      ca_total: 0,
      p_total: 0
    });
  };

  // Función de balanceo automático basada en RACIONES6
  const balanceoAutomatico = (ingredientes, requerimientos) => {
    if (!ingredientes || ingredientes.length === 0 || !requerimientos) {
      return ingredientes;
    }

    console.log('🔄 Iniciando balanceo automático...');
    
    // Crear copia de ingredientes para modificar
    let ingredientesBalanceados = ingredientes.map(ing => ({
      ...ing,
      cantidad: parseFloat(ing.cantidad || 1) // Asegurar cantidad mínima inicial
    }));

    // Separar forrajes y concentrados
    const forrajes = ingredientesBalanceados.filter(ing => ing.tipo === 'forraje');
    const concentrados = ingredientesBalanceados.filter(ing => ing.tipo === 'concentrado');
    
    console.log(`📊 Ingredientes: ${forrajes.length} forrajes, ${concentrados.length} concentrados`);

    const maxIteraciones = 50;
    const tolerancia = 3; // ±3% de tolerancia para considerar "en rango"
    
    for (let iteracion = 0; iteracion < maxIteraciones; iteracion++) {
      // Calcular aportes actuales
      const aportes = calcularAportesIngredientes(ingredientesBalanceados);
      
      // Calcular suficiencias
      const sufMS = requerimientos.total?.ms ? (aportes.ms_total / requerimientos.total.ms * 100) : 0;
      const sufPB = requerimientos.total?.pb ? (aportes.pb_total / requerimientos.total.pb * 100) : 0;
      const sufEM = requerimientos.total?.em ? (aportes.em_total / requerimientos.total.em * 100) : 0;
      const sufCa = requerimientos.total?.ca ? (aportes.ca_total / requerimientos.total.ca * 100) : 0;
      const sufP = requerimientos.total?.p ? (aportes.p_total / requerimientos.total.p * 100) : 0;

      console.log(`📊 Iteración ${iteracion + 1}: MS:${sufMS.toFixed(1)}%, PB:${sufPB.toFixed(1)}%, EM:${sufEM.toFixed(1)}%, Ca:${sufCa.toFixed(1)}%, P:${sufP.toFixed(1)}%`);

      // Verificar si está en rango óptimo (85-100% ±tolerancia)
      const enRangoMS = sufMS >= (85 - tolerancia) && sufMS <= (100 + tolerancia);
      const enRangoPB = sufPB >= (85 - tolerancia) && sufPB <= (100 + tolerancia);
      const enRangoEM = sufEM >= (85 - tolerancia) && sufEM <= (100 + tolerancia);
      const enRangoCa = sufCa >= (85 - tolerancia) && sufCa <= (100 + tolerancia);
      const enRangoP = sufP >= (85 - tolerancia) && sufP <= (100 + tolerancia);

      if (enRangoMS && enRangoPB && enRangoEM && enRangoCa && enRangoP) {
        console.log('✅ Balanceo completado - Todos los nutrientes en rango óptimo');
        break;
      }

      // Identificar nutriente más desviado del rango objetivo (92.5% = punto medio)
      const objetivo = 92.5;
      const desviaciones = [
        { nutriente: 'MS', suficiencia: sufMS, desviacion: Math.abs(sufMS - objetivo) },
        { nutriente: 'PB', suficiencia: sufPB, desviacion: Math.abs(sufPB - objetivo) },
        { nutriente: 'EM', suficiencia: sufEM, desviacion: Math.abs(sufEM - objetivo) },
        { nutriente: 'Ca', suficiencia: sufCa, desviacion: Math.abs(sufCa - objetivo) },
        { nutriente: 'P', suficiencia: sufP, desviacion: Math.abs(sufP - objetivo) }
      ];

      // Ordenar por mayor desviación
      desviaciones.sort((a, b) => b.desviacion - a.desviacion);
      const nutrientePrioritario = desviaciones[0];

      console.log(`🎯 Nutriente prioritario: ${nutrientePrioritario.nutriente} (${nutrientePrioritario.suficiencia.toFixed(1)}%)`);

      // Ajustar ingredientes según el nutriente prioritario
      if (nutrientePrioritario.suficiencia < 85) {
        // Déficit: aumentar ingrediente con mayor contenido del nutriente
        ajustarIngredienteDeficit(ingredientesBalanceados, nutrientePrioritario.nutriente);
      } else if (nutrientePrioritario.suficiencia > 100) {
        // Exceso: reducir ingrediente con mayor contenido del nutriente
        ajustarIngredienteExceso(ingredientesBalanceados, nutrientePrioritario.nutriente);
      }
    }

    return ingredientesBalanceados;
  };

  // Función para ajustar ingredientes en caso de déficit
  const ajustarIngredienteDeficit = (ingredientes, nutriente) => {
    const factorAumento = 1.08; // Aumentar 8% por iteración para convergencia más rápida
    
    // Encontrar ingrediente con mayor contenido del nutriente deficitario
    let mejorIngrediente = null;
    let mayorContenido = 0;

    ingredientes.forEach(ing => {
      let contenido = 0;
      switch (nutriente) {
        case 'MS': contenido = parseFloat(ing.ms_pct || 0); break;
        case 'PB': contenido = parseFloat(ing.pb_pct || 0); break;
        case 'EM': contenido = parseFloat(ing.em_mcal || 0); break;
        case 'Ca': contenido = parseFloat(ing.ca_pct || 0); break;
        case 'P': contenido = parseFloat(ing.p_pct || 0); break;
      }
      
      if (contenido > mayorContenido) {
        mayorContenido = contenido;
        mejorIngrediente = ing;
      }
    });

    if (mejorIngrediente) {
      const cantidadAnterior = mejorIngrediente.cantidad;
      mejorIngrediente.cantidad *= factorAumento;
      
      // Limitar cantidad máxima razonable (no más de 20 kg por ingrediente)
      mejorIngrediente.cantidad = Math.min(mejorIngrediente.cantidad, 20);
      
      console.log(`⬆️ Aumentando ${mejorIngrediente.nombre} para ${nutriente}: ${cantidadAnterior.toFixed(2)} → ${mejorIngrediente.cantidad.toFixed(2)} kg`);
    }
  };

  // Función para ajustar ingredientes en caso de exceso
  const ajustarIngredienteExceso = (ingredientes, nutriente) => {
    const factorReduccion = 0.92; // Reducir 8% por iteración para convergencia más rápida
    
    // Encontrar ingrediente con mayor contenido del nutriente en exceso
    let peorIngrediente = null;
    let mayorContenido = 0;

    ingredientes.forEach(ing => {
      let contenido = 0;
      switch (nutriente) {
        case 'MS': contenido = parseFloat(ing.ms_pct || 0); break;
        case 'PB': contenido = parseFloat(ing.pb_pct || 0); break;
        case 'EM': contenido = parseFloat(ing.em_mcal || 0); break;
        case 'Ca': contenido = parseFloat(ing.ca_pct || 0); break;
        case 'P': contenido = parseFloat(ing.p_pct || 0); break;
      }
      
      if (contenido > mayorContenido && ing.cantidad > 0.3) { // No reducir por debajo de 0.3 kg
        mayorContenido = contenido;
        peorIngrediente = ing;
      }
    });

    if (peorIngrediente) {
      const cantidadAnterior = peorIngrediente.cantidad;
      peorIngrediente.cantidad = Math.max(0.3, peorIngrediente.cantidad * factorReduccion);
      
      console.log(`⬇️ Reduciendo ${peorIngrediente.nombre} para ${nutriente}: ${cantidadAnterior.toFixed(2)} → ${peorIngrediente.cantidad.toFixed(2)} kg`);
    }
  };

  // Handler para cambio de cantidad de ingrediente con recálculo automático
  const handleCantidadChange = async (index, nuevaCantidad) => {
    // Actualizar la cantidad del ingrediente
    const nuevosIngredientes = [...ingredientesSeleccionados];
    nuevosIngredientes[index].cantidad = nuevaCantidad;
    setIngredientesSeleccionados(nuevosIngredientes);

    // Si hay datos suficientes, recalcular automáticamente después de un pequeño delay
    if (animalData.peso && animalData.produccion_leche && requerimientos && nuevaCantidad !== '') {
      // Usar debounce para evitar múltiples cálculos mientras el usuario escribe
      if (window.recalculoTimeout) {
        clearTimeout(window.recalculoTimeout);
      }
      
      window.recalculoTimeout = setTimeout(async () => {
        console.log('🔄 Recalculando automáticamente por cambio de cantidad...');
        setRecalculando(true);
        try {
          await recalcularBalance();
        } catch (error) {
          console.error('Error en recálculo automático:', error);
        } finally {
          setRecalculando(false);
        }
      }, 800); // Esperar 800ms después del último cambio
    }
  };

  // Función para recalcular balance sin llamar al backend
  const recalcularBalance = async () => {
    if (!requerimientos || ingredientesSeleccionados.length === 0) return;

    // Calcular aportes basándose en los ingredientes seleccionados actuales
    const ingredientesConAporte = ingredientesSeleccionados.map(ing => {
      const cantidad = parseFloat(ing.cantidad || 0);
      const ms_pct = parseFloat(ing.ms_pct || 0) / 100;
      const pb_pct = parseFloat(ing.pb_pct || 0) / 100;
      const em_mcal = parseFloat(ing.em_mcal || 0);
      const ca_pct = parseFloat(ing.ca_pct || 0) / 100;
      const p_pct = parseFloat(ing.p_pct || 0) / 100;

      return {
        ...ing,
        ms_aporte: cantidad * ms_pct,
        pb_aporte: cantidad * pb_pct * 1000, // convertir a gramos
        em_aporte: cantidad * em_mcal,
        ca_aporte: cantidad * ca_pct * 1000, // convertir a gramos
        p_aporte: cantidad * p_pct * 1000 // convertir a gramos
      };
    });

    const aporteCalculado = {
      ms_total: ingredientesConAporte.reduce((total, ing) => total + ing.ms_aporte, 0),
      pb_total: ingredientesConAporte.reduce((total, ing) => total + ing.pb_aporte, 0),
      em_total: ingredientesConAporte.reduce((total, ing) => total + ing.em_aporte, 0),
      ca_total: ingredientesConAporte.reduce((total, ing) => total + ing.ca_aporte, 0),
      p_total: ingredientesConAporte.reduce((total, ing) => total + ing.p_aporte, 0)
    };

    setAporteRacion(aporteCalculado);
    
    // Calcular balance usando los datos calculados
    const aportes = aporteCalculado;
    const reqs = requerimientos || {};
    
    // Calcular suficiencias según lógica de RACIONES6 (APORTE / REQUERIMIENTO * 100)
    const suficienciaMS = reqs.total?.ms ? ((aportes.ms_total || 0) / reqs.total.ms * 100) : 0;
    const suficienciaPB = reqs.total?.pb ? ((aportes.pb_total || 0) / reqs.total.pb * 100) : 0;
    const suficienciaEM = reqs.total?.em ? ((aportes.em_total || 0) / reqs.total.em * 100) : 0;
    const suficienciaCa = reqs.total?.ca ? ((aportes.ca_total || 0) / reqs.total.ca * 100) : 0;
    const suficienciaP = reqs.total?.p ? ((aportes.p_total || 0) / reqs.total.p * 100) : 0;

    console.log('🔄 Suficiencias recalculadas automáticamente:', {
      MS: suficienciaMS.toFixed(1) + '%',
      PB: suficienciaPB.toFixed(1) + '%', 
      EM: suficienciaEM.toFixed(1) + '%',
      Ca: suficienciaCa.toFixed(1) + '%',
      P: suficienciaP.toFixed(1) + '%'
    });
    
    const balanceCalculado = {
      aporte: {
        ms: aportes.ms_total || 0,
        pb: aportes.pb_total || 0,
        em: aportes.em_total || 0,
        ca: aportes.ca_total || 0,
        p: aportes.p_total || 0
      },
      requerimiento: {
        ms: reqs.total?.ms || 0,
        pb: reqs.total?.pb || 0,
        em: reqs.total?.em || 0,
        ca: reqs.total?.ca || 0,
        p: reqs.total?.p || 0
      },
      cumplimiento: {
        ms: suficienciaMS >= 85 && suficienciaMS <= 100,
        pb: suficienciaPB >= 85 && suficienciaPB <= 100,
        em: suficienciaEM >= 85 && suficienciaEM <= 100,
        ca: suficienciaCa >= 85 && suficienciaCa <= 100,
        p: suficienciaP >= 85 && suficienciaP <= 100
      },
      suficiencia: {
        ms: suficienciaMS,
        pb: suficienciaPB,
        em: suficienciaEM,
        ca: suficienciaCa,
        p: suficienciaP
      }
    };

    setBalanceRacion(balanceCalculado);
    
    // Generar recomendaciones automáticas
    const recomendacionesGeneradas = generarRecomendaciones(balanceCalculado, reqs, aportes);
    setRecomendaciones(recomendacionesGeneradas);
  };

  // Handler para balanceo automático
  const balanceoAutomaticoHandler = async () => {
    if (!requerimientos || ingredientesSeleccionados.length === 0) {
      setApiError('Necesita requerimientos calculados e ingredientes seleccionados para el balanceo automático');
      return;
    }

    setCalculating(true);
    setApiError(null);

    try {
      console.log('🚀 Iniciando balanceo automático de ingredientes...');
      
      // Verificar que los ingredientes tengan cantidades iniciales
      const ingredientesConCantidad = ingredientesSeleccionados.map(ing => ({
        ...ing,
        cantidad: parseFloat(ing.cantidad || 1) // Si está en 0, asignar 1 kg inicial
      }));

      // Ejecutar balanceo automático
      const ingredientesBalanceados = balanceoAutomatico(ingredientesConCantidad, requerimientos);
      
      // Actualizar ingredientes seleccionados con las nuevas cantidades
      setIngredientesSeleccionados(ingredientesBalanceados.map(ing => ({
        ...ing,
        cantidad: ing.cantidad.toFixed(2)
      })));

      // Recalcular automáticamente después del balanceo
      setTimeout(() => {
        balancearRacion();
      }, 500);

      console.log('✅ Balanceo automático completado');
      
    } catch (error) {
      console.error('Error en balanceo automático:', error);
      setApiError('Error durante el balanceo automático: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  // Función para generar recomendaciones automáticas
  const generarRecomendaciones = (balance, requerimientos, aportes) => {
    const recomendaciones = [];
    
    if (!balance || !requerimientos || !aportes) return recomendaciones;

    // Verificar suficiencia de Materia Seca (Rango óptimo: 85-100%)
    if (balance.suficiencia.ms < 85) {
      const deficit = requerimientos.total.ms - aportes.ms_total;
      recomendaciones.push(`<strong>Materia Seca:</strong> Bajo (${balance.suficiencia.ms.toFixed(1)}%). Déficit de ${deficit.toFixed(2)} kg. Aumentar forraje o concentrado.`);
    } else if (balance.suficiencia.ms > 100) {
      const exceso = aportes.ms_total - requerimientos.total.ms;
      recomendaciones.push(`<strong>Materia Seca:</strong> Exceso (${balance.suficiencia.ms.toFixed(1)}%). Exceso de ${exceso.toFixed(2)} kg. Reducir cantidad de ingredientes.`);
    }

    // Verificar suficiencia de Proteína Bruta (Rango óptimo: 85-100%)
    if (balance.suficiencia.pb < 85) {
      const deficit = requerimientos.total.pb - aportes.pb_total;
      recomendaciones.push(`<strong>Proteína Bruta:</strong> Bajo (${balance.suficiencia.pb.toFixed(1)}%). Déficit de ${deficit.toFixed(0)} g. Agregar torta de soya o concentrado proteico.`);
    } else if (balance.suficiencia.pb > 100) {
      const exceso = aportes.pb_total - requerimientos.total.pb;
      recomendaciones.push(`<strong>Proteína Bruta:</strong> Exceso (${balance.suficiencia.pb.toFixed(1)}%). Exceso de ${exceso.toFixed(0)} g. Reducir ingredientes proteicos para optimizar costos.`);
    }

    // Verificar suficiencia de Energía Metabolizable (Rango óptimo: 85-100%)
    if (balance.suficiencia.em < 85) {
      const deficit = requerimientos.total.em - aportes.em_total;
      recomendaciones.push(`<strong>Energía Metabolizable:</strong> Bajo (${balance.suficiencia.em.toFixed(1)}%). Déficit de ${deficit.toFixed(2)} Mcal. Agregar maíz o concentrado energético.`);
    } else if (balance.suficiencia.em > 100) {
      const exceso = aportes.em_total - requerimientos.total.em;
      recomendaciones.push(`<strong>Energía Metabolizable:</strong> Exceso (${balance.suficiencia.em.toFixed(1)}%). Exceso de ${exceso.toFixed(2)} Mcal. Reducir ingredientes energéticos.`);
    }

    // Verificar suficiencia de Calcio (Rango óptimo: 85-100%)
    if (balance.suficiencia.ca < 85) {
      const deficit = requerimientos.total.ca - aportes.ca_total;
      recomendaciones.push(`<strong>Calcio:</strong> Bajo (${balance.suficiencia.ca.toFixed(1)}%). Déficit de ${deficit.toFixed(2)} g. Agregar carbonato de calcio o heno de alfalfa.`);
    } else if (balance.suficiencia.ca > 100) {
      const exceso = aportes.ca_total - requerimientos.total.ca;
      recomendaciones.push(`<strong>Calcio:</strong> Exceso (${balance.suficiencia.ca.toFixed(1)}%). Exceso de ${exceso.toFixed(2)} g. Reducir fuentes de calcio.`);
    }

    // Verificar suficiencia de Fósforo (Rango óptimo: 85-100%)
    if (balance.suficiencia.p < 85) {
      const deficit = requerimientos.total.p - aportes.p_total;
      recomendaciones.push(`<strong>Fósforo:</strong> Bajo (${balance.suficiencia.p.toFixed(1)}%). Déficit de ${deficit.toFixed(2)} g. Agregar fosfato bicálcico o salvado de trigo.`);
    } else if (balance.suficiencia.p > 100) {
      const exceso = aportes.p_total - requerimientos.total.p;
      recomendaciones.push(`<strong>Fósforo:</strong> Exceso (${balance.suficiencia.p.toFixed(1)}%). Exceso de ${exceso.toFixed(2)} g. Reducir fuentes de fósforo.`);
    }

    // Recomendaciones generales
    if (recomendaciones.length === 0) {
      recomendaciones.push(`<strong>✅ Excelente:</strong> La ración cumple con todos los requerimientos nutricionales.`);
    }

    // Verificar relación Ca:P
    const relacionCaP = (aportes.ca_total / aportes.p_total);
    if (relacionCaP < 1.2 || relacionCaP > 2.5) {
      recomendaciones.push(`<strong>Relación Ca:P:</strong> Actual ${relacionCaP.toFixed(2)}:1. Ideal entre 1.2:1 y 2.5:1.`);
    }

    return recomendaciones;
  };

  // Función para exportar resultados a PDF
  const exportarPDF = () => {
    if (!requerimientos || !aporteRacion) {
      setApiError('No hay resultados para exportar');
      return;
    }

    const fecha = new Date().toLocaleDateString('es-ES');
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Balance de Raciones Bovinas - ${fecha}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; background: #2d5016; color: white; padding: 20px; margin-bottom: 20px; }
          .section { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background: #4a7c59; color: white; }
          .animal-info { background: #f0f8f0; padding: 15px; border-radius: 5px; }
          .cumple { color: #166534; font-weight: bold; }
          .no-cumple { color: #991b1b; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🐄 Sistema de Balance de Raciones Bovinas</h1>
          <p>Fecha: ${fecha}</p>
        </div>
        
        <div class="animal-info">
          <h3>Datos del Animal</h3>
          <p><strong>Peso:</strong> ${animalData.peso} kg</p>
          <p><strong>Producción de leche:</strong> ${animalData.produccion_leche} L/día</p>
          <p><strong>% Grasa en leche:</strong> ${animalData.grasa_leche}%</p>
          <p><strong>Estado fisiológico:</strong> ${animalData.estado_fisiologico}</p>
        </div>

        <div class="section">
          <h3>Requerimientos Nutricionales</h3>
          <table>
            <tr><th></th><th>MS (kg)</th><th>PB (g)</th><th>EM (Mcal)</th><th>Ca (g)</th><th>P (g)</th></tr>
            <tr><td>Mantenimiento</td><td>${requerimientos.mantenimiento?.ms?.toFixed(2) || '-'}</td><td>${requerimientos.mantenimiento?.pb?.toFixed(0) || '-'}</td><td>${requerimientos.mantenimiento?.em?.toFixed(2) || '-'}</td><td>${requerimientos.mantenimiento?.ca?.toFixed(2) || '-'}</td><td>${requerimientos.mantenimiento?.p?.toFixed(2) || '-'}</td></tr>
            <tr><td>Producción</td><td>${requerimientos.produccion?.ms?.toFixed(2) || '-'}</td><td>${requerimientos.produccion?.pb?.toFixed(0) || '-'}</td><td>${requerimientos.produccion?.em?.toFixed(2) || '-'}</td><td>${requerimientos.produccion?.ca?.toFixed(2) || '-'}</td><td>${requerimientos.produccion?.p?.toFixed(2) || '-'}</td></tr>
            <tr style="background: #f0f8f0;"><td><strong>Total</strong></td><td><strong>${requerimientos.total?.ms?.toFixed(2) || '-'}</strong></td><td><strong>${requerimientos.total?.pb?.toFixed(0) || '-'}</strong></td><td><strong>${requerimientos.total?.em?.toFixed(2) || '-'}</strong></td><td><strong>${requerimientos.total?.ca?.toFixed(2) || '-'}</strong></td><td><strong>${requerimientos.total?.p?.toFixed(2) || '-'}</strong></td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Aporte de la Ración</h3>
          <table>
            <tr><th>Ingrediente</th><th>Cantidad (kg)</th><th>MS (kg)</th><th>PB (g)</th><th>EM (Mcal)</th><th>Ca (g)</th><th>P (g)</th></tr>
            ${aporteRacion.ingredientes?.map(ing => `
              <tr>
                <td>${ing.nombre}</td>
                <td>${ing.cantidad?.toFixed(2)}</td>
                <td>${ing.ms_aporte?.toFixed(2)}</td>
                <td>${ing.pb_aporte?.toFixed(0)}</td>
                <td>${ing.em_aporte?.toFixed(2)}</td>
                <td>${ing.ca_aporte?.toFixed(2)}</td>
                <td>${ing.p_aporte?.toFixed(2)}</td>
              </tr>
            `).join('') || ''}
            <tr style="background: #f0f8f0;">
              <td><strong>TOTAL</strong></td>
              <td><strong>${ingredientesSeleccionados.reduce((total, ing) => total + ing.cantidad, 0).toFixed(2)}</strong></td>
              <td><strong>${aporteRacion.ms_total?.toFixed(2) || '-'}</strong></td>
              <td><strong>${aporteRacion.pb_total?.toFixed(0) || '-'}</strong></td>
              <td><strong>${aporteRacion.em_total?.toFixed(2) || '-'}</strong></td>
              <td><strong>${aporteRacion.ca_total?.toFixed(2) || '-'}</strong></td>
              <td><strong>${aporteRacion.p_total?.toFixed(2) || '-'}</strong></td>
            </tr>
          </table>
        </div>

        ${balanceRacion ? `
        <div class="section">
          <h3>Balance y Cumplimiento</h3>
          <table>
            <tr><th>Nutriente</th><th>Requerido</th><th>Aportado</th><th>Suficiencia (%)</th><th>Cumplimiento</th></tr>
            <tr><td>MS (kg)</td><td>${balanceRacion.requerimiento?.ms?.toFixed(2) || '-'}</td><td>${balanceRacion.aporte?.ms?.toFixed(2) || '-'}</td><td>${balanceRacion.suficiencia?.ms?.toFixed(1) || '-'}%</td><td class="${balanceRacion.cumplimiento?.ms ? 'cumple' : 'no-cumple'}">${balanceRacion.cumplimiento?.ms ? '✅ Cumple' : '❌ No cumple'}</td></tr>
            <tr><td>PB (g)</td><td>${balanceRacion.requerimiento?.pb?.toFixed(0) || '-'}</td><td>${balanceRacion.aporte?.pb?.toFixed(0) || '-'}</td><td>${balanceRacion.suficiencia?.pb?.toFixed(1) || '-'}%</td><td class="${balanceRacion.cumplimiento?.pb ? 'cumple' : 'no-cumple'}">${balanceRacion.cumplimiento?.pb ? '✅ Cumple' : '❌ No cumple'}</td></tr>
            <tr><td>EM (Mcal)</td><td>${balanceRacion.requerimiento?.em?.toFixed(2) || '-'}</td><td>${balanceRacion.aporte?.em?.toFixed(2) || '-'}</td><td>${balanceRacion.suficiencia?.em?.toFixed(1) || '-'}%</td><td class="${balanceRacion.cumplimiento?.em ? 'cumple' : 'no-cumple'}">${balanceRacion.cumplimiento?.em ? '✅ Cumple' : '❌ No cumple'}</td></tr>
            <tr><td>Ca (g)</td><td>${balanceRacion.requerimiento?.ca?.toFixed(2) || '-'}</td><td>${balanceRacion.aporte?.ca?.toFixed(2) || '-'}</td><td>${balanceRacion.suficiencia?.ca?.toFixed(1) || '-'}%</td><td class="${balanceRacion.cumplimiento?.ca ? 'cumple' : 'no-cumple'}">${balanceRacion.cumplimiento?.ca ? '✅ Cumple' : '❌ No cumple'}</td></tr>
            <tr><td>P (g)</td><td>${balanceRacion.requerimiento?.p?.toFixed(2) || '-'}</td><td>${balanceRacion.aporte?.p?.toFixed(2) || '-'}</td><td>${balanceRacion.suficiencia?.p?.toFixed(1) || '-'}%</td><td class="${balanceRacion.cumplimiento?.p ? 'cumple' : 'no-cumple'}">${balanceRacion.cumplimiento?.p ? '✅ Cumple' : '❌ No cumple'}</td></tr>
          </table>
        </div>
        ` : ''}

        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9em;">
          <p>Generado por Sistema Ganadero - Balance de Raciones Bovinas</p>
          <p>Basado en estándares del National Research Council (NRC)</p>
        </div>
      </body>
      </html>
    `;

    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => {
        ventana.print();
      }, 500);
    }
  };

  return (
    <div className="raciones-lactancia-container">
      {/* Información inicial */}
      <div className="result-card" style={{marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#e8f4fd', border: '1px solid #00324C', borderRadius: '10px'}}>
        <div className="result-header">
          <span className="result-icon">📋</span>
          <h3 style={{color: '#00324C', margin: 0}}>Instrucciones para el Cálculo</h3>
        </div>
        <p style={{margin: '0.5rem 0 0 0', color: '#333'}}>
          Complete los campos marcados con <span style={{color: '#dc3545', fontWeight: 'bold'}}>*</span> (obligatorios) y agregue al menos un ingrediente para realizar el cálculo del balance nutricional.
        </p>
        <div className="status-alert success">
          <span>✅</span>
          <div>
            <strong>Sistema funcionando correctamente:</strong> Usando cálculos NRC locales integrados.
            <br/>
            <small>📊 <strong>Ingredientes disponibles:</strong> {ingredientesDisponibles.length} ingredientes cargados</small>
            {ingredientesDisponibles.length === 0 && (
              <button 
                onClick={() => {
                  const ingredientesLocales = getIngredientesLocales();
                  setIngredientesDisponibles(ingredientesLocales);
                  console.log('Forzando carga de ingredientes locales:', ingredientesLocales);
                }}
                style={{marginLeft: '10px', padding: '2px 8px', fontSize: '0.8rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
              >
                Cargar Ingredientes
              </button>
            )}
            {requerimientos && (
              <div style={{marginTop: '0.5rem'}}>
                <small style={{fontWeight: 'bold'}}>
                  ✅ <strong>Requerimientos calculados:</strong> MS: {requerimientos.total?.ms?.toFixed(2)} kg, PB: {requerimientos.total?.pb?.toFixed(0)} g, EM: {requerimientos.total?.em?.toFixed(2)} Mcal
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {apiError && (
        <div className="alert alert-error" data-aos="fade-in">
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {/* Secciones de formularios */}
      <div className="content-sections">
        
        {/* Sección 1: Datos del Animal - Diseño Mejorado */}
        <section className="raciones-form" data-aos="fade-up">
          <div style={{padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '10px', borderLeft: '4px solid #ffa500'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <span style={{marginRight: '0.5rem', fontSize: '1.2rem'}}>📋</span>
              <h3 style={{color: '#333', margin: 0, fontSize: '1.1rem', fontWeight: '600'}}>Datos del Animal</h3>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'end'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  Seleccionar Animal:
                </label>
                <select
                  value={animalSeleccionado?.id_animal || ''}
                  onChange={(e) => handleAnimalChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Seleccione un animal...</option>
                  {Array.isArray(animalesLactancia) && animalesLactancia.map(animal => {
                    console.log('Renderizando animal:', animal);
                    return (
                      <option 
                        key={animal.id_animal} 
                        value={animal.id_animal}
                        data-peso={animal.peso}
                        data-edad={animal.edad_meses}
                        data-raza={animal.raza}
                      >
                        {`${animal.identificador_unico || 'Animal #' + animal.id_animal} - ${animal.peso || 'N/A'} kg`}
                      </option>
                    );
                  })}
                </select>
                {animalSeleccionado && (
                  <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: '#666'}}>
                    <div>Edad: {animalSeleccionado.edad_meses} meses</div>
                    <div>Raza: {animalSeleccionado.raza || 'No especificada'}</div>
                    {requerimientosMantenimiento && (
                      <div style={{marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#e8f5e8', borderRadius: '4px', border: '1px solid #4caf50'}}>
                        <div style={{color: '#2e7d32', fontWeight: '600', fontSize: '0.8rem'}}>
                          ✅ Requerimientos de mantenimiento cargados
                        </div>
                        <div style={{color: '#666', fontSize: '0.7rem'}}>
                          MS: {requerimientosMantenimiento.materia_seca_kg.toFixed(1)} kg | 
                          PB: {requerimientosMantenimiento.proteina_total_g.toFixed(0)} g | 
                          EM: {requerimientosMantenimiento.energia_metabolizable_mcal.toFixed(2)} Mcal
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {animalData.peso === 'custom' && (
                  <div>
                    <input
                      type="number"
                      placeholder="Ingrese peso personalizado (200-800 kg)"
                      min="200"
                      max="800"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        marginTop: '0.5rem'
                      }}
                      onChange={(e) => {
                        const nuevoPeso = e.target.value;
                        setAnimalData({...animalData, peso: nuevoPeso});
                        console.log('Peso personalizado ingresado:', nuevoPeso);
                      }}
                    />
                    <small style={{color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem'}}>
                      Los requerimientos se calcularán automáticamente al ingresar el peso
                    </small>
                  </div>
                )}
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  Producción de leche (L/día):
                </label>
                <input
                  type="number"
                  placeholder="Ej. 25"
                  value={animalData.produccion_leche}
                  onChange={(e) => setAnimalData({...animalData, produccion_leche: e.target.value})}
                  min="0"
                  max="60"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  % Grasa en leche:
                </label>
                <select
                  value={animalData.grasa_leche}
                  onChange={(e) => setAnimalData({...animalData, grasa_leche: parseFloat(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Seleccione % grasa...</option>
                  <option value="2.5">2.5% - Baja</option>
                  <option value="3.0">3.0% - Normal baja</option>
                  <option value="3.5">3.5% - Normal (recomendado)</option>
                  <option value="4.0">4.0% - Normal alta</option>
                  <option value="4.5">4.5% - Alta</option>
                  <option value="5.0">5.0% - Muy alta</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Sección 2: Parámetros Nutricionales - Diseño Mejorado */}
        <section className="raciones-form" data-aos="fade-up">
          <div style={{padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '10px', borderLeft: '4px solid #28a745'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <span style={{marginRight: '0.5rem', fontSize: '1.2rem'}}>🔬</span>
              <h3 style={{color: '#333', margin: 0, fontSize: '1.1rem', fontWeight: '600'}}>Parámetros Nutricionales</h3>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'end'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  Estado Fisiológico:
                </label>
                <select
                  value={animalData.estado_fisiologico}
                  onChange={(e) => setAnimalData({...animalData, estado_fisiologico: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="mantenimiento">🐄 Mantenimiento</option>
                  <option value="crecimiento">📈 Crecimiento</option>
                  <option value="lactancia_temprana">🥛 Lactancia Temprana (0-100 días)</option>
                  <option value="lactancia_media">🥛 Lactancia Media (100-200 días)</option>
                  <option value="lactancia_tardia">🥛 Lactancia Tardía (200+ días)</option>
                  <option value="seca">🛌 Seca</option>
                  <option value="gestante">🤱 Gestante</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Sección 3: Parámetros Adicionales - Diseño Mejorado */}
        <section className="raciones-form" data-aos="fade-up">
          <div style={{padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '10px', borderLeft: '4px solid #17a2b8'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <span style={{marginRight: '0.5rem', fontSize: '1.2rem'}}>📊</span>
              <h3 style={{color: '#333', margin: 0, fontSize: '1.1rem', fontWeight: '600'}}>Parámetros Adicionales</h3>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'end'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  Edad (meses):
                </label>
                <input
                  type="number"
                  value={animalData.edad_meses}
                  onChange={(e) => setAnimalData({...animalData, edad_meses: parseInt(e.target.value)})}
                  min="6"
                  max="120"
                  placeholder={animalSeleccionado ? animalSeleccionado.edad_meses : 'Ej. 24'}
                  disabled={!!animalSeleccionado}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: animalSeleccionado ? '#f5f5f5' : '#fff',
                    color: animalSeleccionado ? '#666' : '#333'
                  }}
                />
                <small style={{color: '#666', fontSize: '0.8rem'}}>
                  {animalSeleccionado ? 
                    'Edad cargada automáticamente' : 
                    'Rango: 6-120 meses'}
                </small>
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  Condición Corporal (1-5):
                </label>
                <select
                  value={animalData.condicion_corporal}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    console.log('Condición corporal cambiada:', newValue);
                    setAnimalData(prev => ({
                      ...prev, 
                      condicion_corporal: newValue
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `2px solid ${animalData.condicion_corporal === 1.0 ? '#dc3545' : animalData.condicion_corporal === 3.0 ? '#28a745' : '#ffc107'}`,
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333',
                    transition: 'border-color 0.3s ease'
                  }}
                >
                  <option value={1.0}>1.0 - Muy flaca</option>
                  <option value={3.0}>3.0 - Ideal (recomendado)</option>
                  <option value={5.0}>5.0 - Muy gorda</option>
                </select>
                <small style={{
                  color: animalData.condicion_corporal === 1.0 ? '#dc3545' : animalData.condicion_corporal === 3.0 ? '#28a745' : '#ffc107', 
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  ✓ Seleccionado: {animalData.condicion_corporal} - {
                    animalData.condicion_corporal === 1.0 ? 'Muy flaca' : 
                    animalData.condicion_corporal === 3.0 ? 'Ideal (recomendado)' : 
                    'Muy gorda'
                  }
                </small>
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  Proporción F/C:
                </label>
                <select
                  value={proporcionFC}
                  onChange={(e) => setProporcionFC(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="70/30">70/30 - 70% Forraje</option>
                  <option value="60/40">60/40 - 60% Forraje (recomendado)</option>
                  <option value="50/50">50/50 - Equilibrado</option>
                  <option value="40/60">40/60 - 60% Concentrado</option>
                  <option value="30/70">30/70 - 70% Concentrado</option>
                </select>
                <small style={{color: '#666', fontSize: '0.8rem'}}>Proporción Forraje/Concentrado</small>
              </div>
            </div>
            
            {/* Configuraciones adicionales */}
            <div style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '6px'}}>
              <h4 style={{margin: '0 0 1rem 0', fontSize: '1rem', color: '#333'}}>⚙️ Configuración de Cálculo</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={modoAuto}
                    onChange={(e) => setModoAuto(e.target.checked)}
                    style={{marginRight: '0.5rem'}}
                  />
                  <span style={{fontSize: '0.9rem', color: '#333'}}>🤖 Balanceo automático</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={usarNRC}
                    onChange={(e) => setUsarNRC(e.target.checked)}
                    style={{marginRight: '0.5rem'}}
                  />
                  <span style={{fontSize: '0.9rem', color: '#333'}}>📊 Usar estándares NRC</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Sección 4: Gestión de Ingredientes - Diseño Mejorado */}
        <section className="raciones-form" data-aos="fade-up">
          <div style={{padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '10px', borderLeft: '4px solid #6f42c1'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
              <span style={{marginRight: '0.5rem', fontSize: '1.2rem'}}>🥗</span>
              <h3 style={{color: '#333', margin: 0, fontSize: '1.1rem', fontWeight: '600'}}>Gestión de Ingredientes</h3>
            </div>
            
            {/* Información de ingredientes disponibles */}
            <div style={{marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#e8f4fd', border: '1px solid #bee5eb', borderRadius: '6px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <span style={{color: '#0c5460', fontSize: '0.9rem', fontWeight: '500'}}>
                  📊 <strong>Ingredientes disponibles:</strong> {ingredientesDisponibles.length} ingredientes
                </span>
                {ingredientesDisponibles.length === 0 && (
                  <button 
                    onClick={() => {
                      const ingredientesLocales = getIngredientesLocales();
                      setIngredientesDisponibles(ingredientesLocales);
                      console.log('✅ Ingredientes locales cargados:', ingredientesLocales.length);
                    }}
                    style={{
                      padding: '6px 12px', 
                      fontSize: '0.8rem', 
                      backgroundColor: '#17a2b8', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Cargar Ingredientes
                  </button>
                )}
              </div>
              {ingredientesDisponibles.length > 0 && (
                <div style={{fontSize: '0.8rem', color: '#0c5460', display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <span>
                    ✅ Con datos nutricionales: {ingredientesDisponibles.filter(ing => 
                      (ing.materia_seca > 0 || ing.proteina_bruta > 0 || ing.energia_metabolizable > 0)
                    ).length}
                  </span>
                  <span>
                    ⚠️ Sin datos: {ingredientesDisponibles.filter(ing => 
                      !(ing.materia_seca > 0 || ing.proteina_bruta > 0 || ing.energia_metabolizable > 0)
                    ).length}
                  </span>
                  <button 
                    onClick={() => {
                      console.log('🔍 DEBUG - Ingredientes disponibles:', ingredientesDisponibles);
                      console.table(ingredientesDisponibles.map(ing => ({
                        id: ing.id_ingrediente,
                        nombre: ing.nombre_ingrediente,
                        tipo: ing.tipo,
                        MS: ing.materia_seca,
                        PB: ing.proteina_bruta,
                        EM: ing.energia_metabolizable,
                        Ca: ing.calcio,
                        P: ing.fosforo
                      })));
                    }}
                    style={{
                      padding: '4px 8px', 
                      fontSize: '0.7rem', 
                      backgroundColor: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px', 
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Debug
                  </button>
                </div>
              )}
            </div>
            
            {/* Formulario para agregar ingredientes */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end'}}>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  1. Tipo de Ingrediente: <span style={{color: '#dc3545', fontWeight: 'bold'}}>*</span>
                </label>
                <select
                  value={tipoIngrediente}
                  onChange={(e) => setTipoIngrediente(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">Seleccione primero el tipo de ingrediente</option>
                  <option value="forraje">🌱 Forraje (pastos, henos, ensilajes)</option>
                  <option value="concentrado">🌾 Concentrado (granos, tortas, subproductos)</option>
                  <option value="mineral">⚡ Mineral (sales, suplementos)</option>
                </select>
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  2. Nombre del Ingrediente: <span style={{color: '#dc3545', fontWeight: 'bold'}}>*</span>
                </label>
                <select
                  value={nombreIngrediente}
                  onChange={(e) => setNombreIngrediente(e.target.value)}
                  disabled={loading || !tipoIngrediente}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#333'
                  }}
                >
                  <option value="">
                    {loading ? '⏳ Cargando ingredientes...' : 
                     !tipoIngrediente ? 'Seleccione primero el tipo' : 
                     'Ingredientes disponibles del tipo seleccionado'}
                  </option>
                  {ingredientesDisponibles
                    .filter(ing => ing.tipo?.toLowerCase() === tipoIngrediente.toLowerCase())
                    .map(ing => (
                      <option key={ing.id_ingrediente} value={ing.id_ingrediente}>
                        {ing.nombre_ingrediente || ing.nombre}
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label style={{display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem', fontWeight: '500'}}>
                  3. Cantidad (kg): <span style={{color: '#dc3545', fontWeight: 'bold'}}>*</span>
                </label>
                <input
                  type="number"
                  value={cantidadIngrediente}
                  onChange={(e) => setCantidadIngrediente(e.target.value)}
                  step="0.1"
                  min="0"
                  placeholder="Cantidad en kilogramos (puede usar decimales)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff'
                  }}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={agregarIngrediente}
                  disabled={!nombreIngrediente || !cantidadIngrediente || calculating}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: !nombreIngrediente || !cantidadIngrediente || calculating ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: !nombreIngrediente || !cantidadIngrediente || calculating ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  ➕ Agregar Ingrediente
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de ingredientes seleccionados - Diseño mejorado */}
          <div className="ingredientes-table-container" style={{marginTop: '2rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem'}}>
              <span style={{fontSize: '1.2rem'}}>🥗</span>
              <h3 style={{margin: 0, color: '#2d5016'}}>Ingredientes Seleccionados</h3>
            </div>
            
            <div style={{overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem'}}>
                <thead>
                  <tr style={{backgroundColor: '#4a7c59', color: 'white'}}>
                    <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: '600'}}>Tipo</th>
                    <th style={{padding: '12px 8px', textAlign: 'left', fontWeight: '600'}}>Nombre</th>
                    <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: '600'}}>Cantidad (kg)</th>
                    <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: '600'}}>Estado Nutricional</th>
                    <th style={{padding: '12px 8px', textAlign: 'center', fontWeight: '600'}}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientesSeleccionados.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
                        No hay ingredientes seleccionados
                      </td>
                    </tr>
                  ) : (
                    ingredientesSeleccionados.map((ing, index) => {
                      const cantidad = parseFloat(ing.cantidad || 0);
                      const tieneValoresNutricionales = (ing.ms_pct > 0 || ing.pb_pct > 0 || ing.em_mcal > 0);
                      
                      return (
                        <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                          <td style={{padding: '12px 8px', textAlign: 'center'}}>
                            <span style={{
                              backgroundColor: ing.tipo === 'forraje' ? '#28a745' : ing.tipo === 'concentrado' ? '#ffc107' : '#6c757d',
                              color: ing.tipo === 'concentrado' ? '#000' : '#fff',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {ing.tipo}
                            </span>
                          </td>
                          <td style={{padding: '12px 8px'}}>
                            <strong style={{color: '#2d5016'}}>{ing.nombre}</strong>
                            <div style={{fontSize: '0.8rem', color: '#666', marginTop: '2px'}}>
                              ({(parseFloat(ing.ms_pct) || 0).toFixed(1)}% MS)
                            </div>
                          </td>
                          <td style={{padding: '12px 8px', textAlign: 'center'}}>
                            <input
                              type="number"
                              value={cantidad}
                              onChange={(e) => handleCantidadChange(index, e.target.value)}
                              style={{
                                width: '80px',
                                padding: '4px 8px',
                                border: recalculando ? '2px solid #2196f3' : '1px solid #ddd',
                                borderRadius: '4px',
                                textAlign: 'center',
                                backgroundColor: recalculando ? '#f3f9ff' : 'white'
                              }}
                              step="0.1"
                              min="0"
                            />
                            <div style={{fontSize: '0.75rem', color: '#666', marginTop: '2px'}}>kg</div>
                          </td>
                          <td style={{padding: '12px 8px', textAlign: 'center'}}>
                            {tieneValoresNutricionales ? (
                              <span style={{
                                backgroundColor: '#d4edda',
                                color: '#155724',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                ✅ Datos completos
                              </span>
                            ) : (
                              <span style={{
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                ⚠️ Sin datos
                              </span>
                            )}
                          </td>
                          <td style={{padding: '12px 8px', textAlign: 'center'}}>
                            <button
                              onClick={() => eliminarIngrediente(index)}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {ingredientesSeleccionados.length > 0 && (
                  <tfoot>
                    <tr style={{backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #4a7c59'}}>
                      <td colSpan="2" style={{padding: '12px 8px', color: '#2d5016'}}>
                        TOTAL Forrajes + Concentrados (kg)
                      </td>
                      <td style={{padding: '12px 8px', textAlign: 'center', color: '#2d5016', fontSize: '1rem'}}>
                        {ingredientesSeleccionados
                          .reduce((total, ing) => total + parseFloat(ing.cantidad || 0), 0)
                          .toFixed(2)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Indicador de progreso */}
          {calculating && (
            <div className="calculating-indicator" style={{textAlign: 'center', margin: '20px 0'}}>
              <span>🔄</span>
              <span>Calculando balance nutricional...</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="action-buttons" style={{textAlign: 'center', margin: '30px 0'}}>
            <button
              type="button"
              onClick={() => {
                if (animalData.peso && animalData.produccion_leche) {
                  const requerimientosCalculados = calcularRequerimientosBasicos(
                    animalData.peso,
                    animalData.produccion_leche,
                    animalData.grasa_leche
                  );
                  setRequerimientos(requerimientosCalculados);
                  setApiError(null);
                } else {
                  setApiError('Complete el peso y la producción de leche para calcular requerimientos');
                }
              }}
              className="submit-btn"
              disabled={calculating || !animalData.peso || !animalData.produccion_leche}
              style={{margin: '10px', backgroundColor: '#17a2b8'}}
            >
              📊 Calcular Requerimientos
            </button>
            <PermissionGuard 
              module="raciones" 
              action="create"
              fallback={
                <div className="apprentice-alert" style={{margin: '10px 0', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px', color: '#856404'}}>
                  ℹ️ Los usuarios aprendices pueden ver los cálculos pero no crear nuevas raciones
                </div>
              }
            >
              <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
                <button
                  type="button"
                  onClick={balancearRacion}
                  className="submit-btn"
                  disabled={ingredientesSeleccionados.length === 0 || calculating || !animalData.peso || !animalData.produccion_leche}
                  style={{margin: '10px'}}
                >
                  {calculating ? '🔄 Calculando...' : '🧮 Balancear Ración'}
                </button>
                
                <button
                  type="button"
                  onClick={balanceoAutomaticoHandler}
                  className="submit-btn"
                  disabled={ingredientesSeleccionados.length === 0 || calculating || !animalData.peso || !animalData.produccion_leche || !requerimientos}
                  style={{
                    margin: '10px',
                    backgroundColor: '#ff9800',
                    borderColor: '#ff9800'
                  }}
                >
                  {calculating ? '🔄 Balanceando...' : '⚖️ Balanceo Automático'}
                </button>
                
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffb74d',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#e65100',
                  fontWeight: '500'
                }}>
                  💡 El balanceo automático ajusta las cantidades para lograr 85-100% de suficiencia
                </div>
                
                {recalculando && (
                  <div style={{
                    padding: '6px 10px',
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: '15px',
                    fontSize: '0.75rem',
                    color: '#1976d2',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <div className="spinner" style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #e3f2fd',
                      borderTop: '2px solid #1976d2',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Recalculando...
                  </div>
                )}
              </div>
            </PermissionGuard>
            <button
              type="button"
              onClick={limpiarTodo}
              className="submit-btn"
              disabled={calculating}
              style={{margin: '10px', backgroundColor: '#6c757d'}}
            >
              🧪 Nueva Ración
            </button>
          </div>
        </section>


        {/* Sección 5: Requerimientos de Mantenimiento NRC */}
        {animalData.peso && !requerimientosMantenimiento && (
          <section className="raciones-form" data-aos="fade-up">
            <div className="result-card" style={{padding: '1.5rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '10px', borderLeft: '4px solid #ffc107'}}>
              <div className="result-header">
                <span className="result-icon">⏳</span>
                <h3 style={{color: '#856404', margin: 0}}>Cargando Requerimientos de Mantenimiento</h3>
              </div>
              <p style={{margin: '0.5rem 0 0 0', color: '#856404'}}>
                Procesando datos para peso: {animalData.peso} kg...
              </p>
            </div>
          </section>
        )}
        
        {requerimientosMantenimiento && (
          <section className="raciones-form" data-aos="fade-up">
            <div className="result-card" style={{padding: '1.5rem', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '10px', borderLeft: '4px solid #ffc107'}}>
              <div className="result-header">
                <span className="result-icon">🧮</span>
                <h3 style={{color: '#00324C', margin: 0}}>Requerimientos de Mantenimiento NRC</h3>
              </div>
              <p style={{margin: '0.5rem 0 1rem 0', color: '#666', fontStyle: 'italic'}}>
                Datos automáticos basados en el peso del animal ({animalData.peso} kg)
              </p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem'}}>
                <div style={{padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#1976d2', fontWeight: '600'}}>MS/Kg</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#0d47a1'}}>
                    {requerimientosMantenimiento.materia_seca_kg.toFixed(1)}
                  </div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>kg/día</div>
                </div>
                
                <div style={{padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#388e3c', fontWeight: '600'}}>PB/Gr</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#1b5e20'}}>
                    {requerimientosMantenimiento.proteina_total_g.toFixed(0)}
                  </div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>gramos</div>
                </div>
                
                <div style={{padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#f57c00', fontWeight: '600'}}>EM/MCAL</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#e65100'}}>
                    {requerimientosMantenimiento.energia_metabolizable_mcal.toFixed(2)}
                  </div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>Mcal</div>
                </div>
                
                <div style={{padding: '1rem', backgroundColor: '#fce4ec', borderRadius: '8px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#c2185b', fontWeight: '600'}}>Calcio gr</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#880e4f'}}>
                    {requerimientosMantenimiento.calcio_g.toFixed(0)}
                  </div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>gramos</div>
                </div>
                
                <div style={{padding: '1rem', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#7b1fa2', fontWeight: '600'}}>Fósforo/gr</div>
                  <div style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#4a148c'}}>
                    {requerimientosMantenimiento.fosforo_g.toFixed(1)}
                  </div>
                  <div style={{fontSize: '0.8rem', color: '#666'}}>gramos</div>
                </div>
              </div>
              
              <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '8px'}}>
                <h4 style={{margin: '0 0 0.5rem 0', color: '#00324C', fontSize: '1rem'}}>📊 Detalles Adicionales</h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.5rem', fontSize: '0.9rem'}}>
                  <div><strong>Proteína Digestible:</strong> {requerimientosMantenimiento.proteina_digestible_g.toFixed(0)} g</div>
                  <div><strong>Energía Neta:</strong> {requerimientosMantenimiento.energia_neta_mcal.toFixed(2)} Mcal</div>
                  <div><strong>Energía Digestible:</strong> {requerimientosMantenimiento.energia_digestible_mcal.toFixed(2)} Mcal</div>
                  <div><strong>Peso Base:</strong> {requerimientosMantenimiento.peso_kg.toFixed(0)} kg</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sección 6: Resultado de Cumplimiento Nutricional */}
        {balanceRacion && (
          <section className="raciones-form" data-aos="fade-up">
            <div className="result-card" style={{padding: '1.5rem', backgroundColor: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '10px', borderLeft: '4px solid #4caf50'}}>
              <div className="result-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span className="result-icon">✅</span>
                  <h3 style={{color: '#2e7d32', margin: 0}}>Resultado de Cumplimiento Nutricional</h3>
                </div>
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  color: '#1976d2',
                  fontWeight: '600'
                }}>
                  📊 Rango RACIONES6: 85-100%
                </div>
              </div>
              <div style={{marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
                <div style={{flex: 1, minWidth: '120px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#666'}}>MS:</div>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: getEstadoSuficiencia(balanceRacion.suficiencia?.ms || 0).color}}>
                    {balanceRacion.suficiencia?.ms?.toFixed(1) || '-'}%
                  </div>
                  <div style={{fontSize: '0.8rem', color: getEstadoSuficiencia(balanceRacion.suficiencia?.ms || 0).color}}>
                    {getEstadoSuficiencia(balanceRacion.suficiencia?.ms || 0).texto}
                  </div>
                </div>
                <div style={{flex: 1, minWidth: '120px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#666'}}>PB:</div>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: getEstadoSuficiencia(balanceRacion.suficiencia?.pb || 0).color}}>
                    {balanceRacion.suficiencia?.pb?.toFixed(1) || '-'}%
                  </div>
                  <div style={{fontSize: '0.8rem', color: getEstadoSuficiencia(balanceRacion.suficiencia?.pb || 0).color}}>
                    {getEstadoSuficiencia(balanceRacion.suficiencia?.pb || 0).texto}
                  </div>
                </div>
                <div style={{flex: 1, minWidth: '120px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#666'}}>EM:</div>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: getEstadoSuficiencia(balanceRacion.suficiencia?.em || 0).color}}>
                    {balanceRacion.suficiencia?.em?.toFixed(1) || '-'}%
                  </div>
                  <div style={{fontSize: '0.8rem', color: getEstadoSuficiencia(balanceRacion.suficiencia?.em || 0).color}}>
                    {getEstadoSuficiencia(balanceRacion.suficiencia?.em || 0).texto}
                  </div>
                </div>
                <div style={{flex: 1, minWidth: '120px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#666'}}>Ca:</div>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: getEstadoSuficiencia(balanceRacion.suficiencia?.ca || 0).color}}>
                    {balanceRacion.suficiencia?.ca?.toFixed(1) || '-'}%
                  </div>
                  <div style={{fontSize: '0.8rem', color: getEstadoSuficiencia(balanceRacion.suficiencia?.ca || 0).color}}>
                    {getEstadoSuficiencia(balanceRacion.suficiencia?.ca || 0).texto}
                  </div>
                </div>
                <div style={{flex: 1, minWidth: '120px', textAlign: 'center'}}>
                  <div style={{fontSize: '0.9rem', color: '#666'}}>P:</div>
                  <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: getEstadoSuficiencia(balanceRacion.suficiencia?.p || 0).color}}>
                    {balanceRacion.suficiencia?.p?.toFixed(1) || '-'}%
                  </div>
                  <div style={{fontSize: '0.8rem', color: getEstadoSuficiencia(balanceRacion.suficiencia?.p || 0).color}}>
                    {getEstadoSuficiencia(balanceRacion.suficiencia?.p || 0).texto}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Sección 7: Balance Nutricional */}
        {aporteRacion && balanceRacion && (
          <section className="raciones-form" data-aos="fade-up">
            <div className="result-card" style={{padding: '1.5rem', backgroundColor: '#fff3e0', border: '1px solid #ff9800', borderRadius: '10px', borderLeft: '4px solid #ff9800'}}>
              <div className="result-header">
                <span className="result-icon">⚖️</span>
                <h3 style={{color: '#e65100', margin: 0}}>Balance Nutricional</h3>
              </div>
              <div style={{marginTop: '1rem'}}>
                <button
                  type="button"
                  onClick={() => setShowCalculoDetalle(!showCalculoDetalle)}
                  className="submit-btn"
                  style={{backgroundColor: '#17a2b8', marginBottom: '15px'}}
                >
                  📊 {showCalculoDetalle ? 'Ocultar' : 'Ver'} Detalle del Cálculo
                </button>
                
                {showCalculoDetalle && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{color: '#007bff', marginBottom: '15px'}}>
                      📊 Resumen del Balance Nutricional
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '15px'
                    }}>
                      <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #dee2e6'
                      }}>
                        <strong>Total Ingredientes:</strong><br/>
                        <span style={{fontSize: '1.2em', color: '#28a745'}}>
                          {ingredientesSeleccionados.reduce((total, ing) => total + parseFloat(ing.cantidad || 0), 0).toFixed(2)}
                        </span> kg
                      </div>
                      
                      <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #dee2e6'
                      }}>
                        <strong>Materia Seca Total:</strong><br/>
                        <span style={{fontSize: '1.2em', color: '#17a2b8'}}>
                          {aporteRacion.ms_total?.toFixed(2) || '0.00'}
                        </span> kg
                      </div>
                      
                      <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #dee2e6'
                      }}>
                        <strong>Proteína Bruta Total:</strong><br/>
                        <span style={{fontSize: '1.2em', color: '#fd7e14'}}>
                          {aporteRacion.pb_total?.toFixed(0) || '0'}
                        </span> g
                      </div>
                      
                      <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        border: '1px solid #dee2e6'
                      }}>
                        <strong>Energía Metabolizable:</strong><br/>
                        <span style={{fontSize: '1.2em', color: '#6f42c1'}}>
                          {aporteRacion.em_total?.toFixed(2) || '0.00'}
                        </span> Mcal
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Sección 8: Tablas de Resultados Detalladas */}
        {requerimientos && (
          <section className="raciones-results" data-aos="fade-up">
            
            {/* Detalle del Cálculo */}
            <div className="calculation-detail" style={{display: 'none'}}>
              <button
                type="button"
                onClick={() => setShowCalculoDetalle(!showCalculoDetalle)}
                className="submit-btn"
                style={{marginBottom: '15px', backgroundColor: '#17a2b8'}}
              >
                📊 {showCalculoDetalle ? 'Ocultar' : 'Ver'} Detalle del Cálculo
              </button>

              {showCalculoDetalle && aporteRacion && (
                <div className="calculo-detalle" style={{
                  margin: '20px 0',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderLeft: '4px solid #007bff',
                  borderRadius: '5px'
                }}>
                  <h4 style={{color: '#007bff', marginBottom: '15px'}}>
                    📊 Detalle del Cálculo - APORTE RACIÓN
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div className="grid-item" style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #dee2e6'
                    }}>
                      <strong>Total Ingredientes:</strong><br/>
                      <span style={{fontSize: '1.2em', color: '#28a745'}}>
                        {ingredientesSeleccionados.reduce((total, ing) => total + parseFloat(ing.cantidad || 0), 0).toFixed(2)}
                      </span> kg
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #dee2e6'
                    }}>
                      <strong>Materia Seca Total:</strong><br/>
                      <span style={{fontSize: '1.2em', color: '#17a2b8'}}>
                        {aporteRacion.ms_total?.toFixed(2) || '0.00'}
                      </span> kg
                    </div>
                    
                    <div style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '5px',
                      border: '1px solid #dee2e6'
                    }}>
                      <strong>Proteína Bruta Total:</strong><br/>
                      <span style={{fontSize: '1.2em', color: '#fd7e14'}}>
                        {aporteRacion.pb_total?.toFixed(0) || '0'}
                      </span> g
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 📊 TABLA 1: REQUERIMIENTOS DE LA VACA */}
            <div className="table-section">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 className="table-title">🐄 REQUERIMIENTOS DE LA VACA</h3>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  {requerimientosMantenimiento && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #4caf50',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      color: '#2e7d32',
                      fontWeight: '600'
                    }}>
                      ✅ Mantenimiento NRC
                    </div>
                  )}
                  {requerimientosPorGrasa && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #2196f3',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      color: '#1976d2',
                      fontWeight: '600'
                    }}>
                      ✅ Grasa {animalData.grasa_leche}%
                    </div>
                  )}
                </div>
              </div>
              <table id="tablaRequerimientos" className="requirements-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>MS/Kg</th>
                    <th>PB/Gr</th>
                    <th>EM/MCAL</th>
                    <th>Calcio gr</th>
                    <th>Fosforo/gr</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{backgroundColor: requerimientosMantenimiento ? '#f0f8f0' : 'transparent'}}>
                    <td>
                      Mantenimiento
                      {requerimientosMantenimiento && (
                        <div style={{fontSize: '0.7rem', color: '#4caf50', fontWeight: '500'}}>
                          📊 Tabla NRC
                        </div>
                      )}
                    </td>
                    <td id="maintMS">{requerimientos.mantenimiento?.ms?.toFixed(2) || '-'}</td>
                    <td id="maintPB">{requerimientos.mantenimiento?.pb?.toFixed(0) || '-'}</td>
                    <td id="maintEM">{requerimientos.mantenimiento?.em?.toFixed(2) || '-'}</td>
                    <td id="maintCa">{requerimientos.mantenimiento?.ca?.toFixed(2) || '-'}</td>
                    <td id="maintP">{requerimientos.mantenimiento?.p?.toFixed(2) || '-'}</td>
                  </tr>
                  <tr style={{backgroundColor: requerimientosPorGrasa ? '#f0f8ff' : 'transparent'}}>
                    <td>
                      REQUER/kg leche
                      {requerimientosPorGrasa && (
                        <div style={{fontSize: '0.7rem', color: '#2196f3', fontWeight: '500'}}>
                          📊 Grasa {animalData.grasa_leche}%
                        </div>
                      )}
                    </td>
                    <td id="reqPerLecheMS">{requerimientos.por_kg_leche?.ms?.toFixed(3) || '-'}</td>
                    <td id="reqPerLechePB">{requerimientos.por_kg_leche?.pb?.toFixed(1) || '-'}</td>
                    <td id="reqPerLecheEM">{requerimientos.por_kg_leche?.em?.toFixed(3) || '-'}</td>
                    <td id="reqPerLecheCa">{requerimientos.por_kg_leche?.ca?.toFixed(2) || '-'}</td>
                    <td id="reqPerLecheP">{requerimientos.por_kg_leche?.p?.toFixed(2) || '-'}</td>
                  </tr>
                  <tr>
                    <td>Reque Total Pro</td>
                    <td id="reqTotalProMS">{requerimientos.produccion?.ms?.toFixed(2) || '-'}</td>
                    <td id="reqTotalProPB">{requerimientos.produccion?.pb?.toFixed(0) || '-'}</td>
                    <td id="reqTotalProEM">{requerimientos.produccion?.em?.toFixed(2) || '-'}</td>
                    <td id="reqTotalProCa">{requerimientos.produccion?.ca?.toFixed(2) || '-'}</td>
                    <td id="reqTotalProP">{requerimientos.produccion?.p?.toFixed(2) || '-'}</td>
                  </tr>
                  <tr className="total-row">
                    <td><strong>Total R</strong></td>
                    <td id="reqTotalMS"><strong>{requerimientos.total?.ms?.toFixed(2) || '-'}</strong></td>
                    <td id="reqTotalPB"><strong>{requerimientos.total?.pb?.toFixed(0) || '-'}</strong></td>
                    <td id="reqTotalEM"><strong>{requerimientos.total?.em?.toFixed(2) || '-'}</strong></td>
                    <td id="reqTotalCa"><strong>{requerimientos.total?.ca?.toFixed(2) || '-'}</strong></td>
                    <td id="reqTotalP"><strong>{requerimientos.total?.p?.toFixed(2) || '-'}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 🥗 TABLA 2: APORTE RACION */}
            {aporteRacion && (
              <div className="table-section">
                <h3 className="table-title">🥗 APORTE RACION</h3>
                <table id="tablaAporte" className="contribution-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Kg</th>
                      <th>% Ms</th>
                      <th>Aporte Total</th>
                      <th>% PB</th>
                      <th>Aporte T/Gr</th>
                      <th>EM/Mcal</th>
                      <th>Aporte Total</th>
                      <th>Calcio %</th>
                      <th>Aporte/T</th>
                      <th>Fosforo %</th>
                      <th>Aporte/T</th>
                    </tr>
                  </thead>
                  <tbody id="aporteBody">
                    {aporteRacion.ingredientes?.map((ing, index) => (
                      <tr key={index}>
                        <td>{ing.nombre}</td>
                        <td>{ing.cantidad?.toFixed(2)}</td>
                        <td>{ing.ms_pct?.toFixed(1)}</td>
                        <td>{ing.ms_aporte?.toFixed(2)}</td>
                        <td>{ing.pb_pct?.toFixed(1)}</td>
                        <td>{ing.pb_aporte?.toFixed(0)}</td>
                        <td>{ing.em_mcal?.toFixed(2)}</td>
                        <td>{ing.em_aporte?.toFixed(2)}</td>
                        <td>{ing.ca_pct?.toFixed(2)}</td>
                        <td>{ing.ca_aporte?.toFixed(2)}</td>
                        <td>{ing.p_pct?.toFixed(2)}</td>
                        <td>{ing.p_aporte?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td><strong>APORTE RACION</strong><br/><small>(Suma total de ingredientes)</small></td>
                      <td>-</td>
                      <td>-</td>
                      <td><span id="apMS"><strong>{aporteRacion.ms_total?.toFixed(2)}</strong></span><br/><small>MS total</small></td>
                      <td>-</td>
                      <td><span id="apPB"><strong>{aporteRacion.pb_total?.toFixed(0)}</strong></span><br/><small>PB total</small></td>
                      <td>-</td>
                      <td><span id="apEM"><strong>{aporteRacion.em_total?.toFixed(2)}</strong></span><br/><small>EM total</small></td>
                      <td>-</td>
                      <td><span id="apCa"><strong>{aporteRacion.ca_total?.toFixed(2)}</strong></span><br/><small>Ca total</small></td>
                      <td>-</td>
                      <td><span id="apP"><strong>{aporteRacion.p_total?.toFixed(2)}</strong></span><br/><small>P total</small></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ⚖️ TABLA 3: BALANCE RACIÓN */}
            {balanceRacion && (
              <div className="table-section">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <h3 className="table-title" style={{color: '#2e7d32', margin: 0}}>⚖️ BALANCE RACIÓN</h3>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e8f5e9',
                    border: '1px solid #4caf50',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    color: '#2e7d32',
                    fontWeight: '600'
                  }}>
                    📊 Lógica RACIONES6: 85-100% = Óptimo
                  </div>
                </div>
                <table id="tablaBalance" className="balance-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: 'bold'}}></th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>MS/Kg</th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>PB/Gr</th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>EM/MCAL</th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>Calcio gr</th>
                      <th style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>Fósforo/gr</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="aporte-row" style={{backgroundColor: '#e8f5e9', borderBottom: '1px solid #ddd'}}>
                      <td style={{padding: '12px', fontWeight: 'bold', color: '#2e7d32'}}>APORTE RACIÓN</td>
                      <td id="balanceAporteMS" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.aporte?.ms?.toFixed(2) || '-'}
                      </td>
                      <td id="balanceAportePB" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.aporte?.pb?.toFixed(0) || '-'}
                      </td>
                      <td id="balanceAporteEM" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.aporte?.em?.toFixed(3) || '-'}
                      </td>
                      <td id="balanceAporteCa" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.aporte?.ca?.toFixed(1) || '-'}
                      </td>
                      <td id="balanceAporteP" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.aporte?.p?.toFixed(1) || '-'}
                      </td>
                    </tr>
                    <tr className="requirement-row" style={{backgroundColor: '#fff3e0', borderBottom: '1px solid #ddd'}}>
                      <td style={{padding: '12px', fontWeight: 'bold', color: '#e65100'}}>TOTAL R</td>
                      <td id="totalRMS" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.requerimiento?.ms?.toFixed(1) || '-'}
                      </td>
                      <td id="totalRPB" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.requerimiento?.pb?.toFixed(0) || '-'}
                      </td>
                      <td id="totalREM" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.requerimiento?.em?.toFixed(2) || '-'}
                      </td>
                      <td id="totalRCa" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.requerimiento?.ca?.toFixed(1) || '-'}
                      </td>
                      <td id="totalRP" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold'}}>
                        {balanceRacion.requerimiento?.p?.toFixed(1) || '-'}
                      </td>
                    </tr>
                    <tr className="ratio-row" style={{backgroundColor: '#f3e5f5', borderBottom: '1px solid #ddd'}}>
                      <td style={{padding: '12px', fontWeight: 'bold', color: '#7b1fa2'}}>CUMPLIMIENTO</td>
                      <td id="balanceRatioMS" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#7b1fa2'}}>
                        {((balanceRacion.aporte?.ms || 0) - (balanceRacion.requerimiento?.ms || 0)) >= 0 ? '+' : ''}
                        {((balanceRacion.aporte?.ms || 0) - (balanceRacion.requerimiento?.ms || 0)).toFixed(1)}
                      </td>
                      <td id="balanceRatioPB" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#7b1fa2'}}>
                        {((balanceRacion.aporte?.pb || 0) - (balanceRacion.requerimiento?.pb || 0)) >= 0 ? '+' : ''}
                        {((balanceRacion.aporte?.pb || 0) - (balanceRacion.requerimiento?.pb || 0)).toFixed(0)}
                      </td>
                      <td id="balanceRatioEM" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#7b1fa2'}}>
                        {((balanceRacion.aporte?.em || 0) - (balanceRacion.requerimiento?.em || 0)) >= 0 ? '+' : ''}
                        {((balanceRacion.aporte?.em || 0) - (balanceRacion.requerimiento?.em || 0)).toFixed(3)}
                      </td>
                      <td id="balanceRatioCa" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#7b1fa2'}}>
                        {((balanceRacion.aporte?.ca || 0) - (balanceRacion.requerimiento?.ca || 0)) >= 0 ? '+' : ''}
                        {((balanceRacion.aporte?.ca || 0) - (balanceRacion.requerimiento?.ca || 0)).toFixed(1)}
                      </td>
                      <td id="balanceRatioP" style={{padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#7b1fa2'}}>
                        {((balanceRacion.aporte?.p || 0) - (balanceRacion.requerimiento?.p || 0)) >= 0 ? '+' : ''}
                        {((balanceRacion.aporte?.p || 0) - (balanceRacion.requerimiento?.p || 0)).toFixed(1)}
                      </td>
                    </tr>
                    <tr style={{backgroundColor: '#e3f2fd', borderBottom: '2px solid #2196f3'}}>
                      <td style={{padding: '12px', fontWeight: 'bold', color: '#1976d2'}}>Tasa suficiencia %</td>
                      <td id="sufMS" style={{
                        padding: '12px',
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: getEstadoSuficiencia(balanceRacion.suficiencia?.ms || 0).color
                      }}>
                        {(balanceRacion.suficiencia?.ms || 0).toFixed(1)}%
                      </td>
                      <td id="sufPB" style={{
                        padding: '12px',
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: getEstadoSuficiencia(balanceRacion.suficiencia?.pb || 0).color
                      }}>
                        {(balanceRacion.suficiencia?.pb || 0).toFixed(1)}%
                      </td>
                      <td id="sufEM" style={{
                        padding: '12px',
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: getEstadoSuficiencia(balanceRacion.suficiencia?.em || 0).color
                      }}>
                        {(balanceRacion.suficiencia?.em || 0).toFixed(1)}%
                      </td>
                      <td id="sufCa" style={{
                        padding: '12px',
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: getEstadoSuficiencia(balanceRacion.suficiencia?.ca || 0).color
                      }}>
                        {(balanceRacion.suficiencia?.ca || 0).toFixed(1)}%
                      </td>
                      <td id="sufP" style={{
                        padding: '12px',
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        color: getEstadoSuficiencia(balanceRacion.suficiencia?.p || 0).color
                      }}>
                        {(balanceRacion.suficiencia?.p || 0).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Recomendaciones */}
            {recomendaciones.length > 0 && (
              <div className="recomendaciones-box" style={{
                margin: '20px 0',
                background: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <h3 style={{margin: '0 0 8px 0', fontSize: '18px'}}>
                  Recomendaciones de ajuste
                </h3>
                <ul style={{margin: '0', paddingLeft: '18px'}}>
                  {recomendaciones.map((rec, index) => (
                    <li key={index} dangerouslySetInnerHTML={{__html: rec}} />
                  ))}
                </ul>
              </div>
            )}

            {/* Botones de acción para resultados */}
            <div className="results-actions" style={{textAlign: 'center', margin: '20px 0'}}>
              <button
                type="button"
                onClick={exportarPDF}
                className="btn-blue"
                style={{margin: '10px'}}
              >
                📄 Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => setShowCalculoDetalle(!showCalculoDetalle)}
                className="submit-btn"
                style={{margin: '10px', backgroundColor: '#6c757d'}}
              >
                {showCalculoDetalle ? '📊 Ocultar Detalle' : '📊 Ver Detalle'}
              </button>
            </div>
          </section>
        )}
      </div>
      {/* Navegación */}
      <div className="raciones-nav" data-aos="fade-up">
        <Link to="/alimentacion/racion" className="nav-link">
          Volver a Ración Animal
        </Link>
        <Link to="/alimentacion/racion-ceba" className="nav-link">
          Raciones Ceba
        </Link>
      </div>
    </div>
  );
};

export default RacionesLactancia;