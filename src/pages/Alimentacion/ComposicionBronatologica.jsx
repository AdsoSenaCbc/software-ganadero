import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import './ComposicionBronatologica.css';
import { apiUrl, authHeader } from '../../api/api';

const ComposicionBronatologica = () => {
  // Estado para el formulario de ingreso
  const [formData, setFormData] = useState({
    ingrediente: '',
    materia_seca: '',
    proteina_cruda: '',
    energia_metabolizable: '',
    fibra_cruda: '',
    calcio: '',
    fosforo: '',
  });

  // Estado de datos (desde la BD)
  const [allIngredientes, setAllIngredientes] = useState([]); // filas completas pivotadas por nutriente
  const [ingredientes, setIngredientes] = useState([]); // filas filtradas visibles
  const [nutrientColumns, setNutrientColumns] = useState([]); // columnas dinámicas [{id, nombre, unidad}]
  const [loading, setLoading] = useState(true);
  // Filtros adicionales
  const [selectedNutrienteId, setSelectedNutrienteId] = useState('');
  const [selectedTipo, setSelectedTipo] = useState(''); // Forrajes | Concentrados | Sales minerales

  // Cargar ingredientes, nutrientes y características desde la API y pivotear
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const headers = authHeader();
        if (!headers.Authorization) {
          setLoading(false);
          await Swal.fire({
            title: 'Sesión requerida',
            text: 'Debes iniciar sesión para consultar la composición bromatológica.',
            icon: 'warning',
            confirmButtonText: 'Ir a Iniciar Sesión'
          }).then(() => {
            if (typeof window !== 'undefined') window.location.href = '/login';
          });
          return;
        }
        const commonOpts = { headers };
        const [respIng, respNut, respCar] = await Promise.all([
          fetch(apiUrl('/api/ingredientes/api'), commonOpts),
          fetch(apiUrl('/api/nutrientes/api'), commonOpts),
          fetch(apiUrl('/api/caracteristicas-nutricionales/api'), commonOpts)
        ]);

        const isJSON = (r) => (r.headers.get('content-type') || '').includes('application/json');
        if (respIng.status === 401 || respNut.status === 401 || respCar.status === 401) {
          throw new Error('401');
        }
        if (!respIng.ok || !isJSON(respIng)) throw new Error('Error obteniendo ingredientes.');
        if (!respNut.ok || !isJSON(respNut)) throw new Error('Error obteniendo nutrientes.');
        if (!respCar.ok || !isJSON(respCar)) throw new Error('Error obteniendo características.');

        const [ings, nuts, cars] = await Promise.all([
          respIng.json(), respNut.json(), respCar.json()
        ]);

        const nutrientes = Array.isArray(nuts) ? nuts : [];
        const nutrientesSorted = [...nutrientes].sort((a, b) => {
          const an = (a.nombre || '').toString();
          const bn = (b.nombre || '').toString();
          return an.localeCompare(bn);
        });
        setNutrientColumns(
          nutrientesSorted.map(n => ({ id: n.id_nutriente, nombre: n.nombre, unidad: n.unidad }))
        );

        const ingList = Array.isArray(ings) ? ings : [];
        const carsList = Array.isArray(cars) ? cars : [];

        // Construir mapa de valores por ingrediente -> nutriente
        const byIng = {};
        carsList.forEach(c => {
          const iid = c.id_ingrediente;
          const nid = c.id_nutriente;
          if (iid == null || nid == null) return;
          if (!byIng[iid]) byIng[iid] = {};
          byIng[iid][nid] = c.valor;
        });

        // Construir filas pivotadas
        const rows = ingList.map(ing => ({
          id_ingrediente: ing.id_ingrediente ?? ing.id,
          ingrediente: ing.nombre ?? ing.ingrediente ?? `ID ${ing.id_ingrediente ?? ing.id}`,
          tipo: ing.tipo ?? '',
          is_concentrado: Boolean(ing.is_concentrado),
          is_sale_mineral: Boolean(ing.is_sale_mineral),
          valores: byIng[ing.id_ingrediente] || {}
        }));

        setAllIngredientes(rows);
        setIngredientes(rows);
      } catch (e) {
        console.error('Error cargando datos bromatológicos:', e);
        setAllIngredientes([]);
        setIngredientes([]);
        setNutrientColumns([]);
        if (String(e.message) === '401') {
          await Swal.fire({
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Ir a Iniciar Sesión'
          });
          if (typeof window !== 'undefined') window.location.href = '/login';
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No fue posible cargar la composición bromatológica desde la base de datos.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultar = () => {
    // Filtros combinados: nombre de ingrediente + tipo + nutriente
    const nameQuery = (formData.ingrediente || '').toLowerCase().trim();
    const nid = selectedNutrienteId ? Number(selectedNutrienteId) : null;
    const tipoSel = (selectedTipo || '').trim();

    let filteredIngredientes = allIngredientes;

    if (nameQuery) {
      filteredIngredientes = filteredIngredientes.filter((row) =>
        String(row.ingrediente || '').toLowerCase().includes(nameQuery)
      );
    }

    if (tipoSel) {
      filteredIngredientes = filteredIngredientes.filter((row) => {
        const tipo = String(row.tipo || '').toLowerCase();
        if (tipoSel === 'Concentrados') return tipo === 'concentrado';
        if (tipoSel === 'Sales minerales') return tipo === 'mineral';
        if (tipoSel === 'Forrajes') return tipo === 'forraje';
        // Fallback por texto si llegara otra etiqueta
        return tipo === tipoSel.toLowerCase();
      });
    }

    if (nid) {
      filteredIngredientes = filteredIngredientes.filter((row) => {
        const v = row.valores ? row.valores[nid] : undefined;
        return v != null && Number.isFinite(Number(v));
      });
    }

    if (filteredIngredientes.length === 0) {
      Swal.fire({
        title: 'Sin resultados',
        text: 'No se encontraron ingredientes con los filtros aplicados',
        icon: 'info',
        confirmButtonText: 'Aceptar',
      });
    }

    setIngredientes(filteredIngredientes);
  };

  const handleLimpiar = () => {
    setFormData((prev) => ({ ...prev, ingrediente: '' }));
    setSelectedNutrienteId('');
    setSelectedTipo('');
    setIngredientes(allIngredientes);
  };

  return (
    <div className="composicion-container">
      <div className="composicion-header">
        <h2>Composición Bromatológica</h2>
        <div className="data-summary">
          <span className="summary-item">
            <strong>{allIngredientes.length}</strong> ingredientes
          </span>
          <span className="summary-item">
            <strong>{nutrientColumns.length}</strong> nutrientes
          </span>
          <span className="summary-item">
            Mostrando: <strong>{ingredientes.length}</strong> resultados
          </span>
        </div>
      </div>


        <div className="filters">
          <div className="filter-item">
            <label>Buscar Ingrediente</label>
            <input 
              type="text" 
              name="ingrediente"
              value={formData.ingrediente} 
              onChange={handleChange}
              placeholder="Nombre del ingrediente..."
            />
          </div>
          <div className="filter-item">
            <label>Categoría</label>
            <select value={selectedTipo} onChange={(e) => setSelectedTipo(e.target.value)}>
              <option value="">Todas</option>
              <option value="Forrajes">Forrajes</option>
              <option value="Concentrados">Concentrados</option>
              <option value="Sales minerales">Sales minerales</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Nutriente</label>
            <select value={selectedNutrienteId} onChange={(e) => setSelectedNutrienteId(e.target.value)}>
              <option value="">Todos</option>
              {nutrientColumns.map((n) => (
                <option key={n.id} value={n.id}>{n.nombre}{n.unidad ? ` (${n.unidad})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={handleConsultar}>Aplicar</button>
            <button className="btn btn-secondary" onClick={handleLimpiar}>Limpiar</button>
          </div>
        </div>
      

      {/* Tabla de información de ingredientes */}
      <div className="info-section">
        <h3>Información de Ingredientes</h3>
        <div className="info-table-container">
          <table className="info-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Categoría</th>
                {nutrientColumns.map((n) => (
                  <th key={n.id}>{n.nombre}{n.unidad ? ` (${n.unidad})` : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2 + nutrientColumns.length}>Cargando...</td>
                </tr>
              ) : ingredientes.length === 0 ? (
                <tr>
                  <td colSpan={2 + nutrientColumns.length}>Sin datos para mostrar</td>
                </tr>
              ) : (
                ingredientes.map((row, index) => (
                  <tr key={row.id_ingrediente ?? index}>
                    <td>{row.ingrediente}</td>
                    <td>{row.tipo || '-'}</td>
                    {nutrientColumns.map((n) => (
                      <td key={n.id} className="numeric" title={n.unidad || ''}>
                        {row.valores && row.valores[n.id] != null ? Number(row.valores[n.id]).toFixed(2) : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComposicionBronatologica;