import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FaWarehouse, FaBox, FaList, FaCubes, FaBalanceScale, FaCalendarAlt, FaMapMarkerAlt, FaEdit, FaTrash, FaUtensils, FaDownload, FaHistory } from 'react-icons/fa';
import './Inventario.css';
import { apiUrl, authHeader } from '../../api/api';

// Componente para los botones de acción
const ActionButtons = ({ item, onConsultarIngredientes, onEdit, onDelete }) => (
  <>
    {item.categoria === 'Alimentos' && (
      <button className="btn-icon btn-info" onClick={() => onConsultarIngredientes(item)}>
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
  // Estados cargados desde API
  const [haciendas, setHaciendas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [ingredientesList, setIngredientesList] = useState([]); // para vincular id_ingrediente cuando categoría = Alimentos

  // Estados del componente
  const [formData, setFormData] = useState({
    hacienda_id: '',
    producto: '',
    categoria: '',
    cantidad: '',
    unidad: '',
    fecha_entrada: '',
    fecha_caducidad: '',
    ubicacion: '',
    id_ingrediente: ''
  });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('');
  const [movimientos, setMovimientos] = useState([]); // Historial de movimientos
  const [showMovimientos, setShowMovimientos] = useState(false); // Mostrar/ocultar historial
  const STOCK_THRESHOLD = 10; // Umbral para bajo stock

  // Cargar datos iniciales desde el backend
  useEffect(() => {
    const loadAll = async () => {
      try {
        const headers = authHeader();
        if (!headers.Authorization) {
          await Swal.fire({
            title: 'Sesión requerida',
            text: 'Debes iniciar sesión para gestionar el inventario.',
            icon: 'warning',
            confirmButtonText: 'Ir a Iniciar Sesión'
          });
          if (typeof window !== 'undefined') window.location.href = '/login';
          return;
        }
        const common = { headers };
        const [respH, respI, respIng] = await Promise.all([
          fetch(apiUrl('/api/haciendas/'), common),
          fetch(apiUrl('/api/inventario/api'), common),
          fetch(apiUrl('/api/ingredientes/api'), common)
        ]);
        const isJSON = (r) => (r.headers.get('content-type') || '').includes('application/json');
        if (!respH.ok || !isJSON(respH)) throw new Error('Error cargando haciendas');
        if (!respI.ok || !isJSON(respI)) throw new Error('Error cargando inventario');
        if (!respIng.ok || !isJSON(respIng)) throw new Error('Error cargando ingredientes');
        const [hList, invList, ingList] = await Promise.all([respH.json(), respI.json(), respIng.json()]);
        setHaciendas(Array.isArray(hList) ? hList : []);
        setInventario(Array.isArray(invList) ? invList : []);
        setIngredientesList(Array.isArray(ingList) ? ingList : []);
      } catch (e) {
        console.error('Error cargando datos de inventario:', e);
        Swal.fire({ title: 'Error', text: 'No fue posible cargar datos de inventario.', icon: 'error' });
      }
    };
    loadAll();
  }, []);

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
    if (formData.categoria === 'Alimentos' && !formData.id_ingrediente) {
      // opcional pero recomendado
      // newErrors.id_ingrediente = 'Seleccione el ingrediente relacionado (opcional)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Agregar o actualizar un registro
  const handleAddOrUpdate = async () => {
    if (!validateForm()) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, corrige los errores en el formulario',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    const headers = { 'Content-Type': 'application/json', ...authHeader() };
    const payload = {
      hacienda_id: parseInt(formData.hacienda_id),
      producto: formData.producto,
      categoria: formData.categoria,
      cantidad: parseInt(formData.cantidad),
      unidad: formData.unidad,
      fecha_entrada: formData.fecha_entrada,
      fecha_caducidad: formData.fecha_caducidad || null,
      ubicacion: formData.ubicacion,
      id_ingrediente: formData.id_ingrediente ? parseInt(formData.id_ingrediente) : null,
    };
    try {
      if (editId !== null) {
        const resp = await fetch(apiUrl(`/api/inventario/api/${editId}`), { method: 'PUT', headers, body: JSON.stringify(payload) });
        if (!resp.ok) throw new Error('No se pudo actualizar');
        Swal.fire({ title: 'Éxito', text: 'Registro de inventario actualizado correctamente', icon: 'success' });
        setEditId(null);
      } else {
        const resp = await fetch(apiUrl('/api/inventario/api'), { method: 'POST', headers, body: JSON.stringify(payload) });
        if (!resp.ok) throw new Error('No se pudo crear');
        Swal.fire({ title: 'Éxito', text: 'Registro de inventario agregado correctamente', icon: 'success' });
      }
      // Recargar listado
      const listResp = await fetch(apiUrl('/api/inventario/api'), { headers: authHeader() });
      if (listResp.ok) setInventario(await listResp.json());
    } catch (e) {
      console.error(e);
      Swal.fire({ title: 'Error', text: 'No fue posible guardar el registro.', icon: 'error' });
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
      id_ingrediente: ''
    });
    setErrors({});
  };

  // Editar un registro
  const handleEdit = (item) => {
    setFormData({
      hacienda_id: item.hacienda_id?.toString() || '',
      producto: item.producto || '',
      categoria: item.categoria || '',
      cantidad: item.cantidad?.toString() || '',
      unidad: item.unidad || '',
      fecha_entrada: item.fecha_entrada || '',
      fecha_caducidad: item.fecha_caducidad || '',
      ubicacion: item.ubicacion || '',
      id_ingrediente: item.id_ingrediente ? String(item.id_ingrediente) : ''
    });
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
        const headers = authHeader();
        fetch(apiUrl(`/api/inventario/api/${id}`), { method: 'DELETE', headers })
          .then((resp) => {
            if (!resp.ok) throw new Error('Delete failed');
            return fetch(apiUrl('/api/inventario/api'), { headers: authHeader() });
          })
          .then((r) => r.ok ? r.json() : [])
          .then((list) => {
            setInventario(Array.isArray(list) ? list : []);
            Swal.fire({ title: 'Eliminado', text: 'El registro de inventario ha sido eliminado', icon: 'success', confirmButtonText: 'Aceptar' });
          })
          .catch(() => Swal.fire({ title: 'Error', text: 'No fue posible eliminar el registro.', icon: 'error' }));
      }
    });
  };

  // Consultar composición bromatológica
  const handleConsultarIngredientes = async (item) => {
    try {
      const headers = authHeader();
      const [respNut, respCar, respIng] = await Promise.all([
        fetch(apiUrl('/api/nutrientes/api'), { headers }),
        fetch(apiUrl('/api/caracteristicas-nutricionales/api'), { headers }),
        fetch(apiUrl('/api/ingredientes/api'), { headers })
      ]);
      const [nuts, cars, ings] = await Promise.all([respNut.json(), respCar.json(), respIng.json()]);
      // Seleccionar ingrediente por id_ingrediente o por nombre aproximado
      let iid = item.id_ingrediente;
      if (!iid) {
        const found = (Array.isArray(ings) ? ings : []).find((g) => String(item.producto || '').toLowerCase().includes(String(g.nombre || '').toLowerCase()));
        iid = found?.id_ingrediente;
      }
      if (!iid) {
        Swal.fire({ title: 'Sin información', text: `No se encontró información bromatológica para ${item.producto}`, icon: 'info' });
        return;
      }
      const byNutriente = {};
      (Array.isArray(cars) ? cars : []).forEach((c) => {
        if (c.id_ingrediente === iid) byNutriente[c.id_nutriente] = c.valor;
      });
      const rowsHtml = (Array.isArray(nuts) ? nuts : [])
        .sort((a,b)=> String(a.abreviatura||a.nombre||'').localeCompare(String(b.abreviatura||b.nombre||'')))
        .map((n) => {
          const key = n.id_nutriente;
          const label = `${n.abreviatura || n.nombre}${n.unidad ? ` (${n.unidad})` : ''}`;
          const val = byNutriente[key] != null ? Number(byNutriente[key]).toFixed(2) : '-';
          return `<tr><th style="text-align:left;">${label}</th><td style="text-align:right;">${val}</td></tr>`;
        })
        .join('');
      const ingName = (Array.isArray(ings) ? ings : []).find((g)=>g.id_ingrediente===iid)?.nombre || item.producto;
      Swal.fire({
        title: `Composición de ${ingName}`,
        html: `<div style="max-height:420px; overflow:auto;"><table class="swal-table" style="width:100%">${rowsHtml}</table></div>`,
        icon: 'info',
        confirmButtonText: 'Aceptar',
        width: 600
      });
    } catch (e) {
      console.error(e);
      Swal.fire({ title: 'Error', text: 'No fue posible consultar la composición.', icon: 'error' });
    }
  };

  // Exportar inventario a PDF (tabla)
  const handleExport = () => {
    try {
      // Mapea hacienda_id a nombre si está disponible
      const haciendaMap = new Map(haciendas.map(h => [String(h.id_hacienda ?? h.id), h.nombre ?? h.hacienda ?? `ID ${h.id_hacienda ?? h.id}`]));

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
      const title = 'Inventario';
      doc.setFontSize(16);
      doc.text(title, 40, 40);

      const headers = [
        { header: 'ID', dataKey: 'id_inventario' },
        { header: 'Hacienda', dataKey: 'hacienda' },
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Categoría', dataKey: 'categoria' },
        { header: 'Cantidad', dataKey: 'cantidad' },
        { header: 'Unidad', dataKey: 'unidad' },
        { header: 'F. Entrada', dataKey: 'fecha_entrada' },
        { header: 'F. Caducidad', dataKey: 'fecha_caducidad' },
        { header: 'Ubicación', dataKey: 'ubicacion' },
      ];

      const rows = (inventario || []).map(it => ({
        id_inventario: it.id_inventario,
        hacienda: haciendaMap.get(String(it.hacienda_id)) || (it.hacienda_id ?? ''),
        producto: it.producto || '',
        categoria: it.categoria || '',
        cantidad: it.cantidad ?? '',
        unidad: it.unidad || '',
        fecha_entrada: it.fecha_entrada || '',
        fecha_caducidad: it.fecha_caducidad || '',
        ubicacion: it.ubicacion || '',
      }));

      autoTable(doc, {
        head: [headers.map(h => h.header)],
        body: rows.map(r => headers.map(h => r[h.dataKey])),
        // Márgenes y posición para evitar solaparse con el título y que quepa en la página
        startY: 60,
        margin: { top: 60, right: 20, bottom: 30, left: 20 },
        // Ajustes para que el contenido se acomode y haga wrap si es largo
        tableWidth: 'wrap',
        styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: [0, 75, 115], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        // Asignar anchos pequeños fijos a columnas estrechas; las demás harán wrap automáticamente
        columnStyles: {
          0: { cellWidth: 40 },  // ID
          4: { cellWidth: 55 },  // Cantidad
          5: { cellWidth: 60 },  // Unidad
          6: { cellWidth: 80 },  // F. Entrada
          7: { cellWidth: 80 },  // F. Caducidad
        },
        didDrawPage: (data) => {
          // Footer con fecha y número de página
          const pageSize = doc.internal.pageSize;
          const pageWidth = pageSize.getWidth();
          const y = pageSize.getHeight() - 20;
          doc.setFontSize(8);
          const now = new Date();
          const foot = `Exportado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()} | Página ${doc.internal.getNumberOfPages()}`;
          doc.text(foot, pageWidth - 40, y, { align: 'right' });
        }
      });

      doc.save('inventario.pdf');
      Swal.fire({ title: 'Éxito', text: 'Inventario exportado a PDF', icon: 'success', confirmButtonText: 'Aceptar' });
    } catch (e) {
      console.error('PDF export error:', e);
      Swal.fire({ title: 'Error', text: 'No fue posible exportar a PDF. Verifica dependencias.', icon: 'error' });
    }
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
          {formData.categoria === 'Alimentos' && (
            <div className="form-group">
              <label><FaUtensils /> Ingrediente (BD)</label>
              <select name="id_ingrediente" value={formData.id_ingrediente} onChange={handleChange}>
                <option value="">Sin vincular</option>
                {ingredientesList.map((ing) => (
                  <option key={ing.id_ingrediente} value={ing.id_ingrediente}>
                    {ing.nombre} {ing.tipo ? `- ${ing.tipo}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
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