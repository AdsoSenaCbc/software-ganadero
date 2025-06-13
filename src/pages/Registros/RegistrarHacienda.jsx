import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.js'; // Importación explícita
import 'sweetalert2/dist/sweetalert2.min.css'; // Importar estilos CSS
import { FaIdCard, FaBuilding, FaUser, FaMapMarkerAlt, FaAddressCard, FaPhone, FaTools } from 'react-icons/fa';
import { GiCow } from 'react-icons/gi';
import './RegistrarHacienda.css';

const RegistrarHacienda = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nit: '',
    nombre: '',
    propietario: '',
    localizacion: '',
    direccion: '',
    telefono: '',
    herraje: '',
    existencias_animales: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nit.trim()) newErrors.nit = 'El NIT es requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.propietario.trim()) newErrors.propietario = 'El propietario es requerido';
    if (!formData.localizacion.trim()) newErrors.localizacion = 'La localización es requerida';
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida';
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{7,10}$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe tener entre 7 y 10 dígitos';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      Swal.fire({
        title: 'Éxito',
        text: 'Hacienda registrada correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/registros/hacienda');
        }
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, corrige los errores en el formulario',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  const handlePrint = () => {
    Swal.fire({
      title: 'Imprimir',
      text: 'Imprimiendo registro de hacienda...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      window.print();
    });
  };

  const handleDownload = () => {
    Swal.fire({
      title: 'Descargar',
      text: 'Descargando registro de hacienda como PDF...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      const data = `Registro de Hacienda:\n${JSON.stringify(formData, null, 2)}`;
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registro_hacienda.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el registro de hacienda. ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminado',
          text: 'El registro de hacienda ha sido eliminado',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          setFormData({
            nit: '',
            nombre: '',
            propietario: '',
            localizacion: '',
            direccion: '',
            telefono: '',
            herraje: '',
            existencias_animales: '',
          });
          setErrors({});
        });
      }
    });
  };

  return (
    <div className="hacienda-container">
      <div className="hacienda-header">
        <h2>Registro de Hacienda</h2>
      </div>
      <div className="hacienda-form">
        <div className="form-row">
          <div className="form-group">
            <label><FaIdCard /> NIT *</label>
            <input
              type="text"
              name="nit"
              value={formData.nit}
              onChange={handleChange}
              className={errors.nit ? 'error' : ''}
            />
            {errors.nit && <span className="error-message">{errors.nit}</span>}
          </div>
          <div className="form-group">
            <label><FaBuilding /> Nombre *</label>
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
            <label><FaUser /> Propietario *</label>
            <input
              type="text"
              name="propietario"
              value={formData.propietario}
              onChange={handleChange}
              className={errors.propietario ? 'error' : ''}
            />
            {errors.propietario && <span className="error-message">{errors.propietario}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaMapMarkerAlt /> Localización *</label>
            <input
              type="text"
              name="localizacion"
              value={formData.localizacion}
              onChange={handleChange}
              className={errors.localizacion ? 'error' : ''}
            />
            {errors.localizacion && <span className="error-message">{errors.localizacion}</span>}
          </div>
          <div className="form-group">
            <label><FaAddressCard /> Dirección *</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className={errors.direccion ? 'error' : ''}
            />
            {errors.direccion && <span className="error-message">{errors.direccion}</span>}
          </div>
          <div className="form-group">
            <label><FaPhone /> Teléfono *</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={errors.telefono ? 'error' : ''}
            />
            {errors.telefono && <span className="error-message">{errors.telefono}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaTools /> Herraje</label>
            <input type="text" name="herraje" value={formData.herraje} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label><GiCow /> Existencias Animales</label>
            <input
              type="number"
              name="existencias_animales"
              value={formData.existencias_animales}
              onChange={handleChange}
            />
          </div>
          <div className="form-group"></div> {/* Espacio vacío para alinear */}
        </div>
      </div>
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
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default RegistrarHacienda;