import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance, { API_ROUTES } from '../../api/axiosConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useAuth } from '../../AuthContext';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaAddressCard,
  FaPhone,
  FaRulerCombined,
} from 'react-icons/fa';
import './RegistrarHacienda.css';

const RegistrarHacienda = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  /* ---------- estado ---------- */
  const [formData, setFormData] = useState({
    nombre: '',
    tel_contacto: '',
    ubicacion: '',
    propietario: '',
    area: '',
    observaciones: '',
    latitud: '',
    longitud: '',
    id_departamento: '',
    id_municipio: '',
    id_usuario: '',
  });
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState(null);

  /* ---------- listado y modal ---------- */
  const [haciendas, setHaciendas] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedHacienda, setSelectedHacienda] = useState(null);

  /* ---------- listas para selects ---------- */
  const [lists, setLists] = useState({
    departamentos: [],
    municipios: [],
    usuarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorListas, setErrorListas] = useState(null);

  // filtros
  const [filterNombre, setFilterNombre] = useState('');
  const [filterUsuario, setFilterUsuario] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const [deps, muns, usrs] = await Promise.all([
          axiosInstance.get(API_ROUTES.DEPARTAMENTOS, cfg),
          axiosInstance.get(API_ROUTES.MUNICIPIOS, cfg),
          axiosInstance.get(API_ROUTES.USERS, cfg),
        ]);
        setLists({
          departamentos: deps.data,
          municipios: muns.data,
          usuarios: usrs.data,
        });
      } catch (err) {
        console.error('Error cargando listas:', err);
        setErrorListas(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  // Cargar listado de haciendas
  const loadHaciendas = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const { data } = await axiosInstance.get(API_ROUTES.HACIENDAS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = Array.isArray(data) ? data : (data?.items || []);
      // Si el endpoint de listado no trae campos de detalle, los completamos con GET por id
      const needsEnrich = items.some(
        (h) => h.tel_contacto === undefined && h.ubicacion === undefined && h.propietario === undefined
      );
      if (!needsEnrich) {
        setHaciendas(items);
      } else {
        const headers = { Authorization: `Bearer ${token}` };
        const enriched = await Promise.all(
          items.map(async (h) => {
            const id = h.id_hacienda || h.id;
            if (!id) return h;
            try {
              const { data: full } = await axiosInstance.get(`${API_ROUTES.HACIENDAS_CRUD}${id}`, { headers });
              return { ...h, ...full };
            } catch (_) {
              return h; // si falla, dejamos el item original
            }
          })
        );
        setHaciendas(enriched);
      }
    } catch (err) {
      console.error('Error cargando haciendas:', err);
      setListError(err.response?.data?.message || err.message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadHaciendas();
  }, [token]);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  /* ---------- handlers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };



  const handleSave = async () => {
    const required = [
      'nombre',
      'propietario',
      'tel_contacto',
      'ubicacion',
      'id_departamento',
      'id_municipio',
    ];
    const newErr = {};
    required.forEach((f) => {
      if (!formData[f] && formData[f] !== 0) newErr[f] = 'Requerido';
    });
    // Validaciones adicionales
    if (formData.area !== '' && !isNaN(formData.area)) {
      const a = parseFloat(formData.area);
      if (!(a > 0)) newErr.area = 'Debe ser > 0';
    } else if (formData.area !== '' && isNaN(formData.area)) {
      newErr.area = 'Debe ser numérico';
    }
    if (formData.latitud !== '') {
      const v = parseFloat(formData.latitud);
      if (isNaN(v) || v < -90 || v > 90) newErr.latitud = 'Latitud inválida (-90..90)';
    }
    if (formData.longitud !== '') {
      const v = parseFloat(formData.longitud);
      if (isNaN(v) || v < -180 || v > 180) newErr.longitud = 'Longitud inválida (-180..180)';
    }
    if (Object.keys(newErr).length) {
      console.log('Validation errors:', newErr);
      setErrors(newErr);
      return;
    }

    try {
      const url = savedId
        ? `${API_ROUTES.HACIENDAS_CRUD}${savedId}`
        : API_ROUTES.HACIENDAS_CRUD;
      const method = savedId ? 'put' : 'post';
      // Ensure numeric fields are numbers, not strings
      const payload = {
        ...formData,
        id_departamento: formData.id_departamento ? Number(formData.id_departamento) : null,
        id_municipio: formData.id_municipio ? Number(formData.id_municipio) : null,
        id_usuario: formData.id_usuario ? Number(formData.id_usuario) : null,
        area: formData.area === '' ? null : Number(formData.area),
        latitud: formData.latitud === '' ? null : Number(formData.latitud),
        longitud: formData.longitud === '' ? null : Number(formData.longitud),
      };
      
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      const res = await axiosInstance[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newId = res.data.id_hacienda || res.data.id || savedId;
      setSavedId(newId);
      Swal.fire('Éxito', savedId ? 'Hacienda actualizada' : 'Hacienda registrada', 'success');
      loadHaciendas();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo guardar', 'error');
    }
  };

  // Imprime la sección del formulario usando la ventana de impresión del navegador
  const handlePrint = () => {
    window.print();
  };

    // Descarga un PDF con mejor formato usando autoTable
  const handleDownload = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

    doc.setFontSize(18);
    doc.text('Registro de Hacienda', 40, 40);

    const rows = [
      ['Nombre', formData.nombre],
      ['Propietario', formData.propietario],
      ['Área (ha)', formData.area],
      ['Observaciones', formData.observaciones],
      ['Departamento', departamentos.find((d) => d.id_departamento == formData.id_departamento)?.nombre_departamento || ''],
      ['Municipio', municipios.find((m) => m.id_municipio == formData.id_municipio)?.nombre_municipio || ''],
      ['Ubicación', formData.ubicacion],
      ['Latitud', formData.latitud],
      ['Longitud', formData.longitud],
      ['Teléfono', formData.tel_contacto],
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Campo', 'Valor']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`hacienda_${savedId || 'nuevo'}.pdf`);
  };

    // Elimina la hacienda en backend (si se guardó) y limpia formulario con confirmación
  const handleDelete = async () => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Seguro que deseas eliminar?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    if (savedId) {
      try {
        await axiosInstance.delete(`${API_ROUTES.HACIENDAS_CRUD}${savedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire('Eliminado', 'Hacienda eliminada', 'success');
        loadHaciendas();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar', 'error');
        return;
      }
    }
    // Limpiar formulario local
    setFormData({
      nombre: '',
      tel_contacto: '',
      ubicacion: '',
      propietario: '',
      area: '',
      observaciones: '',
      latitud: '',
      longitud: '',
      id_departamento: '',
      id_municipio: '',
      id_usuario: '',
    });
    setErrors({});
    setSavedId(null);
  };

  /* ---------- render ---------- */
  let statusMsg = null;
  if (loading && Object.values(lists).every((arr) => arr.length === 0)) {
    statusMsg = 'Cargando listas...';
  } else if (errorListas) {
    statusMsg = `Error al cargar listas: ${errorListas}`;
  }

  const departamentos = lists.departamentos || [];
  const municipios = (lists.municipios || []).filter(
    (m) =>
      !formData.id_departamento || m.id_departamento === Number(formData.id_departamento)
  );
  const usuarios = lists.usuarios || [];
  const usersById = useMemo(() => {
    const map = new Map();
    (usuarios || []).forEach((u) => {
      const full = `${u.nombres || ''} ${u.apellidos || ''}`.trim();
      map.set(u.id_usuario, full || String(u.id_usuario));
    });
    return map;
  }, [usuarios]);

  const depsById = useMemo(() => {
    const map = new Map();
    (lists.departamentos || []).forEach((d) => map.set(d.id_departamento, d.nombre_departamento));
    return map;
  }, [lists.departamentos]);

  const munsById = useMemo(() => {
    const map = new Map();
    (lists.municipios || []).forEach((m) => map.set(m.id_municipio, m.nombre_municipio));
    return map;
  }, [lists.municipios]);

  const userNames = useMemo(() => (usuarios || []).map(u => `${u.nombres || ''} ${u.apellidos || ''}`.trim()).filter(Boolean), [usuarios]);

  const haciendasFiltradas = useMemo(() => {
    const byNombre = (h) =>
      !filterNombre || (h.nombre || '').toLowerCase().includes(filterNombre.toLowerCase());
    const byUsuario = (h) => {
      if (!filterUsuario) return true;
      const uname = usersById.get(h.id_usuario) || '';
      return uname.toLowerCase().includes(filterUsuario.toLowerCase());
    };
    return (haciendas || []).filter((h) => byNombre(h) && byUsuario(h));
  }, [haciendas, filterNombre, filterUsuario, usersById]);

  const resetFilters = () => { setFilterNombre(''); setFilterUsuario(''); };

  const handleDeleteCard = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar hacienda?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    try {
      await axiosInstance.delete(`${API_ROUTES.HACIENDAS_CRUD}${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire('Eliminado', 'Hacienda eliminada', 'success');
      await loadHaciendas();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar', 'error');
    }
  };

  return (
    <div className="hacienda-container">
      <div className="hacienda-header">
        {statusMsg && <div className="status-message">{statusMsg}</div>}
        <h2>
          Registro de Hacienda
        </h2>
      </div>

      <div className="hacienda-form">
        <h3 className="section-title">Información general</h3>
        <div className="form-row">
          <div className="form-group">
            <label>
              <FaBuilding /> Nombre Hacienda *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={errors.nombre ? 'error' : ''}
            />
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>
          <div className="form-group">
            <label>
              <FaAddressCard /> Propietario *
            </label>
            <input
              type="text"
              name="propietario"
              value={formData.propietario}
              onChange={handleChange}
              className={errors.propietario ? 'error' : ''}
            />
            {errors.propietario && (
              <span className="error-message">{errors.propietario}</span>
            )}
          </div>
        </div>

        <h3 className="section-title">Dimensiones</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Área (ha)</label>
            <input
              type="number"
              step="0.01"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className={errors.area ? 'error' : ''}
            />
            {errors.area && <span className="error-message">{errors.area}</span>}
          </div>
        </div>

        <h3 className="section-title">Coordenadas</h3>
        {/* lat/lon & mapa */}
        <div className="form-row">
          <div className="form-group">
            <label>Latitud</label>
            <input type="number" step="0.000001" name="latitud" value={formData.latitud} onChange={handleChange} className={errors.latitud ? 'error' : ''} />
            {errors.latitud && <span className="error-message">{errors.latitud}</span>}
          </div>
          <div className="form-group">
            <label>Longitud</label>
            <input type="number" step="0.000001" name="longitud" value={formData.longitud} onChange={handleChange} className={errors.longitud ? 'error' : ''} />
            {errors.longitud && <span className="error-message">{errors.longitud}</span>}
          </div>
        </div>
        {(formData.latitud !== '' && formData.longitud !== '' && !errors.latitud && !errors.longitud) && (
          <div className="map-preview" role="region" aria-label="Mapa de ubicación">
            <iframe
              title="Mapa"
              width="100%"
              height="300"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${encodeURIComponent(formData.latitud)},${encodeURIComponent(formData.longitud)}&zoom=15`}
            />
            <div className="muted" style={{ marginTop: 4 }}>
              <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(formData.latitud)}&mlon=${encodeURIComponent(formData.longitud)}#map=15/${encodeURIComponent(formData.latitud)}/${encodeURIComponent(formData.longitud)}`}>Abrir en OpenStreetMap</a>
            </div>
          </div>
        )}

        <h3 className="section-title">Observaciones</h3>
        <div className="form-row">
          <div className="form-group" style={{flex: 1}}>
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </div>

        

        {/* depto & municipio */}
        <div className="form-row">
          <div className="form-group">
            <label>
              <FaMapMarkerAlt /> Departamento *
            </label>
            <select
              name="id_departamento"
              value={formData.id_departamento}
              onChange={handleChange}
              className={errors.id_departamento ? 'error' : ''}
            >
              <option value="">Seleccione</option>
              {departamentos.map((d) => (
                <option key={d.id_departamento} value={d.id_departamento}>
                  {d.nombre_departamento}
                </option>
              ))}
            </select>
            {errors.id_departamento && (
              <span className="error-message">{errors.id_departamento}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <FaMapMarkerAlt /> Municipio *
            </label>
            <select
              name="id_municipio"
              value={formData.id_municipio}
              onChange={handleChange}
              className={errors.id_municipio ? 'error' : ''}
            >
              <option value="">Seleccione</option>
              {municipios.map((m) => (
                <option key={m.id_municipio} value={m.id_municipio}>
                  {m.nombre_municipio}
                </option>
              ))}
            </select>
            {errors.id_municipio && (
              <span className="error-message">{errors.id_municipio}</span>
            )}
          </div>
        </div>

        {/* usuario removido del UI a solicitud del usuario */}

        <h3 className="section-title">Ubicación</h3>
        {/* ubicación & teléfono */}
        <div className="form-row">
          <div className="form-group">
            <label>
              <FaMapMarkerAlt /> Ubicación *
            </label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className={errors.ubicacion ? 'error' : ''}
            />
            {errors.ubicacion && (
              <span className="error-message">{errors.ubicacion}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <FaPhone /> Teléfono *
            </label>
            <input
              type="tel"
              name="tel_contacto"
              value={formData.tel_contacto}
              onChange={handleChange}
              className={errors.tel_contacto ? 'error' : ''}
            />
            {errors.tel_contacto && (
              <span className="error-message">{errors.tel_contacto}</span>
            )}
          </div>
        </div>

        {/* acciones */}
        <div className="hacienda-actions">
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
            Limpiar
          </button>
        </div>
      </div>

      {/* listado de haciendas */}
      <div className="hacienda-list">
        <h3>Información de Haciendas</h3>
        {listLoading && <p>Cargando registros...</p>}
        {listError && <p className="error-message">{listError}</p>}
        {!listLoading && !listError && (
          <>
          <div className="filter-bar">
            <div className="filter-controls">
              <div className="filter-item">
                <label>Buscar hacienda</label>
                <input
                  type="text"
                  placeholder="Nombre de hacienda"
                  value={filterNombre}
                  onChange={(e) => setFilterNombre(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Usuario</label>
                <input
                  list="usuarios-suggest"
                  placeholder="Nombre de usuario"
                  value={filterUsuario}
                  onChange={(e) => setFilterUsuario(e.target.value)}
                />
                <datalist id="usuarios-suggest">
                  {userNames.map((n) => (<option key={n} value={n} />))}
                </datalist>
              </div>
              <div className="filter-actions">
                <button className="btn" onClick={resetFilters}>Reiniciar</button>
              </div>
            </div>
          </div>

          <div className="card-grid">
            {haciendas.length === 0 && (
              <div className="empty">Sin registros</div>
            )}
            {haciendasFiltradas.map((h) => {
              const id = h.id_hacienda || h.id;
              return (
                <div key={id} className="hacienda-card">
                  <div className="card-header">
                    <span className="chip">{id}</span>
                    <h4 className="card-title">{h.nombre || 'Sin nombre'}</h4>
                    <div className="card-subtitle" style={{color: 'white'}}>
                      <FaAddressCard className="icon" style={{marginRight: '5px', color: 'white'}} />
                      {h.propietario || 'Sin propietario'}
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <FaPhone className="icon" />
                      <span className="label">Teléfono</span>
                      <span className="value">{h.tel_contacto || '-'}</span>
                    </div>
                    <div className="info-row">
                      <FaMapMarkerAlt className="icon" />
                      <span className="label">Ubicación</span>
                      <span className="value">{h.ubicacion || '-'}</span>
                    </div>
                    <div className="info-row">
                      <FaRulerCombined className="icon" />
                      <span className="label">Área (ha)</span>
                      <span className="value">
                        {h.area ?? '-'}
                      </span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-info"
                      onClick={() => { setSelectedHacienda(h); setShowModal(true); }}
                    >Consultar</button>
                    <button
                      className="btn btn-warning"
                      onClick={() => {
                        setFormData({
                          nombre: h.nombre || '',
                          propietario: h.propietario || '',
                          tel_contacto: h.tel_contacto || '',
                          ubicacion: h.ubicacion || '',
                          area: (h.area ?? '') === '' ? '' : String(h.area),
                          observaciones: h.observaciones || '',
                          latitud: (h.latitud ?? '') === '' ? '' : String(h.latitud),
                          longitud: (h.longitud ?? '') === '' ? '' : String(h.longitud),
                          id_departamento: h.id_departamento?.toString() || '',
                          id_municipio: h.id_municipio?.toString() || '',
                          id_usuario: h.id_usuario?.toString() || '',
                        });
                        setErrors({});
                        setSavedId(id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >Actualizar</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCard(id)}
                    >Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {showModal && selectedHacienda && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hacienda-modal-title"
          onClick={() => setShowModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-header">
              <span className="chip">{selectedHacienda.id_hacienda || selectedHacienda.id}</span>
              <h4 id="hacienda-modal-title">{selectedHacienda.nombre || 'Detalle de Hacienda'}</h4>
              <span className="muted">
                <FaAddressCard className="icon" style={{marginRight: '5px'}} />
                {selectedHacienda.propietario || 'Sin propietario'}
              </span>
            </div>

            <div className="modal-body">
              <hr className="modal-divider" />
              <ul className="detail-list">
                <li className="detail-item"><span className="label">Propietario</span><span className="value">{selectedHacienda.propietario || '-'}</span></li>
                <li className="detail-item"><span className="label">Teléfono</span><span className="value">{selectedHacienda.tel_contacto || '-'}</span></li>
                <li className="detail-item"><span className="label">Ubicación</span><span className="value">{selectedHacienda.ubicacion || '-'}</span></li>
                <li className="detail-item"><span className="label">Área (ha)</span><span className="value">{selectedHacienda.area ?? '-'}</span></li>
                <li className="detail-item detail-item--full"><span className="label">Observaciones</span><span className="value">{selectedHacienda.observaciones || '-'}</span></li>
                <li className="detail-item"><span className="label">Coordenadas</span><span className="value">{(selectedHacienda.latitud != null && selectedHacienda.longitud != null) ? `${selectedHacienda.latitud}, ${selectedHacienda.longitud}` : '-'}</span></li>
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
};

export default RegistrarHacienda;