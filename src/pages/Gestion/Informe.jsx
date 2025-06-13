import React, { useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';
import { FaChartBar, FaChartPie, FaFilePdf, FaFileExcel, FaCow, FaBoxOpen, FaUtensils } from 'react-icons/fa';
import './Informe.css';

// Registrar los elementos necesarios para Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Informe = () => {
  // Datos simulados (en un entorno real vendrían de la API)
  const haciendas = [
    { id: 1, nombre: 'Hacienda El Sol' },
    { id: 2, nombre: 'Hacienda La Luna' },
    { id: 3, nombre: 'Hacienda Estrella' },
  ];

  const animales = [
    { id: 1, identificador: 'A001', raza: 'Angus', genero: 'Macho', peso: 450, hacienda_id: 1 },
    { id: 2, identificador: 'A002', raza: 'Holstein', genero: 'Hembra', peso: 400, hacienda_id: 1 },
    { id: 3, identificador: 'A003', raza: 'Angus', genero: 'Hembra', peso: 420, hacienda_id: 2 },
    { id: 4, identificador: 'A004', raza: 'Brahman', genero: 'Macho', peso: 480, hacienda_id: 3 },
  ];

  const inventario = [
    { id_inventario: 1, hacienda_id: 1, producto: 'Vacuna contra fiebre aftosa', categoria: 'Medicamentos', cantidad: 50, unidad: 'Dosis' },
    { id_inventario: 2, hacienda_id: 1, producto: 'Alimento balanceado', categoria: 'Alimentos', cantidad: 5, unidad: 'Kilogramos' },
    { id_inventario: 3, hacienda_id: 2, producto: 'Arete de identificación', categoria: 'Insumos', cantidad: 200, unidad: 'Unidades' },
  ];

  const composicionBronatologica = [
    { ingrediente: 'Maíz', materia_seca: 88.0, proteina_cruda: 9.0, energia_metabolizable: 3.3 },
    { ingrediente: 'Soja', materia_seca: 90.0, proteina_cruda: 44.0, energia_metabolizable: 3.2 },
    { ingrediente: 'Alfalfa', materia_seca: 91.0, proteina_cruda: 18.0, energia_metabolizable: 2.4 },
  ];

  // Estado para el tipo de informe seleccionado y la hacienda
  const [tipoInforme, setTipoInforme] = useState('inventario');
  const [haciendaSeleccionada, setHaciendaSeleccionada] = useState('');
  const [mostrarGrafico, setMostrarGrafico] = useState(false);

  // Filtrar datos según la hacienda seleccionada
  const animalesFiltrados = haciendaSeleccionada
    ? animales.filter((animal) => animal.hacienda_id === parseInt(haciendaSeleccionada))
    : animales;

  const inventarioFiltrado = haciendaSeleccionada
    ? inventario.filter((item) => item.hacienda_id === parseInt(haciendaSeleccionada))
    : inventario;

  // Preparar datos para gráficos
  const getChartData = () => {
    if (tipoInforme === 'inventario') {
      const categorias = [...new Set(inventarioFiltrado.map((item) => item.categoria))];
      const cantidades = categorias.map(
        (categoria) =>
          inventarioFiltrado
            .filter((item) => item.categoria === categoria)
            .reduce((sum, item) => sum + item.cantidad, 0)
      );

      return {
        labels: categorias,
        datasets: [
          {
            label: 'Cantidad en Inventario',
            data: cantidades,
            backgroundColor: ['#004b73', '#28a745', '#dc3545'],
            borderColor: ['#003a5b', '#218838', '#c82333'],
            borderWidth: 1,
          },
        ],
      };
    } else if (tipoInforme === 'animales') {
      const razas = [...new Set(animalesFiltrados.map((animal) => animal.raza))];
      const conteoRazas = razas.map(
        (raza) => animalesFiltrados.filter((animal) => animal.raza === raza).length
      );

      return {
        labels: razas,
        datasets: [
          {
            data: conteoRazas,
            backgroundColor: ['#004b73', '#28a745', '#dc3545', '#17a2b8'],
            borderColor: ['#003a5b', '#218838', '#c82333', '#138496'],
            borderWidth: 1,
          },
        ],
      };
    }
    return {};
  };

  // Opciones para los gráficos
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Informe - Bovinos App', 14, 22);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Tipo de Informe: ${tipoInforme.charAt(0).toUpperCase() + tipoInforme.slice(1)}`, 14, 42);

    if (tipoInforme === 'inventario') {
      autoTable(doc, {
        head: [['Hacienda', 'Producto', 'Categoría', 'Cantidad', 'Unidad']],
        body: inventarioFiltrado.map((item) => [
          haciendas.find((h) => h.id === item.hacienda_id)?.nombre || 'N/A',
          item.producto,
          item.categoria,
          item.cantidad,
          item.unidad,
        ]),
        startY: 50,
      });
    } else if (tipoInforme === 'animales') {
      autoTable(doc, {
        head: [['Identificador', 'Raza', 'Género', 'Peso (kg)', 'Hacienda']],
        body: animalesFiltrados.map((animal) => [
          animal.identificador,
          animal.raza,
          animal.genero,
          animal.peso,
          haciendas.find((h) => h.id === animal.hacienda_id)?.nombre || 'N/A',
        ]),
        startY: 50,
      });
    } else if (tipoInforme === 'composicion') {
      autoTable(doc, {
        head: [['Ingrediente', 'Materia Seca (%)', 'Proteína Cruda (%)', 'Energía Metabolizable (Mcal/kg)']],
        body: composicionBronatologica.map((item) => [
          item.ingrediente,
          item.materia_seca,
          item.proteina_cruda,
          item.energia_metabolizable,
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

    if (tipoInforme === 'inventario') {
      headers = ['Hacienda', 'Producto', 'Categoría', 'Cantidad', 'Unidad'];
      data = inventarioFiltrado.map((item) => ({
        Hacienda: haciendas.find((h) => h.id === item.hacienda_id)?.nombre || 'N/A',
        Producto: item.producto,
        Categoría: item.categoria,
        Cantidad: item.cantidad,
        Unidad: item.unidad,
      }));
    } else if (tipoInforme === 'animales') {
      headers = ['Identificador', 'Raza', 'Género', 'Peso (kg)', 'Hacienda'];
      data = animalesFiltrados.map((animal) => ({
        Identificador: animal.identificador,
        Raza: animal.raza,
        Género: animal.genero,
        'Peso (kg)': animal.peso,
        Hacienda: haciendas.find((h) => h.id === animal.hacienda_id)?.nombre || 'N/A',
      }));
    } else if (tipoInforme === 'composicion') {
      headers = ['Ingrediente', 'Materia Seca (%)', 'Proteína Cruda (%)', 'Energía Metabolizable (Mcal/kg)'];
      data = composicionBronatologica.map((item) => ({
        Ingrediente: item.ingrediente,
        'Materia Seca (%)': item.materia_seca,
        'Proteína Cruda (%)': item.proteina_cruda,
        'Energía Metabolizable (Mcal/kg)': item.energia_metabolizable,
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

  return (
    <div className="informe-container">
      <div className="informe-header">
        <h2>Informes - Software Ganadero</h2>
      </div>

      {/* Selección de informe y filtros */}
      <div className="filtro-section">
        <div className="filtro-group">
          <label>Tipo de Informe</label>
          <select value={tipoInforme} onChange={(e) => setTipoInforme(e.target.value)}>
            <option value="inventario">Inventario por Hacienda</option>
            <option value="animales">Estadísticas de Animales</option>
            <option value="composicion">Composición Bromatológica</option>
          </select>
        </div>
        {tipoInforme !== 'composicion' && (
          <div className="filtro-group">
            <label>Filtrar por Hacienda</label>
            <select value={haciendaSeleccionada} onChange={(e) => setHaciendaSeleccionada(e.target.value)}>
              <option value="">Todas las Haciendas</option>
              {haciendas.map((hacienda) => (
                <option key={hacienda.id} value={hacienda.id}>
                  {hacienda.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="filtro-group">
          <button className="btn btn-secondary" onClick={() => setMostrarGrafico(!mostrarGrafico)}>
            {mostrarGrafico ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
          </button>
        </div>
      </div>

      {/* Gráficos */}
      {mostrarGrafico && (
        <div className="grafico-section">
          <h3>Visualización Gráfica</h3>
          {tipoInforme === 'inventario' && (
            <div className="grafico-container">
              <Bar data={getChartData()} options={chartOptions} />
            </div>
          )}
          {tipoInforme === 'animales' && (
            <div className="grafico-container">
              <Pie data={getChartData()} options={chartOptions} />
            </div>
          )}
          {tipoInforme === 'composicion' && (
            <p className="grafico-placeholder">Gráfico no disponible para composición bromatológica.</p>
          )}
        </div>
      )}

      {/* Tabla de datos */}
      <div className="tabla-section">
        <div className="tabla-header-actions">
          <h3>Datos del Informe</h3>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={exportToPDF}>
              <FaFilePdf /> Exportar a PDF
            </button>
            <button className="btn btn-primary" onClick={exportToExcel}>
              <FaFileExcel /> Exportar a Excel
            </button>
          </div>
        </div>
        <div className="table-container">
          {tipoInforme === 'inventario' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>Hacienda</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {inventarioFiltrado.map((item) => (
                  <tr key={item.id_inventario}>
                    <td>{haciendas.find((h) => h.id === item.hacienda_id)?.nombre || 'N/A'}</td>
                    <td>{item.producto}</td>
                    <td>{item.categoria}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tipoInforme === 'animales' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>Identificador</th>
                  <th>Raza</th>
                  <th>Género</th>
                  <th>Peso (kg)</th>
                  <th>Hacienda</th>
                </tr>
              </thead>
              <tbody>
                {animalesFiltrados.map((animal) => (
                  <tr key={animal.id}>
                    <td>{animal.identificador}</td>
                    <td>{animal.raza}</td>
                    <td>{animal.genero}</td>
                    <td>{animal.peso}</td>
                    <td>{haciendas.find((h) => h.id === animal.hacienda_id)?.nombre || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tipoInforme === 'composicion' && (
            <table className="informe-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Materia Seca (%)</th>
                  <th>Proteína Cruda (%)</th>
                  <th>Energía Metabolizable (Mcal/kg)</th>
                </tr>
              </thead>
              <tbody>
                {composicionBronatologica.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ingrediente}</td>
                    <td>{item.materia_seca}</td>
                    <td>{item.proteina_cruda}</td>
                    <td>{item.energia_metabolizable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Informe;