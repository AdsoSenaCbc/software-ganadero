import React, { useState } from 'react';
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

  /* ------------ helpers ------------ */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
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
    if (formData.peso && (+formData.peso <= 0 || isNaN(formData.peso))) errs.peso = 'Debe ser > 0';
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
      };
      const { data } = await axiosInstance.post(API_ROUTES.ANIMALES_CRUD, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedId(data.id_animal || data.id);
      Swal.fire('Éxito', 'Animal registrado', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'No se pudo guardar', 'error');
    }
  };

  const handleDelete = async () => {
    if (!savedId) {
      Swal.fire('Info', 'No hay registro guardado para eliminar', 'info');
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
      await axiosInstance.delete(`${API_ROUTES.ANIMALES_CRUD}${savedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire('Eliminado', 'Animal eliminado', 'success');
      setFormData(emptyForm);
      setSavedId(null);
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
  if (loading) return <p>Cargando listas...</p>;
  if (error) return <p>Error cargando listas: {error}</p>;

  const { razas = [], sexos = [], especies = [], estados = [], etapas = [], haciendas = [] } = lists;

  return (
    <div className="animal-container">
      <h2>Registro de Animal</h2>

      {/* Identificación */}
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

      {/* Selecciones 1 */}
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

      {/* Selecciones 2 */}
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
          <label><FaWeight /> Peso (kg) *</label>
          <input type="number" name="peso" value={formData.peso} onChange={handleChange} />
          {errors.peso && <span className="error-message">{errors.peso}</span>}
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
  );
}