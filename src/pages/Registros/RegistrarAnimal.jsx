import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FaTag, FaLeaf, FaPaw, FaVenusMars, FaCalendarAlt, FaWeight, FaMale, FaFemale, FaBaby, FaClock } from 'react-icons/fa';
import './RegistrarAnimal.css';

const RegistrarAnimal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    arete: '',
    especie: '',
    raza: '',
    sexo: '',
    fecha_nacimiento: '',
    peso: '',
    padre: '',
    madre: '',
    ultimo_parto: '',
    dias_prijez: '',
    dias_secado: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.arete.trim()) newErrors.arete = 'El arete es requerido';
    if (!formData.especie.trim()) newErrors.especie = 'La especie es requerida';
    if (!formData.raza.trim()) newErrors.raza = 'La raza es requerida';
    if (!formData.sexo.trim()) newErrors.sexo = 'El sexo es requerido';
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    if (!formData.peso || isNaN(formData.peso) || Number(formData.peso) <= 0)
      newErrors.peso = 'El peso debe ser un número positivo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      Swal.fire({
        title: 'Éxito',
        text: 'Animal registrado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
      // No reseteamos formData ni navegamos, dejando al usuario en el formulario
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
      text: 'Imprimiendo registro de animal...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      window.print();
    });
  };

  const handleDownload = () => {
    Swal.fire({
      title: 'Descargar',
      text: 'Descargando registro de animal como PDF...',
      icon: 'info',
      confirmButtonText: 'Aceptar',
    }).then(() => {
      const data = `Registro de Animal:\n${JSON.stringify(formData, null, 2)}`;
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registro_animal.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const handleDelete = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el registro de animal. ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminado',
          text: 'El registro de animal ha sido eliminado',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        }).then(() => {
          setFormData({
            arete: '',
            especie: '',
            raza: '',
            sexo: '',
            fecha_nacimiento: '',
            peso: '',
            padre: '',
            madre: '',
            ultimo_parto: '',
            dias_prijez: '',
            dias_secado: '',
          });
          setErrors({});
        });
      }
    });
  };

  return (
    <div className="animal-container">
      <div className="animal-header">
        <h2>Registro de Animal</h2>
      </div>
      <div className="animal-form">
        <div className="form-row">
          <div className="form-group">
            <label><FaTag /> Arete *</label>
            <input
              type="text"
              name="arete"
              value={formData.arete}
              onChange={handleChange}
              className={errors.arete ? 'error' : ''}
            />
            {errors.arete && <span className="error-message">{errors.arete}</span>}
          </div>
          <div className="form-group">
            <label><FaLeaf /> Especie *</label>
            <input
              type="text"
              name="especie"
              value={formData.especie}
              onChange={handleChange}
              className={errors.especie ? 'error' : ''}
            />
            {errors.especie && <span className="error-message">{errors.especie}</span>}
          </div>
          <div className="form-group">
            <label><FaPaw /> Raza *</label>
            <input
              type="text"
              name="raza"
              value={formData.raza}
              onChange={handleChange}
              className={errors.raza ? 'error' : ''}
            />
            {errors.raza && <span className="error-message">{errors.raza}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaVenusMars /> Sexo *</label>
            <select name="sexo" value={formData.sexo} onChange={handleChange} className={errors.sexo ? 'error' : ''}>
              <option value="">Seleccione</option>
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
            {errors.sexo && <span className="error-message">{errors.sexo}</span>}
          </div>
          <div className="form-group">
            <label><FaCalendarAlt /> Fecha Nacimiento *</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              className={errors.fecha_nacimiento ? 'error' : ''}
            />
            {errors.fecha_nacimiento && <span className="error-message">{errors.fecha_nacimiento}</span>}
          </div>
          <div className="form-group">
            <label><FaWeight /> Peso (kg) *</label>
            <input
              type="number"
              name="peso"
              value={formData.peso}
              onChange={handleChange}
              className={errors.peso ? 'error' : ''}
            />
            {errors.peso && <span className="error-message">{errors.peso}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaMale /> Padre</label>
            <input type="text" name="padre" value={formData.padre} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label><FaFemale /> Madre</label>
            <input type="text" name="madre" value={formData.madre} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label><FaBaby /> Último Parto</label>
            <input
              type="date"
              name="ultimo_parto"
              value={formData.ultimo_parto}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaClock /> Días Preñez</label>
            <input type="text" name="dias_prijez" value={formData.dias_prijez} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label><FaClock /> Días Secado</label>
            <input type="text" name="dias_secado" value={formData.dias_secado} onChange={handleChange} />
          </div>
          <div className="form-group"></div> {/* Espacio vacío para alinear */}
        </div>
      </div>
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
};

export default RegistrarAnimal;