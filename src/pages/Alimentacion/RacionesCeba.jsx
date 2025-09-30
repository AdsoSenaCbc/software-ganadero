import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionesCeba.css';
import { 
  FaWeight, 
  FaChartLine, 
  FaClock, 
  FaCalculator, 
  FaRocket, 
  FaCalendarAlt, 
  FaChartBar, 
  FaTable
} from 'react-icons/fa';
import { GiCow, GiBull } from 'react-icons/gi';
import { apiUrl, authHeader } from '../../api/api';
import { usePermissions } from '../../hooks/usePermissions';
import PermissionGuard from '../../components/PermissionGuard';

const RacionesCeba = () => {
  // Hook de permisos
  const { permissions, loading: permissionsLoading } = usePermissions();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Estados para datos del animal
  const [animalesCeba, setAnimalesCeba] = useState([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [animalData, setAnimalData] = useState({
    peso_inicial: '',
    peso_objetivo: '',
    gdp_objetivo: '', // Ganancia Diaria de Peso objetivo
    dias_ceba: '',
    etapa_actual: 'iniciacion'
  });
  
  // Estados para resultados
  const [requerimientosCeba, setRequerimientosCeba] = useState(null);
  const [proyeccionCeba, setProyeccionCeba] = useState(null);
  const [etapasDesarrollo, setEtapasDesarrollo] = useState([]);
  
  
  // Definición de etapas de desarrollo del novillo
  const ETAPAS_CEBA = {
    iniciacion: {
      nombre: 'Iniciación',
      peso_min: 250,
      peso_max: 350,
      gdp_promedio: 0.8,
      descripcion: 'Etapa inicial de adaptación y crecimiento'
    },
    media_ceba: {
      nombre: 'Media Ceba',
      peso_min: 350,
      peso_max: 450,
      gdp_promedio: 1.0,
      descripcion: 'Etapa de crecimiento acelerado'
    },
    finalizacion: {
      nombre: 'Finalización',
      peso_min: 450,
      peso_max: 600,
      gdp_promedio: 0.7,
      descripcion: 'Etapa final de engorde y acabado'
    }
  };

  // Función para determinar etapa actual según peso
  const determinarEtapaActual = (peso) => {
    if (peso >= 250 && peso < 350) return 'iniciacion';
    if (peso >= 350 && peso < 450) return 'media_ceba';
    if (peso >= 450 && peso <= 600) return 'finalizacion';
    return 'iniciacion'; // Por defecto
  };

  // Cargar animales de ceba al montar el componente
  useEffect(() => {
    AOS.init({ duration: 800 });
    cargarAnimalesCeba();
  }, []);

  const cargarAnimalesCeba = async () => {
    try {
      console.log('Cargando animales machos de ceba...');
      const response = await fetch(apiUrl('/api/animals/ceba'), {
        headers: authHeader()
      });
      
      if (response.ok) {
        const animalesCeba = await response.json();
        setAnimalesCeba(animalesCeba);
        console.log('Animales machos de ceba cargados:', animalesCeba.length);
        
        // Log detallado de los animales cargados
        if (animalesCeba.length > 0) {
          console.log('Primer animal de ejemplo:', animalesCeba[0]);
        } else {
          console.warn('No se encontraron animales machos de ceba en la base de datos');
          setApiError('No hay animales machos registrados en etapa de ceba');
        }
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        setApiError(errorData.error || 'Error al cargar la lista de animales de ceba');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setApiError('Error de conexión al cargar animales de ceba');
    }
  };

  // Manejar selección de animal
  const handleAnimalChange = (e) => {
    const animalId = e.target.value;
    if (animalId) {
      const animal = animalesCeba.find(a => a.id === parseInt(animalId));
      setAnimalSeleccionado(animal);
      
      // Auto-completar datos si están disponibles
      if (animal) {
        const pesoActual = animal.peso || '';
        const etapaActual = determinarEtapaActual(pesoActual);
        
        setAnimalData(prev => ({
          ...prev,
          peso_inicial: pesoActual,
          etapa_actual: etapaActual
        }));
      }
    } else {
      setAnimalSeleccionado(null);
      setAnimalData({
        peso_inicial: '',
        peso_objetivo: '',
        gdp_objetivo: '',
        dias_ceba: '',
        etapa_actual: 'iniciacion'
      });
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnimalData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-determinar etapa si cambia el peso inicial
      if (name === 'peso_inicial' && value) {
        newData.etapa_actual = determinarEtapaActual(parseFloat(value));
      }
      
      return newData;
    });
  };

  // Función avanzada de cálculo de GDP
  const calcularGDPAvanzado = () => {
    const pesoInicial = parseFloat(animalData.peso_inicial);
    const pesoObjetivo = parseFloat(animalData.peso_objetivo);
    const diasCeba = parseInt(animalData.dias_ceba);
    const gdpObjetivo = parseFloat(animalData.gdp_objetivo);
    
    const resultados = {
      gdp_calculada: null,
      dias_necesarios: null,
      peso_proyectado: null,
      eficiencia_ceba: null,
      ganancia_total: null,
      peso_por_dia: null,
      meses_estimados: null,
      factibilidad: null,
      recomendaciones: []
    };

    // Cálculo de GDP si tenemos peso inicial, objetivo y días
    if (pesoInicial && pesoObjetivo && diasCeba) {
      resultados.gdp_calculada = (pesoObjetivo - pesoInicial) / diasCeba;
      resultados.ganancia_total = pesoObjetivo - pesoInicial;
      resultados.peso_por_dia = resultados.gdp_calculada;
    }

    // Cálculo de días necesarios si tenemos GDP objetivo
    if (pesoInicial && pesoObjetivo && gdpObjetivo) {
      resultados.dias_necesarios = Math.ceil((pesoObjetivo - pesoInicial) / gdpObjetivo);
      resultados.meses_estimados = (resultados.dias_necesarios / 30).toFixed(1);
      resultados.ganancia_total = pesoObjetivo - pesoInicial;
    }

    // Proyección de peso si tenemos GDP y días
    if (pesoInicial && gdpObjetivo && diasCeba) {
      resultados.peso_proyectado = pesoInicial + (gdpObjetivo * diasCeba);
    }

    // Evaluación de eficiencia de ceba
    if (resultados.gdp_calculada) {
      const etapaActual = animalData.etapa_actual;
      const gdpPromedio = ETAPAS_CEBA[etapaActual]?.gdp_promedio || 0.8;
      
      resultados.eficiencia_ceba = (resultados.gdp_calculada / gdpPromedio) * 100;
      
      // Evaluación de factibilidad
      if (resultados.gdp_calculada < 0.5) {
        resultados.factibilidad = 'Baja';
        resultados.recomendaciones.push('GDP muy baja, revisar alimentación');
      } else if (resultados.gdp_calculada >= 0.5 && resultados.gdp_calculada <= 1.2) {
        resultados.factibilidad = 'Óptima';
        resultados.recomendaciones.push('GDP en rango óptimo para ceba');
      } else if (resultados.gdp_calculada > 1.2 && resultados.gdp_calculada <= 1.8) {
        resultados.factibilidad = 'Alta';
        resultados.recomendaciones.push('GDP alta, excelente para ceba intensiva');
      } else {
        resultados.factibilidad = 'Muy Alta';
        resultados.recomendaciones.push('GDP muy alta, verificar sostenibilidad');
      }

      // Recomendaciones por etapa
      if (etapaActual === 'iniciacion' && resultados.gdp_calculada < 0.7) {
        resultados.recomendaciones.push('Aumentar concentrado en etapa de iniciación');
      } else if (etapaActual === 'media_ceba' && resultados.gdp_calculada < 0.9) {
        resultados.recomendaciones.push('Optimizar ración para media ceba');
      } else if (etapaActual === 'finalizacion' && resultados.gdp_calculada < 0.6) {
        resultados.recomendaciones.push('Ajustar alimentación para finalización');
      }

      // Recomendaciones por peso
      if (pesoInicial < 300 && resultados.gdp_calculada > 1.0) {
        resultados.recomendaciones.push('GDP alta para peso bajo, monitorear salud');
      } else if (pesoInicial > 500 && resultados.gdp_calculada < 0.7) {
        resultados.recomendaciones.push('GDP baja para peso alto, revisar estrategia');
      }
    }

    return resultados;
  };

  // Función para calcular costo por kg de ganancia
  const calcularCostoPorKg = (costoAlimentacionDiario) => {
    const resultados = calcularGDPAvanzado();
    if (resultados.gdp_calculada && costoAlimentacionDiario) {
      return (costoAlimentacionDiario / resultados.gdp_calculada).toFixed(2);
    }
    return null;
  };

  // Función para proyectar peso en fechas específicas
  const proyectarPesoEnFecha = (diasFuturos) => {
    const pesoInicial = parseFloat(animalData.peso_inicial);
    const gdpObjetivo = parseFloat(animalData.gdp_objetivo);
    
    if (pesoInicial && gdpObjetivo && diasFuturos) {
      return pesoInicial + (gdpObjetivo * diasFuturos);
    }
    return null;
  };

  // Función para calcular tiempo óptimo de ceba
  const calcularTiempoOptimo = () => {
    const pesoInicial = parseFloat(animalData.peso_inicial);
    const etapaActual = animalData.etapa_actual;
    
    if (!pesoInicial || !etapaActual) return null;

    const etapaInfo = ETAPAS_CEBA[etapaActual];
    const pesoObjetivoEtapa = etapaInfo.peso_max;
    const gdpPromedio = etapaInfo.gdp_promedio;
    
    const diasOptimos = Math.ceil((pesoObjetivoEtapa - pesoInicial) / gdpPromedio);
    const mesesOptimos = (diasOptimos / 30).toFixed(1);
    
    return {
      dias: diasOptimos,
      meses: mesesOptimos,
      peso_objetivo: pesoObjetivoEtapa,
      gdp_recomendada: gdpPromedio
    };
  };

  // ===== FASE 3: LÓGICA AVANZADA DE ETAPAS DE DESARROLLO =====

  // Función para detectar transición automática de etapa
  const detectarTransicionEtapa = (pesoActual) => {
    const peso = parseFloat(pesoActual);
    if (!peso) return null;

    let etapaSugerida = null;
    let razonTransicion = '';
    let proximaEtapa = null;
    let progreso = 0;

    // Determinar etapa actual basada en peso
    if (peso >= 250 && peso < 350) {
      etapaSugerida = 'iniciacion';
      proximaEtapa = 'media_ceba';
      progreso = ((peso - 250) / (350 - 250)) * 100;
      if (peso >= 330) {
        razonTransicion = 'Animal próximo a Media Ceba (330+ kg)';
      }
    } else if (peso >= 350 && peso < 450) {
      etapaSugerida = 'media_ceba';
      proximaEtapa = 'finalizacion';
      progreso = ((peso - 350) / (450 - 350)) * 100;
      if (peso >= 430) {
        razonTransicion = 'Animal próximo a Finalización (430+ kg)';
      }
    } else if (peso >= 450) {
      etapaSugerida = 'finalizacion';
      proximaEtapa = null;
      progreso = Math.min(((peso - 450) / (550 - 450)) * 100, 100);
      if (peso >= 520) {
        razonTransicion = 'Animal listo para sacrificio (520+ kg)';
      }
    } else {
      etapaSugerida = 'iniciacion';
      razonTransicion = 'Peso muy bajo para ceba estándar';
    }

    return {
      etapa_sugerida: etapaSugerida,
      etapa_actual: animalData.etapa_actual,
      requiere_cambio: etapaSugerida !== animalData.etapa_actual,
      razon_transicion: razonTransicion,
      proxima_etapa: proximaEtapa,
      progreso_etapa: Math.round(progreso),
      peso_actual: peso
    };
  };

  // Función para calcular plan completo de desarrollo
  const calcularPlanDesarrollo = () => {
    const pesoInicial = parseFloat(animalData.peso_inicial);
    const gdpObjetivo = parseFloat(animalData.gdp_objetivo) || 0.9;
    
    if (!pesoInicial) return null;

    const plan = [];
    let pesoActual = pesoInicial;
    let diasAcumulados = 0;

    // Recorrer todas las etapas desde la actual
    const etapasOrden = ['iniciacion', 'media_ceba', 'finalizacion'];
    const etapaInicialIndex = etapasOrden.indexOf(animalData.etapa_actual);
    
    for (let i = etapaInicialIndex; i < etapasOrden.length; i++) {
      const etapaKey = etapasOrden[i];
      const etapaInfo = ETAPAS_CEBA[etapaKey];
      
      // Calcular peso objetivo para esta etapa
      const pesoObjetivo = Math.min(etapaInfo.peso_max, 
        i === etapasOrden.length - 1 ? 550 : etapaInfo.peso_max);
      
      if (pesoActual >= pesoObjetivo) {
        continue; // Ya superó esta etapa
      }

      // Calcular días necesarios para completar la etapa
      const gananciaRequerida = pesoObjetivo - pesoActual;
      const gdpEtapa = etapaInfo.gdp_promedio;
      const diasEtapa = Math.ceil(gananciaRequerida / gdpEtapa);
      
      diasAcumulados += diasEtapa;

      plan.push({
        etapa: etapaKey,
        nombre: etapaInfo.nombre,
        peso_inicial: pesoActual,
        peso_final: pesoObjetivo,
        ganancia: gananciaRequerida,
        dias_estimados: diasEtapa,
        dias_acumulados: diasAcumulados,
        meses_acumulados: (diasAcumulados / 30).toFixed(1),
        gdp_recomendada: gdpEtapa,
        descripcion: etapaInfo.descripcion
      });

      pesoActual = pesoObjetivo;
    }

    return plan;
  };

  // Función para optimizar transición entre etapas
  const optimizarTransicion = (etapaActual, etapaSiguiente) => {
    const etapaActualInfo = ETAPAS_CEBA[etapaActual];
    const etapaSiguienteInfo = ETAPAS_CEBA[etapaSiguiente];
    
    if (!etapaActualInfo || !etapaSiguienteInfo) return null;

    const recomendaciones = [];
    const ajustes = [];

    // Recomendaciones específicas por transición
    if (etapaActual === 'iniciacion' && etapaSiguiente === 'media_ceba') {
      recomendaciones.push('Aumentar gradualmente el concentrado');
      recomendaciones.push('Reducir proporción de forraje');
      recomendaciones.push('Monitorear adaptación digestiva');
      ajustes.push({
        parametro: 'Concentrado',
        cambio: '+15%',
        razon: 'Mayor demanda energética'
      });
      ajustes.push({
        parametro: 'Proteína',
        cambio: '+10%',
        razon: 'Crecimiento muscular acelerado'
      });
    } else if (etapaActual === 'media_ceba' && etapaSiguiente === 'finalizacion') {
      recomendaciones.push('Maximizar energía para engorde');
      recomendaciones.push('Optimizar conversión alimenticia');
      recomendaciones.push('Preparar para sacrificio');
      ajustes.push({
        parametro: 'Energía',
        cambio: '+20%',
        razon: 'Deposición de grasa intramuscular'
      });
      ajustes.push({
        parametro: 'Fibra',
        cambio: '-10%',
        razon: 'Mayor digestibilidad'
      });
    }

    return {
      etapa_origen: etapaActual,
      etapa_destino: etapaSiguiente,
      recomendaciones,
      ajustes,
      periodo_transicion: '7-10 días',
      monitoreo_requerido: true
    };
  };

  // Función para evaluar rendimiento por etapa
  const evaluarRendimientoEtapa = () => {
    const resultadosGDP = calcularGDPAvanzado();
    const etapaActual = animalData.etapa_actual;
    const etapaInfo = ETAPAS_CEBA[etapaActual];
    
    if (!resultadosGDP.gdp_calculada || !etapaInfo) return null;

    const gdpEsperada = etapaInfo.gdp_promedio;
    const rendimiento = (resultadosGDP.gdp_calculada / gdpEsperada) * 100;
    
    let evaluacion = '';
    let color = '';
    let acciones = [];

    if (rendimiento >= 110) {
      evaluacion = 'Excelente';
      color = '#059669';
      acciones.push('Mantener estrategia actual');
      acciones.push('Considerar adelantar transición');
    } else if (rendimiento >= 90) {
      evaluacion = 'Bueno';
      color = '#0ea5e9';
      acciones.push('Rendimiento satisfactorio');
      acciones.push('Monitoreo rutinario');
    } else if (rendimiento >= 70) {
      evaluacion = 'Regular';
      color = '#f59e0b';
      acciones.push('Revisar alimentación');
      acciones.push('Evaluar salud animal');
    } else {
      evaluacion = 'Deficiente';
      color = '#dc2626';
      acciones.push('Intervención inmediata');
      acciones.push('Revisión veterinaria');
    }

    return {
      etapa: etapaActual,
      gdp_actual: resultadosGDP.gdp_calculada,
      gdp_esperada: gdpEsperada,
      rendimiento_porcentaje: rendimiento.toFixed(1),
      evaluacion,
      color,
      acciones,
      dias_en_etapa: parseInt(animalData.dias_ceba) || 0
    };
  };

  // Función para generar cronograma de desarrollo
  const generarCronogramaDesarrollo = () => {
    const plan = calcularPlanDesarrollo();
    if (!plan) return null;

    const cronograma = [];
    let fechaInicio = new Date();

    plan.forEach((etapa, index) => {
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + etapa.dias_estimados);

      cronograma.push({
        ...etapa,
        fecha_inicio: fechaInicio.toLocaleDateString(),
        fecha_fin: fechaFin.toLocaleDateString(),
        semana_inicio: Math.ceil((fechaInicio - new Date()) / (7 * 24 * 60 * 60 * 1000)),
        hitos: [
          `Peso inicial: ${etapa.peso_inicial} kg`,
          `Peso objetivo: ${etapa.peso_final} kg`,
          `GDP requerida: ${etapa.gdp_recomendada} kg/día`
        ]
      });

      fechaInicio = new Date(fechaFin);
    });

    return cronograma;
  };


  // ===== FASE 5: TABLA COMPARATIVA DE ETAPAS CON PROYECCIONES =====

  // Función para generar tabla comparativa completa de etapas
  const generarTablaComparativaEtapas = () => {
    if (!animalData.peso_inicial || !animalData.peso_objetivo) return null;

    const pesoInicial = parseFloat(animalData.peso_inicial);
    const pesoObjetivo = parseFloat(animalData.peso_objetivo);
    const gdpObjetivo = parseFloat(animalData.gdp_objetivo) || 1.0;

    // Determinar etapa actual
    let etapaActual = 'iniciacion';
    if (pesoInicial >= 350 && pesoInicial < 450) etapaActual = 'media_ceba';
    else if (pesoInicial >= 450) etapaActual = 'finalizacion';

    const etapasOrdenadas = ['iniciacion', 'media_ceba', 'finalizacion'];
    const etapaActualIndex = etapasOrdenadas.indexOf(etapaActual);
    
    const tablaComparativa = [];
    let pesoAcumulado = pesoInicial;
    let diasAcumulados = 0;

    etapasOrdenadas.forEach((etapaKey, index) => {
      const etapa = ETAPAS_CEBA[etapaKey];
      let pesoInicioEtapa = pesoAcumulado;
      let pesoFinEtapa = Math.min(etapa.peso_max, pesoObjetivo);
      
      // Ajustar pesos según la situación
      if (index < etapaActualIndex) {
        // Etapas ya completadas (teóricamente)
        pesoInicioEtapa = etapa.peso_min;
        pesoFinEtapa = etapa.peso_max;
      } else if (index === etapaActualIndex) {
        // Etapa actual
        pesoInicioEtapa = pesoInicial;
        pesoFinEtapa = Math.min(etapa.peso_max, pesoObjetivo);
      } else {
        // Etapas futuras
        pesoInicioEtapa = pesoAcumulado;
        pesoFinEtapa = Math.min(etapa.peso_max, pesoObjetivo);
      }

      const gananciaEtapa = Math.max(0, pesoFinEtapa - pesoInicioEtapa);
      const gdpEtapa = index === etapaActualIndex ? gdpObjetivo : etapa.gdp_promedio;
      const diasEtapa = gananciaEtapa > 0 ? Math.ceil(gananciaEtapa / gdpEtapa) : 0;
      
      // Calcular eficiencia
      const eficienciaEtapa = (gdpEtapa / etapa.gdp_promedio) * 100;
      
      // Estado de la etapa
      let estadoEtapa = 'pendiente';
      if (index < etapaActualIndex) estadoEtapa = 'completada';
      else if (index === etapaActualIndex) estadoEtapa = 'actual';
      
      // Fechas proyectadas
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() + diasAcumulados);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + diasEtapa);

      tablaComparativa.push({
        etapa: etapa.nombre,
        etapa_key: etapaKey,
        peso_inicio: pesoInicioEtapa,
        peso_fin: pesoFinEtapa,
        ganancia_kg: gananciaEtapa,
        gdp_requerida: gdpEtapa,
        gdp_promedio: etapa.gdp_promedio,
        dias_etapa: diasEtapa,
        dias_acumulados: diasAcumulados + diasEtapa,
        eficiencia: eficienciaEtapa,
        estado: estadoEtapa,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        porcentaje_completado: index <= etapaActualIndex ? 
          (index < etapaActualIndex ? 100 : 
            ((pesoInicial - etapa.peso_min) / (etapa.peso_max - etapa.peso_min)) * 100) : 0
      });

      pesoAcumulado = pesoFinEtapa;
      diasAcumulados += diasEtapa;

      // Si ya alcanzamos el peso objetivo, no continuar
      if (pesoFinEtapa >= pesoObjetivo) return;
    });

    return {
      etapas: tablaComparativa,
      resumen: {
        peso_inicial: pesoInicial,
        peso_objetivo: pesoObjetivo,
        ganancia_total: pesoObjetivo - pesoInicial,
        dias_totales: diasAcumulados,
        meses_totales: (diasAcumulados / 30).toFixed(1),
        gdp_promedio_general: (pesoObjetivo - pesoInicial) / diasAcumulados,
        etapa_actual: etapaActual,
        etapas_completadas: tablaComparativa.filter(e => e.estado === 'completada').length,
        etapas_pendientes: tablaComparativa.filter(e => e.estado === 'pendiente').length
      }
    };
  };

  // Función para generar proyecciones por escenarios
  const generarProyeccionesEscenarios = () => {
    if (!animalData.peso_inicial || !animalData.peso_objetivo) return null;

    const pesoInicial = parseFloat(animalData.peso_inicial);
    const pesoObjetivo = parseFloat(animalData.peso_objetivo);
    const gananciaTotal = pesoObjetivo - pesoInicial;

    const escenarios = [
      {
        nombre: 'Conservador',
        descripcion: 'GDP 20% menor al promedio',
        factor_gdp: 0.8,
        color: '#f59e0b',
        icon: '🐌'
      },
      {
        nombre: 'Realista',
        descripcion: 'GDP según promedio de etapa',
        factor_gdp: 1.0,
        color: '#059669',
        icon: '🎯'
      },
      {
        nombre: 'Optimista',
        descripcion: 'GDP 20% mayor al promedio',
        factor_gdp: 1.2,
        color: '#0ea5e9',
        icon: '🚀'
      },
      {
        nombre: 'Intensivo',
        descripcion: 'GDP 40% mayor al promedio',
        factor_gdp: 1.4,
        color: '#8b5cf6',
        icon: '⚡'
      }
    ];

    const proyecciones = escenarios.map(escenario => {
      let diasTotales = 0;
      let pesoAcumulado = pesoInicial;

      const etapasProyectadas = [];

      Object.keys(ETAPAS_CEBA).forEach(etapaKey => {
        const etapa = ETAPAS_CEBA[etapaKey];
        
        if (pesoAcumulado >= pesoObjetivo) return;

        const pesoInicioEtapa = pesoAcumulado;
        const pesoFinEtapa = Math.min(etapa.peso_max, pesoObjetivo);
        const gananciaEtapa = Math.max(0, pesoFinEtapa - pesoInicioEtapa);
        
        if (gananciaEtapa > 0) {
          const gdpEtapa = etapa.gdp_promedio * escenario.factor_gdp;
          const diasEtapa = Math.ceil(gananciaEtapa / gdpEtapa);

          etapasProyectadas.push({
            etapa: etapa.nombre,
            dias: diasEtapa,
            gdp: gdpEtapa,
            ganancia: gananciaEtapa
          });

          diasTotales += diasEtapa;
          pesoAcumulado = pesoFinEtapa;
        }
      });

      return {
        ...escenario,
        dias_totales: diasTotales,
        meses_totales: (diasTotales / 30).toFixed(1),
        gdp_promedio: gananciaTotal / diasTotales,
        eficiencia_tiempo: (365 / diasTotales) * 100, // Ciclos por año
        etapas: etapasProyectadas,
        fecha_finalizacion: new Date(Date.now() + diasTotales * 24 * 60 * 60 * 1000)
      };
    });

    return {
      escenarios: proyecciones,
      comparacion: {
        diferencia_tiempo_max: Math.max(...proyecciones.map(p => p.dias_totales)) - 
                              Math.min(...proyecciones.map(p => p.dias_totales)),
        mejor_eficiencia: proyecciones.reduce((prev, curr) => 
          prev.eficiencia_tiempo > curr.eficiencia_tiempo ? prev : curr),
        menor_tiempo: proyecciones.reduce((prev, curr) => 
          prev.dias_totales < curr.dias_totales ? prev : curr)
      }
    };
  };


  return (
    <div className="raciones-ceba-container">
      {/* Header */}
      <div className="raciones-header" data-aos="fade-down">
        <h1 className="raciones-title">
          <GiCow className="title-icon" />
          Raciones de Ceba - Optimización de Engorde
        </h1>
        <p className="raciones-subtitle">
          Calcula y optimiza la ganancia de peso diario para maximizar la eficiencia del proceso de ceba
        </p>
      </div>

      {/* Sección 1: Selección y Datos del Animal */}
      <section className="raciones-form" data-aos="fade-up">
        <div className="form-header">
          <h2>
            <FaWeight className="section-icon" />
            Datos del Animal de Ceba
          </h2>
          <p className="form-description">
            Selecciona el animal y define los parámetros de engorde
          </p>
        </div>

        <div className="form-grid">
          {/* Selección de Animal */}
          <div className="form-group full-width">
            <label htmlFor="animal-select">Animal de Ceba</label>
            <select
              id="animal-select"
              value={animalSeleccionado?.id || ''}
              onChange={handleAnimalChange}
              className="form-control"
            >
              <option value="">Seleccionar animal macho de ceba...</option>
              {animalesCeba.map(animal => (
                <option key={animal.id} value={animal.id}>
                  {animal.nombre || animal.identificador_unico || `Animal ${animal.id_animal}`}
                  {animal.peso && ` - ${animal.peso} kg`}
                  {animal.raza && ` (${animal.raza})`}
                  {animal.edad_anos && ` - ${animal.edad_anos} años`}
                  {animal.propietario && ` - ${animal.propietario}`}
                </option>
              ))}
            </select>
            {animalesCeba.length === 0 && (
              <small className="form-help text-muted">
                No hay animales machos registrados en etapa de ceba
              </small>
            )}
            {animalesCeba.length > 0 && (
              <small className="form-help" style={{color: '#059669'}}>
                ✅ {animalesCeba.length} animales machos de ceba disponibles
              </small>
            )}
          </div>

          {/* Peso Inicial */}
          <div className="form-group">
            <label htmlFor="peso-inicial">Peso Inicial (kg)</label>
            <input
              type="number"
              id="peso-inicial"
              name="peso_inicial"
              value={animalData.peso_inicial}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Ej: 300"
              step="0.1"
              min="200"
              max="800"
            />
          </div>

          {/* Peso Objetivo */}
          <div className="form-group">
            <label htmlFor="peso-objetivo">Peso Objetivo (kg)</label>
            <input
              type="number"
              id="peso-objetivo"
              name="peso_objetivo"
              value={animalData.peso_objetivo}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Ej: 500"
              step="0.1"
              min="300"
              max="700"
            />
          </div>

          {/* GDP Objetivo */}
          <div className="form-group">
            <label htmlFor="gdp-objetivo">GDP Objetivo (kg/día)</label>
            <input
              type="number"
              id="gdp-objetivo"
              name="gdp_objetivo"
              value={animalData.gdp_objetivo}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Ej: 1.0"
              step="0.01"
              min="0.3"
              max="2.0"
            />
          </div>

          {/* Días de Ceba */}
          <div className="form-group">
            <label htmlFor="dias-ceba">Días de Ceba</label>
            <input
              type="number"
              id="dias-ceba"
              name="dias_ceba"
              value={animalData.dias_ceba}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Ej: 200"
              min="30"
              max="1000"
            />
          </div>

          {/* Etapa Actual */}
          <div className="form-group">
            <label htmlFor="etapa-actual">Etapa de Desarrollo</label>
            <select
              id="etapa-actual"
              name="etapa_actual"
              value={animalData.etapa_actual}
              onChange={handleInputChange}
              className="form-control"
            >
              {Object.entries(ETAPAS_CEBA).map(([key, etapa]) => (
                <option key={key} value={key}>
                  {etapa.nombre} ({etapa.peso_min}-{etapa.peso_max} kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información del Animal Seleccionado */}
        {animalSeleccionado && (
          <div className="animal-info" data-aos="fade-in">
            <div className="info-card" style={{background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #22c55e'}}>
              <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', marginBottom: '1rem'}}>
                <GiBull className="info-icon" />
                Información del Animal Seleccionado
              </h4>
              
              <div className="animal-details" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div className="detail-item">
                  <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Nombre:</span>
                  <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                    {animalSeleccionado.nombre || animalSeleccionado.identificador_unico || `Animal ${animalSeleccionado.id_animal}`}
                  </span>
                </div>
                
                {animalSeleccionado.identificador_unico && (
                  <div className="detail-item">
                    <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>ID Único:</span>
                    <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                      {animalSeleccionado.identificador_unico}
                    </span>
                  </div>
                )}
                
                <div className="detail-item">
                  <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Peso Actual:</span>
                  <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                    {animalSeleccionado.peso ? `${animalSeleccionado.peso} kg` : 'No registrado'}
                  </span>
                </div>
                
                {animalSeleccionado.raza && (
                  <div className="detail-item">
                    <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Raza:</span>
                    <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                      {animalSeleccionado.raza}
                    </span>
                  </div>
                )}
                
                {animalSeleccionado.edad_anos && (
                  <div className="detail-item">
                    <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Edad:</span>
                    <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                      {animalSeleccionado.edad_anos} años
                      {animalSeleccionado.edad_meses && ` y ${animalSeleccionado.edad_meses} meses`}
                    </span>
                  </div>
                )}
                
                <div className="detail-item">
                  <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Sexo:</span>
                  <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                    {animalSeleccionado.sexo || 'Macho'}
                  </span>
                </div>
                
                {animalSeleccionado.propietario && (
                  <div className="detail-item">
                    <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Propietario:</span>
                    <span className="detail-value" style={{fontWeight: '600', color: '#15803d'}}>
                      {animalSeleccionado.propietario}
                    </span>
                  </div>
                )}
              </div>
              
              {animalSeleccionado.observaciones && (
                <div style={{marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px'}}>
                  <span className="detail-label" style={{fontWeight: '500', color: '#374151'}}>Observaciones:</span>
                  <p style={{margin: '0.25rem 0 0 0', color: '#15803d', fontStyle: 'italic'}}>
                    {animalSeleccionado.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información de la Etapa Actual */}
        {animalData.etapa_actual && (
          <div className="etapa-info" data-aos="fade-in">
            <div className="info-card">
              <h4>
                <FaChartLine className="info-icon" />
                {ETAPAS_CEBA[animalData.etapa_actual].nombre}
              </h4>
              <p>{ETAPAS_CEBA[animalData.etapa_actual].descripcion}</p>
              <div className="etapa-stats">
                <div className="stat">
                  <span className="stat-label">Rango de Peso:</span>
                  <span className="stat-value">
                    {ETAPAS_CEBA[animalData.etapa_actual].peso_min} - {ETAPAS_CEBA[animalData.etapa_actual].peso_max} kg
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">GDP Promedio:</span>
                  <span className="stat-value">
                    {ETAPAS_CEBA[animalData.etapa_actual].gdp_promedio} kg/día
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados Avanzados de GDP */}
        {animalData.peso_inicial && (animalData.peso_objetivo || animalData.gdp_objetivo) && (
          <div className="resultados-gdp-avanzados" data-aos="fade-up">
            <div className="results-header">
              <h3>
                <FaCalculator className="section-icon" />
                Análisis Avanzado de GDP
              </h3>
              <p className="results-description">
                Cálculos detallados de ganancia diaria de peso y proyecciones
              </p>
            </div>

            {(() => {
              const resultados = calcularGDPAvanzado();
              const tiempoOptimo = calcularTiempoOptimo();
              
              // Validar que tenemos datos válidos
              if (!resultados || !resultados.gdp_calculada) {
                return (
                  <div className="gdp-analysis-container">
                    <div className="alert alert-info">
                      <p>Complete los datos del animal para ver el análisis de GDP.</p>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="gdp-analysis-container">
                  {/* Métricas Principales */}
                  <div className="metricas-principales">
                    <div className="metrica-card gdp-principal">
                      <div className="metrica-header">
                        <div className="metrica-icon-container">
                          <FaWeight className="metrica-icon" />
                        </div>
                        <div className="metrica-info">
                          <h4 className="metrica-title">GDP Calculada</h4>
                          <p className="metrica-subtitle">Ganancia Diaria de Peso</p>
                        </div>
                      </div>
                      <div className="metrica-valor-principal">
                        {(resultados.gdp_calculada || 0).toFixed(3)}
                        <span className="metrica-unidad">kg/día</span>
                      </div>
                      <div className="metrica-detalles">
                        <div className="detalle-item">
                          <span className="detalle-label">Ganancia Total</span>
                          <span className="detalle-valor">{(resultados.ganancia_total || 0).toFixed(1)} kg</span>
                        </div>
                        <div className="detalle-item">
                          <span className="detalle-label">Eficiencia</span>
                          <span className={`detalle-valor badge ${(resultados.eficiencia_ceba || 0) >= 100 ? 'success' : (resultados.eficiencia_ceba || 0) >= 80 ? 'warning' : 'danger'}`}>
                            {(resultados.eficiencia_ceba || 0).toFixed(1)}%
                          </span>
                        </div>
                        <div className="detalle-item">
                          <span className="detalle-label">Factibilidad</span>
                          <span className={`detalle-valor badge factibilidad-${(resultados.factibilidad || 'baja').toLowerCase().replace(' ', '-')}`}>
                            {resultados.factibilidad || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="metrica-card tiempo-principal">
                      <div className="metrica-header">
                        <div className="metrica-icon-container">
                          <FaClock className="metrica-icon" />
                        </div>
                        <div className="metrica-info">
                          <h4 className="metrica-title">Tiempo Estimado</h4>
                          <p className="metrica-subtitle">Duración del proceso</p>
                        </div>
                      </div>
                      <div className="metrica-valor-principal">
                        {resultados.dias_necesarios || 0}
                        <span className="metrica-unidad">días</span>
                      </div>
                      <div className="metrica-conversion">
                        <div className="conversion-item">
                          <span className="conversion-valor">{resultados.meses_estimados || 0}</span>
                          <span className="conversion-label">meses</span>
                        </div>
                        <div className="conversion-separator">•</div>
                        <div className="conversion-item">
                          <span className="conversion-valor">{Math.ceil((resultados.dias_necesarios || 0) / 7)}</span>
                          <span className="conversion-label">semanas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas Secundarias */}
                  <div className="metricas-secundarias">
                    <div className="metrica-card-small peso-proyectado">
                      <div className="metrica-header-small">
                        <FaChartLine className="metrica-icon-small" />
                        <h5>Peso Proyectado</h5>
                      </div>
                      <div className="metrica-valor-small">
                        {(resultados.peso_proyectado || 0).toFixed(1)} kg
                      </div>
                      <div className="metrica-comparacion">
                        <span className="comparacion-inicial">Inicial: {animalData.peso_inicial || 0} kg</span>
                        <span className="comparacion-ganancia">
                          +{((resultados.peso_proyectado || 0) - parseFloat(animalData.peso_inicial || 0)).toFixed(1)} kg
                        </span>
                      </div>
                    </div>

                    {tiempoOptimo && (
                      <div className="metrica-card-small tiempo-optimo">
                        <div className="metrica-header-small">
                          <GiBull className="metrica-icon-small" />
                          <h5>Tiempo Óptimo</h5>
                        </div>
                        <div className="metrica-valor-small">
                          {tiempoOptimo.meses || 0} meses
                        </div>
                        <div className="metrica-detalles-small">
                          <div className="detalle-small">
                            <span>Días Óptimos: {tiempoOptimo.dias || 0}</span>
                          </div>
                          <div className="detalle-small">
                            <span>GDP Rec: {tiempoOptimo.gdp_recomendada || 0} kg/día</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="metrica-card-small resumen-proceso">
                      <div className="metrica-header-small">
                        <FaCalculator className="metrica-icon-small" />
                        <h5>Resumen del Proceso</h5>
                      </div>
                      <div className="resumen-items">
                        <div className="resumen-item">
                          <span className="resumen-label">Peso Objetivo:</span>
                          <span className="resumen-valor">{animalData.peso_objetivo || tiempoOptimo?.peso_objetivo || 0} kg</span>
                        </div>
                        <div className="resumen-item">
                          <span className="resumen-label">GDP Objetivo:</span>
                          <span className="resumen-valor">{animalData.gdp_objetivo || (resultados.gdp_calculada || 0).toFixed(2)} kg/día</span>
                        </div>
                        <div className="resumen-item">
                          <span className="resumen-label">Rendimiento:</span>
                          <span className={`resumen-valor badge ${(resultados.eficiencia_ceba || 0) >= 100 ? 'success' : 'warning'}`}>
                            {(resultados.eficiencia_ceba || 0) >= 100 ? 'Excelente' : (resultados.eficiencia_ceba || 0) >= 80 ? 'Bueno' : 'Regular'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Recomendaciones */}
            {(() => {
              const resultados = calcularGDPAvanzado();
              if (resultados.recomendaciones.length > 0) {
                return (
                  <div className="recomendaciones-gdp" data-aos="fade-in">
                    <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '1rem'}}>
                      <FaChartLine className="section-icon" />
                      Recomendaciones Técnicas
                    </h4>
                    <div className="recomendaciones-list">
                      {resultados.recomendaciones.map((recomendacion, index) => (
                        <div key={index} className="recomendacion-item">
                          <span className="recomendacion-bullet">💡</span>
                          <span className="recomendacion-text">{recomendacion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Proyecciones de Peso */}
        {animalData.peso_inicial && animalData.gdp_objetivo && (
          <div className="proyecciones-peso" data-aos="fade-up">
            <div className="proyecciones-header">
              <h3>
                <FaChartLine className="section-icon" />
                Proyecciones de Peso
              </h3>
              <p className="proyecciones-description">
                Estimación de peso en diferentes períodos de tiempo
              </p>
            </div>

            <div className="proyecciones-grid">
              {[30, 60, 90, 120, 180].map(dias => {
                const pesoProyectado = proyectarPesoEnFecha(dias);
                if (pesoProyectado) {
                  return (
                    <div key={dias} className="proyeccion-item">
                      <div className="proyeccion-periodo">
                        {dias} días
                        <small>({(dias/30).toFixed(1)} meses)</small>
                      </div>
                      <div className="proyeccion-peso">
                        {pesoProyectado.toFixed(1)} kg
                      </div>
                      <div className="proyeccion-ganancia">
                        +{(pesoProyectado - parseFloat(animalData.peso_inicial)).toFixed(1)} kg
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* FASE 3: ANÁLISIS DE ETAPAS DE DESARROLLO */}
        {animalData.peso_inicial && (
          <div className="etapas-desarrollo-avanzado" data-aos="fade-up">
            <div className="etapas-header">
              <h3>
                <FaRocket className="section-icon" />
                Análisis de Etapas de Desarrollo
              </h3>
              <p className="etapas-description">
                Gestión inteligente de transiciones y optimización por etapa
              </p>
            </div>

            {/* Detección de Transición */}
            {(() => {
              const transicion = detectarTransicionEtapa(animalData.peso_inicial);
              if (transicion) {
                return (
                  <div className="transicion-etapa" data-aos="fade-in">
                    <div className="transicion-card" style={{
                      background: transicion.requiere_cambio ? 
                        'linear-gradient(135deg, #fef3c7, #fde68a)' : 
                        'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                      border: `1px solid ${transicion.requiere_cambio ? '#f59e0b' : '#22c55e'}`
                    }}>
                      <div className="transicion-header">
                        <h4 style={{
                          color: transicion.requiere_cambio ? '#92400e' : '#15803d',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {transicion.requiere_cambio ? '⚠️' : '✅'} Estado de Etapa
                        </h4>
                      </div>

                      <div className="transicion-info">
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-label">Etapa Actual:</span>
                            <span className="info-value">
                              {ETAPAS_CEBA[transicion.etapa_actual].nombre}
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <span className="info-label">Etapa Sugerida:</span>
                            <span className="info-value" style={{
                              color: transicion.requiere_cambio ? '#dc2626' : '#059669'
                            }}>
                              {ETAPAS_CEBA[transicion.etapa_sugerida].nombre}
                            </span>
                          </div>

                          <div className="info-item">
                            <span className="info-label">Progreso:</span>
                            <div className="progreso-container">
                              <div className="progreso-bar">
                                <div 
                                  className="progreso-fill" 
                                  style={{
                                    width: `${transicion.progreso_etapa}%`,
                                    background: transicion.progreso_etapa >= 80 ? '#f59e0b' : '#22c55e'
                                  }}
                                ></div>
                              </div>
                              <span className="progreso-text">{transicion.progreso_etapa}%</span>
                            </div>
                          </div>

                          {transicion.proxima_etapa && (
                            <div className="info-item">
                              <span className="info-label">Próxima Etapa:</span>
                              <span className="info-value">
                                {ETAPAS_CEBA[transicion.proxima_etapa].nombre}
                              </span>
                            </div>
                          )}
                        </div>

                        {transicion.razon_transicion && (
                          <div className="transicion-alerta">
                            <span className="alerta-icon">💡</span>
                            <span className="alerta-texto">{transicion.razon_transicion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Plan de Desarrollo Completo */}
            {(() => {
              const plan = calcularPlanDesarrollo();
              if (plan && plan.length > 0) {
                return (
                  <div className="plan-desarrollo" data-aos="fade-in">
                    <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '1rem'}}>
                      <FaCalendarAlt className="section-icon" />
                      Plan Completo de Desarrollo
                    </h4>
                    
                    <div className="plan-grid">
                      {plan.map((etapa, index) => (
                        <div key={etapa.etapa} className="plan-etapa-card">
                          <div className="plan-etapa-header">
                            <h5>{etapa.nombre}</h5>
                            <span className="etapa-numero">Etapa {index + 1}</span>
                          </div>
                          
                          <div className="plan-etapa-content">
                            <div className="plan-metric">
                              <span className="metric-label">Peso:</span>
                              <span className="metric-value">
                                {etapa.peso_inicial} → {etapa.peso_final} kg
                              </span>
                            </div>
                            
                            <div className="plan-metric">
                              <span className="metric-label">Ganancia:</span>
                              <span className="metric-value">+{etapa.ganancia.toFixed(1)} kg</span>
                            </div>
                            
                            <div className="plan-metric">
                              <span className="metric-label">Duración:</span>
                              <span className="metric-value">
                                {etapa.dias_estimados} días ({etapa.meses_acumulados} meses acum.)
                              </span>
                            </div>
                            
                            <div className="plan-metric">
                              <span className="metric-label">GDP Requerida:</span>
                              <span className="metric-value">{etapa.gdp_recomendada} kg/día</span>
                            </div>
                            
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="plan-resumen">
                      <div className="resumen-item">
                        <span className="resumen-label">Tiempo Total:</span>
                        <span className="resumen-value">
                          {plan[plan.length - 1].dias_acumulados} días 
                          ({plan[plan.length - 1].meses_acumulados} meses)
                        </span>
                      </div>
                      <div className="resumen-item">
                        <span className="resumen-label">Ganancia Total:</span>
                        <span className="resumen-value">
                          +{plan.reduce((acc, etapa) => acc + etapa.ganancia, 0).toFixed(1)} kg
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Evaluación de Rendimiento */}
            {(() => {
              const rendimiento = evaluarRendimientoEtapa();
              if (rendimiento) {
                return (
                  <div className="rendimiento-etapa" data-aos="fade-in">
                    <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '1rem'}}>
                      <FaChartBar className="section-icon" />
                      Evaluación de Rendimiento Actual
                    </h4>
                    
                    <div className="rendimiento-card">
                      <div className="rendimiento-header">
                        <div className="rendimiento-etapa-info">
                          <h5>{ETAPAS_CEBA[rendimiento.etapa].nombre}</h5>
                          <span className="dias-etapa">{rendimiento.dias_en_etapa} días en etapa</span>
                        </div>
                        <div className="rendimiento-evaluacion" style={{color: rendimiento.color}}>
                          {rendimiento.evaluacion}
                        </div>
                      </div>
                      
                      <div className="rendimiento-metricas">
                        <div className="metrica-item">
                          <span className="metrica-label">GDP Actual:</span>
                          <span className="metrica-valor">{rendimiento.gdp_actual.toFixed(3)} kg/día</span>
                        </div>
                        <div className="metrica-item">
                          <span className="metrica-label">GDP Esperada:</span>
                          <span className="metrica-valor">{rendimiento.gdp_esperada} kg/día</span>
                        </div>
                        <div className="metrica-item">
                          <span className="metrica-label">Rendimiento:</span>
                          <span className="metrica-valor" style={{color: rendimiento.color}}>
                            {rendimiento.rendimiento_porcentaje}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="rendimiento-acciones">
                        <h6>Acciones Recomendadas:</h6>
                        <ul>
                          {rendimiento.acciones.map((accion, index) => (
                            <li key={index}>{accion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}


        {/* FASE 5: TABLA COMPARATIVA DE ETAPAS CON PROYECCIONES */}
        {animalData.peso_inicial && animalData.peso_objetivo && (
          <div className="tabla-comparativa-etapas" data-aos="fade-up">
            <div className="comparativa-header">
              <h3>
                <FaTable className="section-icon" />
                Tabla Comparativa de Etapas de Desarrollo
              </h3>
              <p className="comparativa-description">
                Análisis detallado de cada etapa con proyecciones de tiempo y eficiencia
              </p>
            </div>

            {/* Tabla principal de comparación */}
            {(() => {
              const tablaComparativa = generarTablaComparativaEtapas();
              if (tablaComparativa) {
                return (
                  <div className="tabla-principal-comparativa" data-aos="fade-in">
                    {/* Resumen ejecutivo */}
                    <div className="resumen-ejecutivo">
                      <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '1rem'}}>
                        <FaChartBar className="section-icon" />
                        Resumen Ejecutivo del Plan
                      </h4>
                      
                      <div className="resumen-grid">
                        <div className="resumen-card">
                          <div className="resumen-label">Ganancia Total</div>
                          <div className="resumen-value">{tablaComparativa.resumen.ganancia_total.toFixed(1)} kg</div>
                        </div>
                        <div className="resumen-card">
                          <div className="resumen-label">Tiempo Total</div>
                          <div className="resumen-value">{tablaComparativa.resumen.meses_totales} meses</div>
                        </div>
                        <div className="resumen-card">
                          <div className="resumen-label">GDP Promedio</div>
                          <div className="resumen-value">{tablaComparativa.resumen.gdp_promedio_general.toFixed(2)} kg/día</div>
                        </div>
                      </div>
                    </div>

                    {/* Tabla detallada */}
                    <div className="tabla-detallada-container">
                      <table className="tabla-comparativa">
                        <thead>
                          <tr>
                            <th>Etapa</th>
                            <th>Estado</th>
                            <th>Peso Inicial</th>
                            <th>Peso Final</th>
                            <th>Ganancia</th>
                            <th>GDP Requerida</th>
                            <th>Días</th>
                            <th>Eficiencia</th>
                            <th>Fecha Fin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tablaComparativa.etapas.map((etapa, index) => (
                            <tr key={index} className={`etapa-row etapa-${etapa.estado}`}>
                              <td className="etapa-nombre">
                                <div className="etapa-info">
                                  <span className="nombre">{etapa.etapa}</span>
                                  {etapa.estado === 'actual' && <span className="badge-actual">Actual</span>}
                                </div>
                              </td>
                              <td className="etapa-estado">
                                <span className={`estado-badge estado-${etapa.estado}`}>
                                  {etapa.estado === 'completada' && '✅ Completada'}
                                  {etapa.estado === 'actual' && '🔄 En Progreso'}
                                  {etapa.estado === 'pendiente' && '⏳ Pendiente'}
                                </span>
                              </td>
                              <td className="peso-inicial">{etapa.peso_inicio.toFixed(1)} kg</td>
                              <td className="peso-final">{etapa.peso_fin.toFixed(1)} kg</td>
                              <td className="ganancia">
                                <span className="ganancia-valor">{etapa.ganancia_kg.toFixed(1)} kg</span>
                              </td>
                              <td className="gdp-requerida">
                                <span className="gdp-valor">{etapa.gdp_requerida.toFixed(2)} kg/día</span>
                                <small className="gdp-promedio">
                                  (Prom: {etapa.gdp_promedio.toFixed(2)})
                                </small>
                              </td>
                              <td className="dias-etapa">
                                <span className="dias-valor">{etapa.dias_etapa} días</span>
                                <small className="dias-acumulados">
                                  (Total: {etapa.dias_acumulados})
                                </small>
                              </td>
                              <td className="eficiencia-etapa">
                                <span className={`eficiencia-valor ${etapa.eficiencia >= 100 ? 'alta' : etapa.eficiencia >= 80 ? 'media' : 'baja'}`}>
                                  {etapa.eficiencia.toFixed(0)}%
                                </span>
                              </td>
                              <td className="fecha-fin">
                                {etapa.fecha_fin.toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Proyecciones por escenarios */}
            {(() => {
              const proyecciones = generarProyeccionesEscenarios();
              if (proyecciones) {
                return (
                  <div className="proyecciones-escenarios" data-aos="fade-in">
                    <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', marginBottom: '1rem'}}>
                      <FaRocket className="section-icon" />
                      Proyecciones por Escenarios
                    </h4>
                    
                    <div className="escenarios-grid">
                      {proyecciones.escenarios.map((escenario, index) => (
                        <div key={index} className="escenario-card" style={{borderLeftColor: escenario.color}}>
                          <div className="escenario-header">
                            <div className="escenario-titulo">
                              <span className="escenario-icon">{escenario.icon}</span>
                              <span className="escenario-nombre">{escenario.nombre}</span>
                            </div>
                            <div className="escenario-descripcion">{escenario.descripcion}</div>
                          </div>
                          
                          <div className="escenario-metricas">
                            <div className="metrica-principal">
                              <span className="metrica-label">Tiempo Total</span>
                              <span className="metrica-valor" style={{color: escenario.color}}>
                                {escenario.meses_totales} meses
                              </span>
                            </div>
                            
                            <div className="metricas-secundarias">
                              <div className="metrica-item">
                                <span className="metrica-label">GDP Promedio:</span>
                                <span className="metrica-valor">{escenario.gdp_promedio.toFixed(2)} kg/día</span>
                              </div>
                              <div className="metrica-item">
                                <span className="metrica-label">Eficiencia:</span>
                                <span className="metrica-valor">{escenario.eficiencia_tiempo.toFixed(0)}%</span>
                              </div>
                              <div className="metrica-item">
                                <span className="metrica-label">Finalización:</span>
                                <span className="metrica-valor">
                                  {escenario.fecha_finalizacion.toLocaleDateString('es-ES', {
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comparación de escenarios */}
                    <div className="comparacion-escenarios">
                      <h5>📊 Análisis Comparativo</h5>
                      <div className="comparacion-grid">
                        <div className="comparacion-item">
                          <span className="comparacion-label">Diferencia máxima de tiempo:</span>
                          <span className="comparacion-valor">
                            {Math.ceil(proyecciones.comparacion.diferencia_tiempo_max / 30)} meses
                          </span>
                        </div>
                        <div className="comparacion-item">
                          <span className="comparacion-label">Mejor eficiencia:</span>
                          <span className="comparacion-valor">
                            {proyecciones.comparacion.mejor_eficiencia.nombre} 
                            ({proyecciones.comparacion.mejor_eficiencia.eficiencia_tiempo.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="comparacion-item">
                          <span className="comparacion-label">Menor tiempo:</span>
                          <span className="comparacion-valor">
                            {proyecciones.comparacion.menor_tiempo.nombre} 
                            ({proyecciones.comparacion.menor_tiempo.meses_totales} meses)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          </div>
        )}

        {/* Cálculos Básicos */}
        {animalData.peso_inicial && animalData.peso_objetivo && (
          <div className="calculos-basicos" data-aos="fade-up">
            <h3>
              <FaClock className="section-icon" />
              Cálculos Preliminares
            </h3>
            
            <div className="calculos-grid">
              {animalData.dias_ceba && (
                <div className="calculo-card">
                  <div className="calculo-label">GDP Calculada</div>
                  <div className="calculo-valor">
                    {(() => {
                      const resultados = calcularGDPAvanzado();
                      return resultados.gdp_calculada ? resultados.gdp_calculada.toFixed(3) : '0.000';
                    })()} kg/día
                  </div>
                </div>
              )}
              
              {animalData.gdp_objetivo && (
                <div className="calculo-card">
                  <div className="calculo-label">Días Necesarios</div>
                  <div className="calculo-valor">
                    {(() => {
                      const resultados = calcularGDPAvanzado();
                      return resultados.dias_necesarios || '0';
                    })()} días
                  </div>
                </div>
              )}
              
              <div className="calculo-card">
                <div className="calculo-label">Ganancia Total</div>
                <div className="calculo-valor">
                  {(parseFloat(animalData.peso_objetivo) - parseFloat(animalData.peso_inicial)).toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="form-actions">
          <PermissionGuard 
            module="raciones" 
            action="create"
            fallback={
              <div className="apprentice-alert">
                ℹ️ Los usuarios aprendices pueden ver los cálculos pero no crear nuevas raciones
              </div>
            }
          >
            <button
              type="button"
              className="btn-primary"
              disabled={!animalData.peso_inicial || !animalData.peso_objetivo || calculating}
              onClick={() => console.log('Próxima fase: Cálculo de requerimientos')}
            >
              {calculating ? '🔄 Calculando...' : '📊 Calcular Requerimientos'}
            </button>
          </PermissionGuard>
          
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setAnimalSeleccionado(null);
              setAnimalData({
                peso_inicial: '',
                peso_objetivo: '',
                gdp_objetivo: '',
                dias_ceba: '',
                etapa_actual: 'iniciacion'
              });
              setRequerimientosCeba(null);
              setProyeccionCeba(null);
            }}
          >
            🧹 Limpiar
          </button>
        </div>
      </section>

      {/* Mensajes de Error */}
      {apiError && (
        <div className="error-message" data-aos="fade-in">
          <span className="error-icon">⚠️</span>
          {apiError}
        </div>
      )}

      {/* Navegación */}
      <div className="raciones-nav" data-aos="fade-up">
        <Link to="/alimentacion/racion" className="nav-link">
          <GiCow /> Volver a Raciones
        </Link>
        <Link to="/alimentacion/racion-lactancia" className="nav-link">
          🥛 Raciones Lactancia
        </Link>
      </div>
    </div>
  );
};

export default RacionesCeba;