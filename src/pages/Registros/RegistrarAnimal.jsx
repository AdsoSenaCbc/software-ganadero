import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FaTag, FaPaw, FaVenusMars, FaWeight, FaLeaf, FaBaby } from 'react-icons/fa';

import axiosInstance, { API_ROUTES } from '../../api/axiosConfig';
import { useAuth } from '../../AuthContext';
import useFetchLists from '../../hooks/useFetchLists';
import './RegistrarAnimal.css';

const routeMap = {
  razas: API_ROUTES.RAZAS,
  sexos: API_ROUTES.SEXOS,
  especies: API_ROUTES.ESPECIES,
  estados: API_ROUTES.ESTADOS,
  etapas: API_ROUTES.ETAPAS,
  haciendas: API_ROUTES.HACIENDAS,
};

const emptyForm = {
  identificador_unico: '',
  nombre: '',
  peso: '',
  propietario: '',
  es_mestizo: false,
  raza_padre: '',
  raza_madre: '',
  porcentaje_raza_principal: '',
  edad_anos: '',
  edad_meses: '',
  fecha_nacimiento: '',
  observaciones: '',
  id_raza: '',
  id_sexo: '',
  id_especie: '',
  id_estado: '',
  id_hacienda: '',
  id_etapa: '',
};

export default function RegistrarAnimal() {
  const { token } = useAuth();
  const { lists, loading, error } = useFetchLists(routeMap, token);

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState(null);
  const [propietarios, setPropietarios] = useState([]);
  // Modal de consulta
  const [showModal, setShowModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Listado y modal de consulta
  const [animals, setAnimals] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  // filtros
  const [filterIdent, setFilterIdent] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const [filterEspecie, setFilterEspecie] = useState('');

  const loadAnimals = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const { data } = await axiosInstance.get(API_ROUTES.ANIMALES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(data) ? data : (data?.items || []);
      // Si el listado viene resumido, enriquecemos con GET por id similar a Hacienda
      const needsEnrich = items.some(
        (a) => a.id_raza === undefined && a.id_especie === undefined && a.id_estado === undefined
      );
      if (!needsEnrich) {
        setAnimals(items);
      } else {
        const headers = { Authorization: `Bearer ${token}` };
        const enriched = await Promise.all(
          items.map(async (a) => {
            const id = a.id_animal || a.id;
            if (!id) return a;
            try {
              const { data: full } = await axiosInstance.get(`${API_ROUTES.ANIMALES_CRUD}${id}`, { headers });
              return { ...a, ...full };
            } catch (_) {
              return a;
            }
          })
        );
        setAnimals(enriched);
      }
    } catch (err) {
      console.error('Error cargando animales:', err);
      setListError(err.response?.data?.message || err.message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAnimals();
  }, [token]);

  // Cargar propietarios desde haciendas
  useEffect(() => {
    const loadPropietarios = async () => {
      if (!token) return;
      try {
        const { data } = await axiosInstance.get(API_ROUTES.HACIENDAS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const haciendas = Array.isArray(data) ? data : (data?.items || []);
        
        // Extraer propietarios únicos
        const propietariosUnicos = [...new Set(
          haciendas
            .map(h => h.propietario)
            .filter(p => p && p.trim() !== '')
        )].sort();
        
        setPropietarios(propietariosUnicos);
      } catch (err) {
        console.error('Error cargando propietarios:', err);
      }
    };

    loadPropietarios();
  }, [token]);

  // Función para calcular edad automáticamente
  const calculateAge = (birthDate) => {
    if (!birthDate) return { years: '', months: '' };
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    // Calcular años completos
    let years = today.getFullYear() - birth.getFullYear();
    let monthsFromYears = today.getMonth() - birth.getMonth();
    
    if (monthsFromYears < 0) {
      years--;
      monthsFromYears += 12;
    }
    
    // Si el día actual es menor que el día de nacimiento, restar un mes
    if (today.getDate() < birth.getDate()) {
      monthsFromYears--;
      if (monthsFromYears < 0) {
        years--;
        monthsFromYears += 12;
      }
    }
    
    // Calcular el total de meses vividos
    const totalMonths = (years * 12) + monthsFromYears;
    
    return { 
      years: years.toString(), 
      months: totalMonths.toString() 
    };
  };

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  /* ------------ helpers ------------ */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es fecha de nacimiento, calcular edad automáticamente
    if (name === 'fecha_nacimiento') {
      const age = calculateAge(value);
      setFormData((p) => ({ 
        ...p, 
        [name]: value,
        edad_anos: age.years,
        edad_meses: age.months
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const required = [
      'identificador_unico',
      'nombre',
      'peso',
      'id_raza',
      'id_sexo',
      'id_especie',
      'id_estado',
      'id_hacienda',
      'id_etapa',
    ];
    const errs = {};
    required.forEach((f) => {
      if (!formData[f]) errs[f] = 'Requerido';
    });
    
    // Validaciones específicas
    if (formData.peso && (+formData.peso <= 0 || isNaN(formData.peso))) errs.peso = 'Debe ser > 0';
    if (formData.edad_anos && (+formData.edad_anos < 0 || isNaN(formData.edad_anos))) errs.edad_anos = 'Debe ser >= 0';
    if (formData.edad_meses && (+formData.edad_meses < 0 || isNaN(formData.edad_meses))) errs.edad_meses = 'Debe ser >= 0';
    if (formData.porcentaje_raza_principal && (+formData.porcentaje_raza_principal < 0 || +formData.porcentaje_raza_principal > 100 || isNaN(formData.porcentaje_raza_principal))) errs.porcentaje_raza_principal = 'Debe ser entre 0 y 100';
    
    // Validación de mestizaje
    if (formData.es_mestizo && !formData.raza_padre && !formData.raza_madre) {
      errs.raza_padre = 'Debe especificar al menos una raza de los padres';
      errs.raza_madre = 'Debe especificar al menos una raza de los padres';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ------------ acciones CRUD ------------ */
  // Normaliza datos: convierte IDs y peso a números para cumplir con FK y tipos del backend
  const handleSave = async () => {
    if (!validate()) return;
    try {
      // Preparamos payload seguro
      const payload = {
        ...formData,
        id_hacienda: formData.id_hacienda ? Number(formData.id_hacienda) : null,
        id_raza: formData.id_raza ? Number(formData.id_raza) : null,
        id_sexo: formData.id_sexo ? Number(formData.id_sexo) : null,
        id_especie: formData.id_especie ? Number(formData.id_especie) : null,
        id_estado: formData.id_estado ? Number(formData.id_estado) : null,
        id_etapa: formData.id_etapa ? Number(formData.id_etapa) : null,
        peso: formData.peso ? Number(formData.peso) : null,
        propietario: formData.propietario || null,
        es_mestizo: Boolean(formData.es_mestizo),
        raza_padre: formData.raza_padre ? Number(formData.raza_padre) : null,
        raza_madre: formData.raza_madre ? Number(formData.raza_madre) : null,
        porcentaje_raza_principal: formData.porcentaje_raza_principal ? Number(formData.porcentaje_raza_principal) : null,
        edad_anos: formData.edad_anos ? Number(formData.edad_anos) : null,
        edad_meses: formData.edad_meses ? Number(formData.edad_meses) : null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
      };
      const url = savedId
        ? `${API_ROUTES.ANIMALES_CRUD}${savedId}`
        : API_ROUTES.ANIMALES_CRUD;
      const method = savedId ? 'put' : 'post';
      const { data } = await axiosInstance[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newId = data.id_animal || data.id || savedId;
      setSavedId(newId);
      Swal.fire('Éxito', savedId ? 'Animal actualizado' : 'Animal registrado', 'success');
      loadAnimals();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo guardar', 'error');
    }
  };

  const handleDelete = async (id) => {
    const targetId = id || savedId;
    if (!targetId) {
      Swal.fire('Info', 'No hay registro para eliminar', 'info');
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Seguro que deseas eliminar?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    try {
      await axiosInstance.delete(`${API_ROUTES.ANIMALES_CRUD}${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire('Eliminado', 'Animal eliminado', 'success');
      // Si el registro eliminado es el que está cargado en el formulario, limpiar
      if (savedId && String(savedId) === String(targetId)) {
        setFormData(emptyForm);
        setSavedId(null);
      }
      // Refrescar listado (o filtrar en memoria)
      setAnimals((prev) => prev.filter((x) => (x.id_animal || x.id) !== targetId));
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar', 'error');
    }
  };

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    doc.setFontSize(18);
    doc.text('Registro de Animal', 40, 40);

    const rows = [
      ['Identificador', formData.identificador_unico],
      ['Nombre', formData.nombre],
      ['Peso', `${formData.peso} kg`],
      ['Raza', lists.razas?.find((r) => r.id_raza == formData.id_raza)?.nombre || ''],
      ['Sexo', lists.sexos?.find((s) => s.id_sexo == formData.id_sexo)?.nombre || ''],
      ['Especie', lists.especies?.find((e) => e.id_especie == formData.id_especie)?.nombre || ''],
      ['Estado', lists.estados?.find((st) => st.id_estado == formData.id_estado)?.nombre_estado || ''],
      ['Hacienda', lists.haciendas?.find((h) => h.id_hacienda == formData.id_hacienda)?.nombre || ''],
      ['Etapa', lists.etapas?.find((et) => et.id_etapa == formData.id_etapa)?.nombre || ''],
      ['Observaciones', formData.observaciones || '-'],
    ];

    autoTable(doc, { startY: 60, head: [['Campo', 'Valor']], body: rows, theme: 'grid' });
    doc.save(`animal_${savedId || 'nuevo'}.pdf`);
  };

  /* ------------ render ------------ */
  const { razas = [], sexos = [], especies = [], estados = [], etapas = [], haciendas = [] } = lists;

  // Mapas auxiliares para etiquetas
  const especiesById = useMemo(() => {
    const map = new Map();
    (especies || []).forEach((e) => map.set(e.id_especie, e.nombre));
    return map;
  }, [especies]);
  const razasById = useMemo(() => {
    const map = new Map();
    (razas || []).forEach((r) => map.set(r.id_raza, r.nombre));
    return map;
  }, [razas]);
  const sexosById = useMemo(() => {
    const map = new Map();
    (sexos || []).forEach((s) => map.set(s.id_sexo, s.nombre));
    return map;
  }, [sexos]);
  const estadosById = useMemo(() => {
    const map = new Map();
    (estados || []).forEach((e) => map.set(e.id_estado, e.nombre_estado || e.nombre));
    return map;
  }, [estados]);
  const etapasById = useMemo(() => {
    const map = new Map();
    (etapas || []).forEach((et) => map.set(et.id_etapa, et.nombre));
    return map;
  }, [etapas]);
  const haciendasById = useMemo(() => {
    const map = new Map();
    (haciendas || []).forEach((h) => map.set(String(h.id_hacienda), h.nombre));
    return map;
  }, [haciendas]);

  const animalesFiltrados = useMemo(() => {
    return (animals || []).filter((a) => {
      const ident = (a.identificador_unico || '').toLowerCase();
      const nom = (a.nombre || '').toLowerCase();
      const esp = a.id_especie ? String(a.id_especie) : '';
      const passIdent = !filterIdent || ident.includes(filterIdent.toLowerCase());
      const passNom = !filterNombre || nom.includes(filterNombre.toLowerCase());
      const passEsp = !filterEspecie || esp === String(filterEspecie);
      return passIdent && passNom && passEsp;
    });
  }, [animals, filterIdent, filterNombre, filterEspecie]);

  const resetFilters = () => {
    setFilterIdent('');
    setFilterNombre('');
    setFilterEspecie('');
  };

  // Early returns AFTER hooks to satisfy rules-of-hooks
  if (loading) return <p>Cargando listas...</p>;
  if (error) return <p>Error cargando listas: {error}</p>;

  return (
    <div className="animal-container">
      <div className="animal-header">
        <h2>Registro de Animal</h2>
      </div>

      <div className="animal-form">
        {/* Identificación y Sexo */}
        <div className="form-row">
          <div className="form-group">
            <label><FaTag /> Identificador *</label>
            <input name="identificador_unico" value={formData.identificador_unico} onChange={handleChange} />
            {errors.identificador_unico && <span className="error-message">{errors.identificador_unico}</span>}
          </div>
          <div className="form-group">
            <label>Nombre *</label>
            <input name="nombre" value={formData.nombre} onChange={handleChange} />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>
        </div>

        {/* Sexo y Propietario */}
        <div className="form-row">
          <div className="form-group">
            <label><FaVenusMars /> Sexo *</label>
            <select name="id_sexo" value={formData.id_sexo} onChange={handleChange}>
              <option value="">Seleccione</option>
              {sexos.map((s) => <option key={s.id_sexo} value={s.id_sexo}>{s.nombre}</option>)}
            </select>
            {errors.id_sexo && <span className="error-message">{errors.id_sexo}</span>}
          </div>
          <div className="form-group">
            <label>Propietario</label>
            <select name="propietario" value={formData.propietario} onChange={handleChange}>
              <option value="">Seleccionar propietario...</option>
              {propietarios.map((propietario, index) => (
                <option key={index} value={propietario}>
                  {propietario}
                </option>
              ))}
            </select>
            {errors.propietario && <span className="error-message">{errors.propietario}</span>}
          </div>
        </div>

        {/* Especie y Raza */}
        <div className="form-row">
          <div className="form-group">
            <label><FaPaw /> Especie *</label>
            <select name="id_especie" value={formData.id_especie} onChange={handleChange}>
              <option value="">Seleccione</option>
              {especies.map((e) => <option key={e.id_especie} value={e.id_especie}>{e.nombre}</option>)}
            </select>
            {errors.id_especie && <span className="error-message">{errors.id_especie}</span>}
          </div>
          <div className="form-group">
            <label>Raza *</label>
            <select name="id_raza" value={formData.id_raza} onChange={handleChange}>
              <option value="">Seleccione</option>
              {razas.map((r) => <option key={r.id_raza} value={r.id_raza}>{r.nombre}</option>)}
            </select>
            {errors.id_raza && <span className="error-message">{errors.id_raza}</span>}
          </div>
        </div>

        {/* Peso y Mestizaje */}
        <div className="form-row">
          <div className="form-group">
            <label><FaWeight /> Peso (kg) *</label>
            <input type="number" step="0.01" name="peso" value={formData.peso} onChange={handleChange} />
            {errors.peso && <span className="error-message">{errors.peso}</span>}
          </div>
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                name="es_mestizo" 
                checked={formData.es_mestizo} 
                onChange={(e) => setFormData(p => ({...p, es_mestizo: e.target.checked}))}
                style={{marginRight: '8px'}}
              />
              Es mestizo
            </label>
          </div>
        </div>

        {/* Campos de mestizaje (condicionales) */}
        {formData.es_mestizo && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Raza del Padre</label>
                <select name="raza_padre" value={formData.raza_padre} onChange={handleChange}>
                  <option value="">Seleccione</option>
                  {razas.map((r) => <option key={r.id_raza} value={r.id_raza}>{r.nombre}</option>)}
                </select>
                {errors.raza_padre && <span className="error-message">{errors.raza_padre}</span>}
              </div>
              <div className="form-group">
                <label>Raza de la Madre</label>
                <select name="raza_madre" value={formData.raza_madre} onChange={handleChange}>
                  <option value="">Seleccione</option>
                  {razas.map((r) => <option key={r.id_raza} value={r.id_raza}>{r.nombre}</option>)}
                </select>
                {errors.raza_madre && <span className="error-message">{errors.raza_madre}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Porcentaje Raza Principal (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.01" 
                  name="porcentaje_raza_principal" 
                  value={formData.porcentaje_raza_principal} 
                  onChange={handleChange} 
                  placeholder="0-100"
                />
                {errors.porcentaje_raza_principal && <span className="error-message">{errors.porcentaje_raza_principal}</span>}
              </div>
            </div>
          </>
        )}

        {/* Edad detallada */}
        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Nacimiento</label>
            <input 
              type="date" 
              name="fecha_nacimiento" 
              value={formData.fecha_nacimiento} 
              onChange={handleChange}
            />
            {errors.fecha_nacimiento && <span className="error-message">{errors.fecha_nacimiento}</span>}
          </div>
          <div className="form-group">
            <label>Edad (Años) <small style={{color: '#666', fontStyle: 'italic'}}>*Se calcula automáticamente</small></label>
            <input 
              type="number" 
              min="0" 
              name="edad_anos" 
              value={formData.edad_anos} 
              readOnly
              placeholder="Se calcula automáticamente"
              style={{backgroundColor: '#f8f9fa', cursor: 'not-allowed'}}
            />
            {errors.edad_anos && <span className="error-message">{errors.edad_anos}</span>}
          </div>
          <div className="form-group">
            <label>Edad Total (Meses) <small style={{color: '#666', fontStyle: 'italic'}}>*Total de meses vividos</small></label>
            <input 
              type="number" 
              min="0" 
              name="edad_meses" 
              value={formData.edad_meses} 
              readOnly
              placeholder="Total de meses vividos"
              style={{backgroundColor: '#f8f9fa', cursor: 'not-allowed'}}
            />
            {errors.edad_meses && <span className="error-message">{errors.edad_meses}</span>}
          </div>
        </div>

        {/* Selecciones 3 */}
        <div className="form-row">
          <div className="form-group">
            <label><FaLeaf /> Hacienda *</label>
            <select name="id_hacienda" value={formData.id_hacienda} onChange={handleChange}>
              <option value="">Seleccione</option>
              {haciendas.map((h) => (
                <option key={h.id_hacienda} value={h.id_hacienda}>
                  {h.nombre}
                </option>
              ))}
            </select>
            {errors.id_hacienda && (
              <span className="error-message">{errors.id_hacienda}</span>
            )}
          </div>
          <div className="form-group">
            <label>Estado *</label>
            <select name="id_estado" value={formData.id_estado} onChange={handleChange}>
              <option value="">Seleccione</option>
              {estados.map((e) => (
                <option key={e.id_estado} value={e.id_estado}>
                  {e.nombre_estado || e.nombre}
                </option>
              ))}
            </select>
            {errors.id_estado && (
              <span className="error-message">{errors.id_estado}</span>
            )}
          </div>
          <div className="form-group">
            <label><FaBaby /> Etapa *</label>
            <select name="id_etapa" value={formData.id_etapa} onChange={handleChange}>
              <option value="">Seleccione</option>
              {etapas.map((et) => (
                <option key={et.id_etapa} value={et.id_etapa}>
                  {et.nombre}
                </option>
              ))}
            </select>
            {errors.id_etapa && (
              <span className="error-message">{errors.id_etapa}</span>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div className="form-row">
          <div className="form-group" style={{ flex: '1 1 100%' }}>
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              rows="3"
              value={formData.observaciones}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="animal-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Guardar
          </button>
          <button className="btn btn-info" onClick={handlePrint}>
            Imprimir
          </button>
          <button className="btn btn-success" onClick={handleDownload}>
            Descargar
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </div>

      {/* Listado de Animales (estilo Hacienda) */}
      <div className="hacienda-list">
        <h3>Información de Animales</h3>
        {listLoading && <p>Cargando registros...</p>}
        {listError && <p className="error-message">{listError}</p>}
        {!listLoading && !listError && (
          <>
            {/* Filtros */}
            <div className="filter-bar">
              <div className="filter-controls">
                <div className="filter-item">
                  <label>Identificador</label>
                  <input type="text" placeholder="Código o arete" value={filterIdent} onChange={(e)=>setFilterIdent(e.target.value)} />
                </div>
                <div className="filter-item">
                  <label>Nombre</label>
                  <input type="text" placeholder="Nombre" value={filterNombre} onChange={(e)=>setFilterNombre(e.target.value)} />
                </div>
                <div className="filter-item">
                  <label>Especie</label>
                  <select value={filterEspecie} onChange={(e)=>setFilterEspecie(e.target.value)}>
                    <option value="">Todas</option>
                    {especies.map((e)=> <option key={e.id_especie} value={e.id_especie}>{e.nombre}</option>)}
                  </select>
                </div>
                {/* Filtro por Hacienda removido por requerimiento */}
                <div className="filter-actions">
                  <button className="btn" onClick={resetFilters}>Reiniciar</button>
                </div>
              </div>
            </div>

            {/* Grid de tarjetas */}
            <div className="card-grid">
              {animalesFiltrados.length === 0 && (
                <div className="empty">Sin registros</div>
              )}
              {animalesFiltrados.map((a) => {
                const id = a.id_animal || a.id;
                return (
                  <div key={id} className="hacienda-card">
                    <div className="card-header">
                      <span className="chip">{id}</span>
                      <h4 className="card-title">{a.nombre || 'Sin nombre'}</h4>
                      <div className="card-subtitle">{especiesById.get(a.id_especie) || '-'}</div>
                    </div>
                    <div className="card-body">
                      <div className="info-row">
                        <FaTag className="icon" />
                        <span className="label">Identificador</span>
                        <span className="value">{a.identificador_unico || '-'}</span>
                      </div>
                      <div className="info-row">
                        <FaWeight className="icon" />
                        <span className="label">Peso</span>
                        <span className="value">{a.peso ?? '-'} kg</span>
                      </div>
                      <div className="info-row">
                        <FaLeaf className="icon" />
                        <span className="label">Hacienda</span>
                        <span className="value">{haciendasById.get(String(a.id_hacienda)) || '-'}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn btn-info"
                        onClick={() => {
                          setSelectedAnimal(a);
                          setShowModal(true);
                        }}
                      >Consultar</button>
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          setFormData({
                            identificador_unico: a.identificador_unico || '',
                            nombre: a.nombre || '',
                            peso: a.peso?.toString() || '',
                            propietario: a.propietario || '',
                            es_mestizo: Boolean(a.es_mestizo),
                            raza_padre: a.raza_padre?.toString() || '',
                            raza_madre: a.raza_madre?.toString() || '',
                            porcentaje_raza_principal: a.porcentaje_raza_principal?.toString() || '',
                            edad_anos: a.edad_anos?.toString() || '',
                            edad_meses: a.edad_meses?.toString() || '',
                            fecha_nacimiento: a.fecha_nacimiento || '',
                            observaciones: a.observaciones || '',
                            id_raza: a.id_raza?.toString() || '',
                            id_sexo: a.id_sexo?.toString() || '',
                            id_especie: a.id_especie?.toString() || '',
                            id_estado: a.id_estado?.toString() || '',
                            id_hacienda: a.id_hacienda?.toString() || '',
                            id_etapa: a.id_etapa?.toString() || '',
                          });
                          setErrors({});
                          setSavedId(id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >Actualizar</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(a.id_animal || a.id)}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Consulta */}
      {showModal && selectedAnimal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="animal-modal-title"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-header">
              <span className="chip">{selectedAnimal.identificador_unico || 'N/A'}</span>
              <h4 id="animal-modal-title">{selectedAnimal.nombre || 'Detalle de Animal'}</h4>
              <span className="muted">
                {selectedAnimal.propietario || 'Sin propietario'}
              </span>
            </div>

            <div className="modal-body">
              <hr className="modal-divider" />
              <ul className="detail-list">
                {/* Información Básica */}
                <li className="detail-item"><span className="label">Identificador</span><span className="value">{selectedAnimal.identificador_unico || '-'}</span></li>
                <li className="detail-item"><span className="label">Propietario</span><span className="value">{selectedAnimal.propietario || '-'}</span></li>
                <li className="detail-item"><span className="label">Hacienda</span><span className="value">{haciendasById.get(String(selectedAnimal.id_hacienda)) || '-'}</span></li>
                
                {/* Información Biológica */}
                <li className="detail-item"><span className="label">Especie</span><span className="value">{especiesById.get(selectedAnimal.id_especie) || '-'}</span></li>
                <li className="detail-item"><span className="label">Raza</span><span className="value">{razasById.get(selectedAnimal.id_raza) || '-'}</span></li>
                {selectedAnimal.es_mestizo && (
                  <>
                    <li className="detail-item"><span className="label">Mestizo</span><span className="value">Sí</span></li>
                    <li className="detail-item"><span className="label">Raza Padre</span><span className="value">{razasById.get(selectedAnimal.raza_padre) || '-'}</span></li>
                    <li className="detail-item"><span className="label">Raza Madre</span><span className="value">{razasById.get(selectedAnimal.raza_madre) || '-'}</span></li>
                    {selectedAnimal.porcentaje_raza_principal && (
                      <li className="detail-item"><span className="label">% Raza Principal</span><span className="value">{selectedAnimal.porcentaje_raza_principal}%</span></li>
                    )}
                  </>
                )}
                <li className="detail-item"><span className="label">Sexo</span><span className="value">{sexosById.get(selectedAnimal.id_sexo) || '-'}</span></li>
                
                {/* Información Física */}
                <li className="detail-item"><span className="label">Peso</span><span className="value">{selectedAnimal.peso ? `${selectedAnimal.peso} kg` : '-'}</span></li>
                {(selectedAnimal.edad_anos !== null && selectedAnimal.edad_anos !== undefined) && (
                  <li className="detail-item"><span className="label">Edad</span><span className="value">{selectedAnimal.edad_anos} años {selectedAnimal.edad_meses || 0} meses</span></li>
                )}
                {selectedAnimal.fecha_nacimiento && (
                  <li className="detail-item"><span className="label">Fecha Nacimiento</span><span className="value">{new Date(selectedAnimal.fecha_nacimiento).toLocaleDateString()}</span></li>
                )}
                
                {/* Estado y Etapa */}
                <li className="detail-item"><span className="label">Estado</span><span className="value">{estadosById.get(selectedAnimal.id_estado) || '-'}</span></li>
                <li className="detail-item"><span className="label">Etapa</span><span className="value">{etapasById.get(selectedAnimal.id_etapa) || '-'}</span></li>
                
                {/* Observaciones */}
                <li className="detail-item detail-item--full"><span className="label">Observaciones</span><span className="value">{selectedAnimal.observaciones || '-'}</span></li>
              </ul>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}