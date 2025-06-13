import React, { useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FaWarehouse, FaBox, FaList, FaCubes, FaBalanceScale, FaCalendarAlt, FaMapMarkerAlt, FaEdit, FaTrash, FaUtensils, FaDownload, FaHistory } from 'react-icons/fa';
import './Inventario.css';

// Componente para los botones de acción
const ActionButtons = ({ item, onConsultarIngredientes, onEdit, onDelete }) => (
  <>
    {item.categoria === 'Alimentos' && (
      <button className="btn-icon btn-info" onClick={() => onConsultarIngredientes(item.producto)}>
        <FaUtensils />
      </button>
    )}
    <button className="btn-icon btn-edit" onClick={() => onEdit(item)}>
      <FaEdit />
    </button>
    <button className="btn-icon btn-delete" onClick={() => onDelete(item.id_inventario)}>
      <FaTrash />
    </button>
  </>
);

const Inventario = () => {
  // Datos iniciales de haciendas (simulados, en un entorno real vendrían de la API)
  const haciendas = [
    { id: 1, nombre: 'Hacienda El Sol' },
    { id: 2, nombre: 'Hacienda La Luna' },
    { id: 3, nombre: 'Hacienda Estrella' },
  ];

  // Datos iniciales de inventario
  const initialInventario = [
    {
      id_inventario: 1,
      hacienda_id: 1,
      producto: 'Vacuna contra fiebre aftosa',
      categoria: 'Medicamentos',
      cantidad: 50,
      unidad: 'Dosis',
      fecha_entrada: '2025-01-15',
      fecha_caducidad: '2026-01-15',
      ubicacion: 'Bodega 1',
    },
    {
      id_inventario: 2,
      hacienda_id: 1,
      producto: 'Alimento balanceado',
      categoria: 'Alimentos',
      cantidad: 5, // Bajo stock para probar la alerta
      unidad: 'Kilogramos',
      fecha_entrada: '2025-02-01',
      fecha_caducidad: '',
      ubicacion: 'Estante A',
    },
    {
      id_inventario: 3,
      hacienda_id: 2,
      producto: 'Arete de identificación',
      categoria: 'Insumos',
      cantidad: 200,
      unidad: 'Unidades',
      fecha_entrada: '2025-03-10',
      fecha_caducidad: '',
      ubicacion: 'Bodega 2',
    },
  ];

  // Datos iniciales de composición bromatológica (simulados, vendrían de ComposicionBronatologica)
  const ingredientes = [
    { ingrediente: 'Maíz', materia_seca: 88.0, proteina_cruda: 9.0, energia_metabolizable: 3.3, fibra_cruda: 2.0, calcio: 0.03, fosforo: 0.3 },
    { ingrediente: 'Soja', materia_seca: 90.0, proteina_cruda: 44.0, energia_metabolizable: 3.2, fibra_cruda: 5.0, calcio: 0.25, fosforo: 0.6 },
    { ingrediente: 'Alfalfa', materia_seca: 91.0, proteina_cruda: 18.0, energia_metabolizable: 2.4, fibra_cruda: 28.0, calcio: 1.4, fosforo: 0.3 },
  ];

  // Estados del componente
  const [inventario, setInventario] = useState(initialInventario);
  const [formData, setFormData] = useState({
    hacienda_id: '',
    producto: '',
    categoria: '',
    cantidad: '',
    unidad: '',
    fecha_entrada: '',
    fecha_caducidad: '',
    ubicacion: '',
  });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('');
  const [movimientos, setMovimientos] = useState([]); // Historial de movimientos
  const [showMovimientos, setShowMovimientos] = useState(false); // Mostrar/ocultar historial
  const STOCK_THRESHOLD = 10; // Umbral para bajo stock

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    if (!formData.hacienda_id) newErrors.hacienda_id = 'La hacienda es requerida';
    if (!formData.producto.trim()) newErrors.producto = 'El producto es requerido';
    if (!formData.categoria.trim()) newErrors.categoria = 'La categoría es requerida';
    if (!formData.cantidad || Number(formData.cantidad) <= 0)
      newErrors.cantidad = 'La cantidad debe ser un número positivo';
    if (!formData.unidad.trim()) newErrors.unidad = 'La unidad es requerida';
    if (!formData.fecha_entrada) newErrors.fecha_entrada = 'La fecha de entrada es requerida';
    if (!formData.ubicacion.trim()) newErrors.ubicacion = 'La ubicación es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Agregar o actualizar un registro
  const handleAddOrUpdate = () => {
    if (!validateForm()) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, corrige los errores en el formulario',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const newCantidad = parseInt(formData.cantidad);
    const currentDate = new Date().toISOString().split('T')[0];

    if (editId !== null) {
      const previousItem = inventario.find((item) => item.id_inventario === editId);
      const cantidadDiferencia = newCantidad - previousItem.cantidad;
      setInventario((prev) =>
        prev.map((item) =>
          item.id_inventario === editId ? { ...item, ...formData, id_inventario: editId } : item
        )
      );

      if (cantidadDiferencia !== 0) {
        setMovimientos((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            producto: formData.producto,
            tipo: cantidadDiferencia > 0 ? 'Entrada' : 'Salida',
            cantidad: Math.abs(cantidadDiferencia),
            fecha: currentDate,
          },
        ]);
      }

      Swal.fire({
        title: 'Éxito',
        text: 'Registro de inventario actualizado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
      setEditId(null);
    } else {
      const newItem = {
        ...formData,
        id_inventario: inventario.length + 1,
        hacienda_id: parseInt(formData.hacienda_id),
        cantidad: newCantidad,
      };
      setInventario((prev) => [...prev, newItem]);

      setMovimientos((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          producto: formData.producto,
          tipo: 'Entrada',
          cantidad: newCantidad,
          fecha: currentDate,
        },
      ]);

      Swal.fire({
        title: 'Éxito',
        text: 'Registro de inventario agregado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
    }

    setFormData({
      hacienda_id: '',
      producto: '',
      categoria: '',
      cantidad: '',
      unidad: '',
      fecha_entrada: '',
      fecha_caducidad: '',
      ubicacion: '',
    });
    setErrors({});
  };

  // Editar un registro
  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id_inventario);
  };

  // Eliminar un registro
  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el registro de inventario. ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const deletedItem = inventario.find((item) => item.id_inventario === id);
        setInventario((prev) => prev.filter((item) => item.id_inventario !== id));

        setMovimientos((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            producto: deletedItem.producto,
            tipo: 'Salida',
            cantidad: deletedItem.cantidad,
            fecha: new Date().toISOString().split('T')[0],
          },
        ]);

        Swal.fire({
          title: 'Eliminado',
          text: 'El registro de inventario ha sido eliminado',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
      }
    });
  };

  // Consultar composición bromatológica
  const handleConsultarIngredientes = (producto) => {
    const ingredienteRelacionado = ingredientes.find((ing) =>
      producto.toLowerCase().includes(ing.ingrediente.toLowerCase())
    );

    if (ingredienteRelacionado) {
      Swal.fire({
        title: `Composición de ${producto}`,
        html: `
          <table class="swal-table">
            <tr><th>Ingrediente</th><td>${ingredienteRelacionado.ingrediente}</td></tr>
            <tr><th>Materia Seca (%)</th><td>${ingredienteRelacionado.materia_seca}</td></tr>
            <tr><th>Proteína Cruda (%)</th><td>${ingredienteRelacionado.proteina_cruda}</td></tr>
            <tr><th>Energía Metabolizable (Mcal/kg)</th><td>${ingredienteRelacionado.energia_metabolizable}</td></tr>
            <tr><th>Fibra Cruda (%)</th><td>${ingredienteRelacionado.fibra_cruda}</td></tr>
            <tr><th>Calcio (%)</th><td>${ingredienteRelacionado.calcio}</td></tr>
            <tr><th>Fósforo (%)</th><td>${ingredienteRelacionado.fosforo}</td></tr>
          </table>
        `,
        icon: 'info',
        confirmButtonText: 'Aceptar',
      });
    } else {
      Swal.fire({
        title: 'Sin información',
        text: `No se encontró información bromatológica para ${producto}`,
        icon: 'info',
        confirmButtonText: 'Aceptar',
      });
    }
  };

  // Exportar inventario
  const handleExport = () => {
    const data = JSON.stringify(inventario, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario.json';
    a.click();
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: 'Éxito',
      text: 'Inventario exportado correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
  };

  // Mostrar/ocultar historial de movimientos
  const toggleMovimientos = () => {
    setShowMovimientos((prev) => !prev);
  };

  const filteredInventario = inventario.filter(
    (item) =>
      item.producto.toLowerCase().includes(filter.toLowerCase()) ||
      item.categoria.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <h2>Gestión de Inventario</h2>
      </div>

      {/* Formulario de ingreso */}
      <div className="form-section">
        <h3>{editId !== null ? 'Editar Producto' : 'Agregar Producto'}</h3>
        <div className="form-row">
          <div className="form-group">
            <label><FaWarehouse /> Hacienda *</label>
            <select
              name="hacienda_id"
              value={formData.hacienda_id}
              onChange={handleChange}
              className={errors.hacienda_id ? 'error' : ''}
            >
              <option value="">Seleccione una hacienda</option>
              {haciendas.map((hacienda) => (
                <option key={hacienda.id} value={hacienda.id}>
                  {hacienda.nombre}
                </option>
              ))}
            </select>
            {errors.hacienda_id && <span className="error-message">{errors.hacienda_id}</span>}
          </div>
          <div className="form-group">
            <label><FaBox /> Producto *</label>
            <input
              type="text"
              name="producto"
              value={formData.producto}
              onChange={handleChange}
              className={errors.producto ? 'error' : ''}
            />
            {errors.producto && <span className="error-message">{errors.producto}</span>}
          </div>
          <div className="form-group">
            <label><FaList /> Categoría *</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={errors.categoria ? 'error' : ''}
            >
              <option value="">Seleccione una categoría</option>
              <option value="Medicamentos">Medicamentos</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Insumos">Insumos</option>
            </select>
            {errors.categoria && <span className="error-message">{errors.categoria}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaCubes /> Cantidad *</label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              className={errors.cantidad ? 'error' : ''}
            />
            {errors.cantidad && <span className="error-message">{errors.cantidad}</span>}
          </div>
          <div className="form-group">
            <label><FaBalanceScale /> Unidad *</label>
            <select
              name="unidad"
              value={formData.unidad}
              onChange={handleChange}
              className={errors.unidad ? 'error' : ''}
            >
              <option value="">Seleccione una unidad</option>
              <option value="Dosis">Dosis</option>
              <option value="Kilogramos">Kilogramos</option>
              <option value="Unidades">Unidades</option>
            </select>
            {errors.unidad && <span className="error-message">{errors.unidad}</span>}
          </div>
          <div className="form-group">
            <label><FaCalendarAlt /> Fecha Entrada *</label>
            <input
              type="date"
              name="fecha_entrada"
              value={formData.fecha_entrada}
              onChange={handleChange}
              className={errors.fecha_entrada ? 'error' : ''}
            />
            {errors.fecha_entrada && <span className="error-message">{errors.fecha_entrada}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><FaCalendarAlt /> Fecha Caducidad</label>
            <input
              type="date"
              name="fecha_caducidad"
              value={formData.fecha_caducidad}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label><FaMapMarkerAlt /> Ubicación *</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              className={errors.ubicacion ? 'error' : ''}
            />
            {errors.ubicacion && <span className="error-message">{errors.ubicacion}</span>}
          </div>
          <div className="form-group"></div> {/* Espacio vacío para alinear */}
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleAddOrUpdate}>
            {editId !== null ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="table-section">
        <div className="table-header-actions">
          <h3>Inventario Actual</h3>
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={handleExport}>
              <FaDownload /> Exportar
            </button>
            <button className="btn btn-secondary" onClick={toggleMovimientos}>
              <FaHistory /> {showMovimientos ? 'Ocultar Historial' : 'Mostrar Historial'}
            </button>
          </div>
        </div>
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filtrar por producto o categoría..."
            value={filter}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="table-container">
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Hacienda</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Fecha Entrada</th>
                <th>Fecha Caducidad</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventario.map((item) => {
                const isLowStock = item.cantidad <= STOCK_THRESHOLD;
                return (
                  <tr key={item.id_inventario} className={isLowStock ? 'low-stock' : ''}>
                    <td>{haciendas.find((h) => h.id === item.hacienda_id)?.nombre || 'N/A'}</td>
                    <td>{item.producto}</td>
                    <td>{item.categoria}</td>
                    <td>
                      {item.cantidad} {isLowStock && <span className="low-stock-label">(Bajo stock)</span>}
                    </td>
                    <td>{item.unidad}</td>
                    <td>{item.fecha_entrada}</td>
                    <td>{item.fecha_caducidad || 'N/A'}</td>
                    <td>{item.ubicacion}</td>
                    <td>
                      <ActionButtons
                        item={item}
                        onConsultarIngredientes={handleConsultarIngredientes}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de movimientos */}
      {showMovimientos && (
        <div className="movimientos-section">
          <h3>Historial de Movimientos</h3>
          <div className="table-container">
            <table className="movimientos-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov) => (
                  <tr key={mov.id}>
                    <td>{mov.producto}</td>
                    <td>{mov.tipo}</td>
                    <td>{mov.cantidad}</td>
                    <td>{mov.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;