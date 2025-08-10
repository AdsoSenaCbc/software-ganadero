import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance, { API_ROUTES } from '../../api/axiosConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useAuth } from '../../AuthContext';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  FaBuilding,
  FaUser,
  FaMapMarkerAlt,
  FaAddressCard,
  FaPhone,
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
    descripcion: '',
    id_departamento: '',
    id_municipio: '',
    id_usuario: '',
  });
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState(null);

  /* ---------- listas para selects ---------- */
  const [lists, setLists] = useState({
    departamentos: [],
    municipios: [],
    usuarios: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorListas, setErrorListas] = useState(null);

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

  /* ---------- handlers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };



  const handleSave = async () => {
    const required = [
      'nombre',
      'tel_contacto',
      'ubicacion',
      'id_departamento',
      'id_municipio',
      'id_usuario',
    ];
    const newErr = {};
    required.forEach((f) => {
      if (!formData[f]) newErr[f] = 'Requerido';
    });
    if (Object.keys(newErr).length) {
      setErrors(newErr);
      return;
    }

    try {
      const res = await axiosInstance.post(API_ROUTES.HACIENDAS_CRUD, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedId(res.data.id_hacienda || res.data.id);
      Swal.fire('Éxito', 'Hacienda registrada', 'success');
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
      ['Descripción', formData.descripcion],
      ['Departamento', departamentos.find((d) => d.id_departamento == formData.id_departamento)?.nombre_departamento || ''],
      ['Municipio', municipios.find((m) => m.id_municipio == formData.id_municipio)?.nombre_municipio || ''],
      ['Usuario', usuarios.find((u) => u.id_usuario == formData.id_usuario)?.nombres || ''],
      ['Ubicación', formData.ubicacion],
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
      descripcion: '',
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

  return (
    <div className="hacienda-container">
      <div className="hacienda-header">
        {statusMsg && <div className="status-message">{statusMsg}</div>}
        <h2>
          Registro de Hacienda
        </h2>
      </div>

      <div className="hacienda-form">
        {/* nombre & descripción */}
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
              <FaAddressCard /> Descripción
            </label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className={errors.descripcion ? 'error' : ''}
            />
            {errors.descripcion && (
              <span className="error-message">{errors.descripcion}</span>
            )}
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

        {/* usuario */}
        <div className="form-row">
          <div className="form-group">
            <label>
              <FaUser /> ID Usuario *
            </label>
            <select
              name="id_usuario"
              value={formData.id_usuario}
              onChange={handleChange}
              className={errors.id_usuario ? 'error' : ''}
            >
              <option value="">Seleccione</option>
              {usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {`${u.nombres} ${u.apellidos}`}
                </option>
              ))}
            </select>
            {errors.id_usuario && (
              <span className="error-message">{errors.id_usuario}</span>
            )}
          </div>
        </div>

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
    </div>
  );
};

export default RegistrarHacienda;