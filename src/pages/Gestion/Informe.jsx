import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import axiosInstance from '../../api/axiosConfig';
import './Informe.css';

// Registrar los elementos necesarios para Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Informe = () => {
  // Estado de filtros y UI
  const [tipoInforme, setTipoInforme] = useState('haciendas');
  const [mostrarGrafico, setMostrarGrafico] = useState(true);
  const [selectedHacienda, setSelectedHacienda] = useState(''); // '' = todas
  // Filtros específicos por gráfico
  const [fHdaSearch, setFHdaSearch] = useState(''); // Haciendas: buscar por nombre
  const [fHdaMinCount, setFHdaMinCount] = useState(''); // Haciendas: mínimo animales
  const [fAniPesoMin, setFAniPesoMin] = useState(''); // Animales: peso mínimo
  const [fAniPesoMax, setFAniPesoMax] = useState(''); // Animales: peso máximo
  const [fRacHacienda, setFRacHacienda] = useState(''); // Raciones: por hacienda
  const [fRacMinMs, setFRacMinMs] = useState(''); // Raciones: MS mínima
  const [fCompCats, setFCompCats] = useState({ Forrajes: true, Concentrados: true, 'Sales Minerales': true });

  // Estado de datos
  const [haciendas, setHaciendas] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [raciones, setRaciones] = useState([]);
  const [consultasBroma, setConsultasBroma] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [consultasIngredientes, setConsultasIngredientes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Índices de ayuda
  const animalById = useMemo(() => {
    const map = new Map();
    (animales || []).forEach((a) => map.set(a.id, a));
    return map;
  }, [animales]);

  const haciendaById = useMemo(() => {
    const map = new Map();
    (haciendas || []).forEach((h) => map.set(h.id_hacienda, h));
    return map;
  }, [haciendas]);

  // Cargar datos desde el backend
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar datos de forma individual para mejor manejo de errores
      let haciendasData = [];
      let animalesData = [];
      let racionesData = [];
      let consultasBromaData = [];
      let ingredientesData = [];
      let consultasIngredientesData = [];

      // Cargar haciendas
      try {
        const resH = await axiosInstance.get('/api/haciendas/');
        haciendasData = Array.isArray(resH.data) ? resH.data : [];
        console.log('[Informe] Haciendas cargadas:', haciendasData.length);
      } catch (err) {
        console.warn('[Informe] Error cargando haciendas:', err.message);
        // Datos de ejemplo para haciendas
        haciendasData = [
          { id_hacienda: 1, nombre: 'Hacienda El Paraíso', propietario: 'Juan Pérez' },
          { id_hacienda: 2, nombre: 'Finca La Esperanza', propietario: 'María García' }
        ];
      }

      // Cargar animales
      try {
        const resA = await axiosInstance.get('/api/animals/');
        animalesData = Array.isArray(resA.data) ? resA.data : [];
        console.log('[Informe] Animales cargados:', animalesData.length);
      } catch (err) {
        console.warn('[Informe] Error cargando animales:', err.message);
        // Datos de ejemplo para animales
        animalesData = [
          { id: 1, id_animal: 1, identificador_unico: 'VACA-001', nombre: 'Lola', id_hacienda: 1, peso: 450 },
          { id: 2, id_animal: 2, identificador_unico: 'VACA-002', nombre: 'Bella', id_hacienda: 1, peso: 520 },
          { id: 3, id_animal: 3, identificador_unico: 'TORO-001', nombre: 'Zeus', id_hacienda: 2, peso: 680 }
        ];
      }

      // Cargar raciones
      try {
        const resR = await axiosInstance.get('/api/raciones/api');
        racionesData = Array.isArray(resR.data) ? resR.data : [];
        console.log('[Informe] Raciones cargadas:', racionesData.length);
      } catch (err) {
        console.warn('[Informe] Error cargando raciones:', err.message);
        // Datos de ejemplo para raciones
        racionesData = [
          { id_racion: 1, id_animal: 1, etapa: 'lactancia', ms_total: 18.5, fecha_calculo: '2024-01-15' },
          { id_racion: 2, id_animal: 2, etapa: 'ceba', ms_total: 12.3, fecha_calculo: '2024-01-16' }
        ];
      }

      // Cargar consultas bromatológicas
      try {
        const resC = await axiosInstance.get('/api/consultas-bromatologicas/api');
        consultasBromaData = Array.isArray(resC.data) ? resC.data : [];
        console.log('[Informe] Consultas bromatológicas cargadas:', consultasBromaData.length);
      } catch (err) {
        console.warn('[Informe] Error cargando consultas bromatológicas:', err.message);
        consultasBromaData = [];
      }

      // Cargar ingredientes
      try {
        const resIng = await axiosInstance.get('/api/ingredientes/api');
        ingredientesData = Array.isArray(resIng.data) ? resIng.data : [];
        console.log('[Informe] Ingredientes cargados:', ingredientesData.length);
      } catch (err) {
        console.warn('[Informe] Error cargando ingredientes:', err.message);
        // Datos de ejemplo para ingredientes
        ingredientesData = [
          { id_ingrediente: 1, nombre: 'Pasto Kikuyo', tipo: 'forraje', costo_kg: 0.15 },
          { id_ingrediente: 2, nombre: 'Concentrado Bovino', tipo: 'concentrado', costo_kg: 1.20 },
          { id_ingrediente: 3, nombre: 'Sal Mineralizada', tipo: 'mineral esencial', costo_kg: 2.50 }
        ];
      }

      // Cargar consultas ingredientes
      try {
        const resConsIng = await axiosInstance.get('/api/consultas-ingredientes/api');
        consultasIngredientesData = Array.isArray(resConsIng.data) ? resConsIng.data : [];
        console.log('[Informe] Consultas ingredientes cargadas:', consultasIngredientesData.length);
      } catch (err) {
        console.warn('[Informe] Error cargando consultas ingredientes:', err.message);
        consultasIngredientesData = [];
      }
      console.log('[Informe] Datos finales cargados:');
      console.log('- Haciendas:', haciendasData.length, haciendasData.slice(0, 2));
      console.log('- Animales:', animalesData.length, animalesData.slice(0, 2));
      console.log('- Raciones:', racionesData.length, racionesData.slice(0, 2));
      console.log('- Ingredientes:', ingredientesData.length, ingredientesData.slice(0, 2));

      setHaciendas(haciendasData);
      setAnimales(animalesData);
      setRaciones(racionesData);
      setConsultasBroma(consultasBromaData);
      setIngredientes(ingredientesData);
      setConsultasIngredientes(consultasIngredientesData);
    } catch (err) {
      console.error('[Informe] Error general cargando datos:', err?.message || err);
      // En caso de error general, usar datos de ejemplo para evitar pantalla blanca
      const haciendasFallback = [
        { id_hacienda: 1, nombre: 'Hacienda El Paraíso', propietario: 'Juan Pérez' },
        { id_hacienda: 2, nombre: 'Finca La Esperanza', propietario: 'María García' }
      ];
      const animalesFallback = [
        { id: 1, id_animal: 1, identificador_unico: 'VACA-001', nombre: 'Lola', id_hacienda: 1, peso: 450 },
        { id: 2, id_animal: 2, identificador_unico: 'VACA-002', nombre: 'Bella', id_hacienda: 1, peso: 520 }
      ];
      const racionesFallback = [
        { id_racion: 1, id_animal: 1, etapa: 'lactancia', ms_total: 18.5, fecha_calculo: '2024-01-15' }
      ];
      const ingredientesFallback = [
        { id_ingrediente: 1, nombre: 'Pasto Kikuyo', tipo: 'forraje', costo_kg: 0.15 },
        { id_ingrediente: 2, nombre: 'Concentrado Bovino', tipo: 'concentrado', costo_kg: 1.20 }
      ];

      setHaciendas(haciendasFallback);
      setAnimales(animalesFallback);
      setRaciones(racionesFallback);
      setConsultasBroma([]);
      setIngredientes(ingredientesFallback);
      setConsultasIngredientes([]);
      
      setError('Se cargaron datos de ejemplo. Verifica la conexión con el servidor para obtener datos reales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // (Se removió lógica de filtrado por fechas)

  // Normalizar categorías de ingredientes para el informe de composición
  // Mapea 'Mineral esencial' y 'Oligoelemento' a 'Sales Minerales'
  const mapTipoToCategoria = (tipo) => {
    const t = (tipo || '').toLowerCase().trim();
    if (t.startsWith('concentr')) return 'Concentrados';
    if (
      t.startsWith('sales') ||
      t.startsWith('sale') ||
      t.includes('mineral esencial') ||
      t.includes('oligoelemento')
    ) {
      return 'Sales Minerales';
    }
    return 'Forrajes';
  };

  // Datos filtrados por UI
  const animalesFiltrados = useMemo(() => {
    if (!selectedHacienda) return animales;
    return (animales || []).filter((a) => String(a.id_hacienda || '') === String(selectedHacienda));
  }, [animales, selectedHacienda]);

  const racionesFiltradas = useMemo(() => {
    // Ya no se filtra por Hacienda; aplica solo para animales
    return (raciones || []);
  }, [raciones]);

  const consultasFiltradas = useMemo(() => {
    return (consultasBroma || []);
  }, [consultasBroma]);

  // KPIs por informe
  const kpis = useMemo(() => {
    if (tipoInforme === 'haciendas') {
      // Total haciendas y animales por hacienda promedio
      const totalH = (haciendas || []).length;
      const animalesPorH = (haciendas || []).map((h) => animales.filter((a) => a.id_hacienda === h.id_hacienda).length);
      const totalAnimales = animales.length;
      const promAnimalesPorH = totalH ? (animalesPorH.reduce((s, x) => s + x, 0) / totalH).toFixed(1) : '0';
      const topIdx = animalesPorH.length ? animalesPorH.indexOf(Math.max(...animalesPorH)) : -1;
      const topHacienda = topIdx >= 0 ? haciendas[topIdx]?.nombre : '-';
      return [
        { label: 'Haciendas', value: totalH },
        { label: 'Animales', value: totalAnimales },
        { label: 'Prom. animales/Hda', value: promAnimalesPorH },
        { label: 'Hda con más animales', value: topHacienda },
      ];
    }
    if (tipoInforme === 'animales') {
      const total = animalesFiltrados.length;
      const pesos = animalesFiltrados.map((a) => (a.peso != null ? Number(a.peso) : null)).filter((v) => v != null);
      const avg = pesos.length ? (pesos.reduce((s, x) => s + x, 0) / pesos.length).toFixed(1) : '0';
      const max = pesos.length ? Math.max(...pesos) : 0;
      const min = pesos.length ? Math.min(...pesos) : 0;
      return [
        { label: 'Animales', value: total },
        { label: 'Peso prom. (kg)', value: avg },
        { label: 'Peso máx. (kg)', value: max },
        { label: 'Peso mín. (kg)', value: min },
      ];
    }
    if (tipoInforme === 'raciones') {
      const total = racionesFiltradas.length;
      const msVals = racionesFiltradas.map((r) => (r.ms_total != null ? Number(r.ms_total) : null)).filter((v) => v != null);
      const avg = msVals.length ? (msVals.reduce((s, x) => s + x, 0) / msVals.length).toFixed(2) : '0';
      const max = msVals.length ? Math.max(...msVals) : 0;
      const min = msVals.length ? Math.min(...msVals) : 0;
      return [
        { label: 'Raciones', value: total },
        { label: 'MS prom. (kg)', value: avg },
        { label: 'MS máx. (kg)', value: max },
        { label: 'MS mín. (kg)', value: min },
      ];
    }
    if (tipoInforme === 'composicion') {
      // KPIs para ingredientes por categoría (normalizadas)
      const counts = { Forrajes: 0, Concentrados: 0, 'Sales Minerales': 0 };
      (ingredientes || []).forEach((i) => {
        const cat = mapTipoToCategoria(i.tipo);
        counts[cat] = (counts[cat] || 0) + 1;
      });
      const total = (ingredientes || []).length;
      return [
        { label: 'Ingredientes', value: total },
        { label: 'Forrajes', value: counts.Forrajes },
        { label: 'Concentrados', value: counts.Concentrados },
        { label: 'Sales Minerales', value: counts['Sales Minerales'] },
      ];
    }
    return [];
  }, [tipoInforme, haciendas, animales, animalesFiltrados, racionesFiltradas, consultasFiltradas, ingredientes]);

  // Preparar datos para gráficos según tipoInforme
  const chartData = useMemo(() => {
    if (tipoInforme === 'haciendas') {
      // Comparativa: animales por hacienda con filtros de nombre y mínimo
      const tuples = (haciendas || []).map((h) => {
        const count = (animales || []).filter((a) => a.id_hacienda === h.id_hacienda).length;
        return { nombre: h.nombre, count };
      })
      .filter((t) => {
        const nameOk = fHdaSearch ? t.nombre.toLowerCase().includes(fHdaSearch.toLowerCase()) : true;
        const minOk = fHdaMinCount !== '' ? t.count >= Number(fHdaMinCount) : true;
        return nameOk && minOk;
      });
      const labels = tuples.map((t) => t.nombre);
      const data = tuples.map((t) => t.count);
      return {
        labels,
        datasets: [
          {
            label: 'Animales por hacienda',
            data,
            backgroundColor: '#004b73',
            borderColor: '#003a5b',
          },
        ],
      };
    }
    if (tipoInforme === 'animales') {
      // Comparativa: peso promedio por hacienda, ordenado desc para mejor lectura
      const grouped = new Map(); // id_hacienda -> [pesos]
      animalesFiltrados.forEach((a) => {
        const hid = a.id_hacienda || 'N/A';
        const peso = a.peso != null ? Number(a.peso) : null;
        // Filtro por rango de peso
        if (peso == null) return;
        if (fAniPesoMin !== '' && peso < Number(fAniPesoMin)) return;
        if (fAniPesoMax !== '' && peso > Number(fAniPesoMax)) return;
        if (!grouped.has(hid)) grouped.set(hid, []);
        grouped.get(hid).push(peso);
      });
      const tuples = Array.from(grouped.entries()).map(([hid, arr]) => {
        const avg = arr.reduce((s, x) => s + x, 0) / arr.length;
        return { hid, avg: Number(avg.toFixed(1)) };
      }).sort((a, b) => b.avg - a.avg);
      const labels = tuples.map(({ hid }) => haciendaById.get(hid)?.nombre || `Hda ${hid}`);
      const data = tuples.map(({ avg }) => avg);
      const palette = ['#1f77b4','#2ca02c','#ff7f0e','#9467bd','#17becf','#8c564b','#e377c2','#7f7f7f','#bcbd22','#d62728'];
      return {
        labels,
        datasets: [
          {
            label: 'Peso promedio por hacienda (kg)',
            data,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderColor: '#ffffff',
            borderWidth: 1,
          },
        ],
      };
    }
    if (tipoInforme === 'raciones') {
      // Se devolverá un objeto con datasets separados para ceba y lactancia (para gráficos circulares)
      const makeCountsByHacienda = (items) => {
        const counts = new Map();
        items.forEach((r) => {
          const a = animalById.get(r.id_animal);
          if (!a) return;
          const hid = a.id_hacienda || 'N/A';
          counts.set(hid, (counts.get(hid) || 0) + 1);
        });
        const labels = Array.from(counts.keys()).map((hid) => haciendaById.get(hid)?.nombre || `Hda ${hid}`);
        const data = Array.from(counts.values());
        const palette = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
        return { labels, data, colors: labels.map((_, i) => palette[i % palette.length]) };
      };
      const byExtraFilters = (r) => {
        // Filtrar por hacienda y MS mínima
        const a = animalById.get(r.id_animal);
        const hacOk = fRacHacienda ? (a && String(a.id_hacienda) === String(fRacHacienda)) : true;
        const ms = r.ms_total != null ? Number(r.ms_total) : null;
        const msOk = fRacMinMs !== '' ? (ms != null && ms >= Number(fRacMinMs)) : true;
        return hacOk && msOk;
      };
      const ceba = racionesFiltradas.filter((r) => (r.etapa || '').toLowerCase() === 'ceba').filter(byExtraFilters);
      const lact = racionesFiltradas.filter((r) => (r.etapa || '').toLowerCase() === 'lactancia').filter(byExtraFilters);
      const cebaAgg = makeCountsByHacienda(ceba);
      const lactAgg = makeCountsByHacienda(lact);
      return {
        ceba: {
          labels: cebaAgg.labels,
          datasets: [{
            label: 'Raciones Ceba',
            data: cebaAgg.data,
            backgroundColor: cebaAgg.colors,
            borderColor: '#ffffff',
            borderWidth: 1,
          }]
        },
        lactancia: {
          labels: lactAgg.labels,
          datasets: [{
            label: 'Raciones Lactancia',
            data: lactAgg.data,
            backgroundColor: lactAgg.colors,
            borderColor: '#ffffff',
            borderWidth: 1,
          }]
        }
      };
    }
    if (tipoInforme === 'composicion') {
      // Gráfico de ingredientes por categorías (normalizadas)
      const counts = { Forrajes: 0, Concentrados: 0, 'Sales Minerales': 0 };
      (ingredientes || []).forEach((i) => {
        const cat = mapTipoToCategoria(i.tipo);
        counts[cat] = (counts[cat] || 0) + 1;
      });
      const labels = Object.keys(counts).filter((k) => !!fCompCats[k]);
      const data = labels.map((k) => counts[k]);
      return {
        labels,
        datasets: [
          {
            label: 'Ingredientes por categoría',
            data,
            backgroundColor: ['#2ca02c','#ff7f0e','#bcbd22'],
            borderColor: '#ffffff',
            borderWidth: 1,
          },
        ],
      };
    }
    return { labels: [], datasets: [] };
  }, [
    tipoInforme,
    haciendas,
    animales,
    animalesFiltrados,
    racionesFiltradas,
    consultasFiltradas,
    haciendaById,
    ingredientes,
    // Filtros por gráfico para actualizaciones en tiempo real
    fHdaSearch,
    fHdaMinCount,
    fAniPesoMin,
    fAniPesoMax,
    fRacHacienda,
    fRacMinMs,
    fCompCats,
  ]);

  // Opciones para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          generateLabels: (chart) => {
            try {
              const defaultGen = ChartJS.defaults.plugins.legend.labels.generateLabels;
              const labels = defaultGen(chart);
              return labels.map((l) => {
                if (l.text === 'Peso promedio por hacienda (kg)' || l.text === 'Ingredientes por categoría') {
                  // Ocultar el cuadro de color dejando solo el texto
                  return { ...l, fillStyle: 'rgba(0,0,0,0)', strokeStyle: 'rgba(0,0,0,0)', lineWidth: 0 };
                }
                return l;
              });
            } catch (e) {
              console.warn('[Informe] Error generando labels de leyenda:', e);
              return [];
            }
          },
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Informe - Bovinos App', 14, 22);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Tipo de Informe: ${tipoInforme.charAt(0).toUpperCase() + tipoInforme.slice(1)}`, 14, 42);

    if (tipoInforme === 'haciendas') {
      autoTable(doc, {
        head: [['ID', 'Nombre', 'Propietario']],
        body: (haciendas || []).map((h) => [h.id_hacienda, h.nombre, h.propietario || '']),
        startY: 50,
      });
    } else if (tipoInforme === 'animales') {
      autoTable(doc, {
        head: [['ID', 'Identificador', 'Nombre', 'Hacienda', 'Peso (kg)']],
        body: (animalesFiltrados || []).map((a) => [a.id, a.identificador_unico || '', a.nombre || '', (haciendaById.get(a.id_hacienda)?.nombre || ''), a.peso ?? '']),
        startY: 50,
      });
    } else if (tipoInforme === 'raciones') {
      autoTable(doc, {
        head: [['ID', 'Animal', 'Etapa', 'MS Total (kg)', 'Fecha']],
        body: (racionesFiltradas || []).map((r) => [r.id_racion, r.id_animal, r.etapa || '', r.ms_total ?? '', r.fecha_calculo || '']),
        startY: 50,
      });
    } else if (tipoInforme === 'composicion') {
      autoTable(doc, {
        head: [['ID Ingrediente', 'Nombre', 'Tipo', 'Costo (kg)']],
        body: (ingredientes || []).map((i) => [
          i.id_ingrediente,
          i.nombre,
          mapTipoToCategoria(i.tipo),
          i.costo_kg ?? '',
        ]),
        startY: 50,
      });
    }

    doc.save('informe_bovinos_app.pdf');
    Swal.fire({
      title: 'Éxito',
      text: 'Informe exportado a PDF correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
  };

  // Exportar a Excel
  const exportToExcel = () => {
    let data = [];
    let headers = [];

    if (tipoInforme === 'haciendas') {
      headers = ['ID', 'Nombre', 'Propietario'];
      data = (haciendas || []).map((h) => ({ ID: h.id_hacienda, Nombre: h.nombre, Propietario: h.propietario || '' }));
    } else if (tipoInforme === 'animales') {
      headers = ['ID', 'Identificador', 'Nombre', 'Hacienda', 'Peso (kg)'];
      data = (animalesFiltrados || []).map((a) => ({
        ID: a.id,
        Identificador: a.identificador_unico || '',
        Nombre: a.nombre || '',
        Hacienda: haciendaById.get(a.id_hacienda)?.nombre || '',
        'Peso (kg)': a.peso ?? '',
      }));
    } else if (tipoInforme === 'raciones') {
      headers = ['ID', 'Animal', 'Etapa', 'MS Total (kg)', 'Fecha'];
      data = (racionesFiltradas || []).map((r) => ({
        ID: r.id_racion,
        Animal: r.id_animal,
        Etapa: r.etapa || '',
        'MS Total (kg)': r.ms_total ?? '',
        Fecha: r.fecha_calculo || '',
      }));
    } else if (tipoInforme === 'composicion') {
      headers = ['ID Ingrediente', 'Nombre', 'Tipo', 'Costo (kg)'];
      data = (ingredientes || []).map((i) => ({
        'ID Ingrediente': i.id_ingrediente,
        Nombre: i.nombre,
        Tipo: mapTipoToCategoria(i.tipo),
        'Costo (kg)': i.costo_kg ?? '',
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Informe');
    XLSX.writeFile(workbook, 'informe_bovinos_app.xlsx');

    Swal.fire({
      title: 'Éxito',
      text: 'Informe exportado a Excel correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
  };

  if (loading) {
    return (
      <div className="informe-container">
        <div className="informe-header">
          <h2>Informes - Software Ganadero</h2>
        </div>
        <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
          <p>Cargando datos del informe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="informe-container">
      <div className="informe-header">
        <h2>Informes - Software Ganadero</h2>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          Recargar Datos
        </button>
      </div>

      <div className="filtro-section">
        <div className="filtro-group">
          <label>Tipo de Informe</label>
          <select value={tipoInforme} onChange={(e) => setTipoInforme(e.target.value)}>
            <option value="haciendas">Informe de Haciendas</option>
            <option value="animales">Informe de Animales</option>
            <option value="raciones">Informe de Raciones (Ceba, Lactancia)</option>
            <option value="composicion">Informe Composición Bromatológica</option>
          </select>
        </div>
        {tipoInforme === 'animales' && (
          <div className="filtro-group">
            <label>Hacienda</label>
            <select value={selectedHacienda} onChange={(e) => setSelectedHacienda(e.target.value)}>
              <option value="">Todas</option>
              {(haciendas || []).map((h) => (
                <option key={h.id_hacienda} value={h.id_hacienda}>{h.nombre}</option>
              ))}
            </select>
          </div>
        )}
        {/* Filtros específicos para el gráfico */}
        {tipoInforme === 'haciendas' && (
          <>
            <div className="filtro-group">
              <label>Buscar Hacienda</label>
              <input
                type="text"
                placeholder="Nombre contiene..."
                value={fHdaSearch}
                onChange={(e) => setFHdaSearch(e.target.value)}
              />
            </div>
            <div className="filtro-group">
              <label>Mín. animales</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={fHdaMinCount}
                onChange={(e) => setFHdaMinCount(e.target.value)}
              />
            </div>
          </>
        )}
        {tipoInforme === 'animales' && (
          <>
            <div className="filtro-group">
              <label>Peso mín. (kg)</label>
              <input
                type="number"
                min="0"
                placeholder=""
                value={fAniPesoMin}
                onChange={(e) => setFAniPesoMin(e.target.value)}
              />
            </div>
            <div className="filtro-group">
              <label>Peso máx. (kg)</label>
              <input
                type="number"
                min="0"
                placeholder=""
                value={fAniPesoMax}
                onChange={(e) => setFAniPesoMax(e.target.value)}
              />
            </div>
          </>
        )}
        {tipoInforme === 'raciones' && (
          <>
            <div className="filtro-group">
              <label>Hacienda (raciones)</label>
              <select value={fRacHacienda} onChange={(e) => setFRacHacienda(e.target.value)}>
                <option value="">Todas</option>
                {(haciendas || []).map((h) => (
                  <option key={h.id_hacienda} value={h.id_hacienda}>{h.nombre}</option>
                ))}
              </select>
            </div>
            <div className="filtro-group">
              <label>MS mín. (kg)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder=""
                value={fRacMinMs}
                onChange={(e) => setFRacMinMs(e.target.value)}
              />
            </div>
          </>
        )}
        {tipoInforme === 'composicion' && (
          <div className="filtro-group">
            <label>Categorías</label>
            <div className="checkbox-group">
              {['Forrajes','Concentrados','Sales Minerales'].map((cat) => (
                <label key={cat} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!fCompCats[cat]}
                    onChange={(e) => setFCompCats({ ...fCompCats, [cat]: e.target.checked })}
                  />
                  <span style={{ marginLeft: 6 }}>{cat}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="filtro-group">
          <button className="btn btn-secondary" onClick={() => setMostrarGrafico(!mostrarGrafico)}>
            {mostrarGrafico ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-section">
        {(kpis || []).map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Gráficos */}
      {mostrarGrafico && (
        <div className="grafico-section">
          <h3>Visualización Gráfica</h3>
          {(tipoInforme === 'haciendas' || tipoInforme === 'animales') && chartData && chartData.labels && chartData.labels.length > 0 && (
            <div className="grafico-container" style={{ height: '400px', position: 'relative' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
          {(tipoInforme === 'haciendas' || tipoInforme === 'animales') && (!chartData || !chartData.labels || chartData.labels.length === 0) && (
            <div className="grafico-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>No hay datos suficientes para mostrar el gráfico</p>
            </div>
          )}
          {tipoInforme === 'raciones' && (
            <div className="grafico-grid-2">
              <div className="grafico-container" style={{ height: '400px', position: 'relative' }}>
                <h4>Raciones - Ceba</h4>
                {chartData?.ceba && chartData.ceba.labels && chartData.ceba.labels.length > 0 ? (
                  <Pie data={chartData.ceba} options={chartOptions} />
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                    <p style={{ color: '#6c757d' }}>No hay raciones de ceba</p>
                  </div>
                )}
              </div>
              <div className="grafico-container" style={{ height: '400px', position: 'relative' }}>
                <h4>Raciones - Lactancia</h4>
                {chartData?.lactancia && chartData.lactancia.labels && chartData.lactancia.labels.length > 0 ? (
                  <Pie data={chartData.lactancia} options={chartOptions} />
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                    <p style={{ color: '#6c757d' }}>No hay raciones de lactancia</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {tipoInforme === 'composicion' && chartData && chartData.labels && chartData.labels.length > 0 && (
            <div className="grafico-container" style={{ height: '400px', position: 'relative' }}>
              <Pie data={chartData} options={chartOptions} />
            </div>
          )}
          {tipoInforme === 'composicion' && (!chartData || !chartData.labels || chartData.labels.length === 0) && (
            <div className="grafico-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
              <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>No hay datos de composición para mostrar</p>
            </div>
          )}
        </div>
      )}

      {/* Tabla de datos */}
      <div className="tabla-section">
        <div className="tabla-header-actions">
          <h3>Datos del Informe</h3>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={exportToPDF} disabled={loading}>
              <FaFilePdf /> Exportar a PDF
            </button>
            <button className="btn btn-primary" onClick={exportToExcel} disabled={loading}>
              <FaFileExcel /> Exportar a Excel
            </button>
          </div>
        </div>
        <div className="table-container">
          {tipoInforme === 'haciendas' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Propietario</th>
                </tr>
              </thead>
              <tbody>
                {(haciendas || []).length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No hay haciendas registradas
                    </td>
                  </tr>
                ) : (
                  (haciendas || []).map((h) => (
                    <tr key={h.id_hacienda}>
                      <td>{h.id_hacienda}</td>
                      <td>{h.nombre}</td>
                      <td>{h.propietario || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tipoInforme === 'animales' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Identificador</th>
                  <th>Nombre</th>
                  <th>Hacienda</th>
                  <th>Peso (kg)</th>
                </tr>
              </thead>
              <tbody>
                {(animales || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No hay animales registrados
                    </td>
                  </tr>
                ) : (
                  (animales || []).map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.identificador_unico || ''}</td>
                      <td>{a.nombre || ''}</td>
                      <td>{haciendaById.get(a.id_hacienda)?.nombre || ''}</td>
                      <td>{a.peso ?? ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tipoInforme === 'raciones' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Animal</th>
                  <th>Etapa</th>
                  <th>MS Total (kg)</th>
                  <th>Fecha cálculo</th>
                </tr>
              </thead>
              <tbody>
                {(raciones || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No hay raciones registradas
                    </td>
                  </tr>
                ) : (
                  (raciones || []).map((r) => (
                    <tr key={r.id_racion}>
                      <td>{r.id_racion}</td>
                      <td>{r.id_animal}</td>
                      <td>{r.etapa || ''}</td>
                      <td>{r.ms_total ?? ''}</td>
                      <td>{r.fecha_calculo || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tipoInforme === 'composicion' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>ID Ingrediente</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Costo (kg)</th>
                </tr>
              </thead>
              <tbody>
                {(ingredientes || []).length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No hay ingredientes registrados
                    </td>
                  </tr>
                ) : (
                  (ingredientes || []).map((i) => (
                    <tr key={i.id_ingrediente}>
                      <td>{i.id_ingrediente}</td>
                      <td>{i.nombre}</td>
                      <td>{mapTipoToCategoria(i.tipo)}</td>
                      <td>{i.costo_kg ?? ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Informe;