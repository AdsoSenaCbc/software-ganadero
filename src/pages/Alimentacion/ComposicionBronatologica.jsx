import React, { useState } from 'react';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/dist/sweetalert2.min.css';
import './ComposicionBronatologica.css';

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

  // Datos iniciales de ingredientes (15 ejemplos hipotéticos)
  const initialIngredientes = [
    { ingrediente: 'Maíz', materia_seca: 88.0, proteina_cruda: 9.0, energia_metabolizable: 3.3, fibra_cruda: 2.0, calcio: 0.03, fosforo: 0.3 },
    { ingrediente: 'Soja', materia_seca: 90.0, proteina_cruda: 44.0, energia_metabolizable: 3.2, fibra_cruda: 5.0, calcio: 0.25, fosforo: 0.6 },
    { ingrediente: 'Trigo', materia_seca: 87.0, proteina_cruda: 12.0, energia_metabolizable: 3.1, fibra_cruda: 2.5, calcio: 0.05, fosforo: 0.4 },
    { ingrediente: 'Alfalfa', materia_seca: 91.0, proteina_cruda: 18.0, energia_metabolizable: 2.4, fibra_cruda: 28.0, calcio: 1.4, fosforo: 0.3 },
    { ingrediente: 'Cebada', materia_seca: 89.0, proteina_cruda: 11.0, energia_metabolizable: 3.0, fibra_cruda: 4.5, calcio: 0.06, fosforo: 0.35 },
    { ingrediente: 'Sorgo', materia_seca: 86.0, proteina_cruda: 10.0, energia_metabolizable: 3.2, fibra_cruda: 2.8, calcio: 0.04, fosforo: 0.3 },
    { ingrediente: 'Harina de pescado', materia_seca: 92.0, proteina_cruda: 65.0, energia_metabolizable: 3.5, fibra_cruda: 1.0, calcio: 4.0, fosforo: 2.5 },
    { ingrediente: 'Salvado de trigo', materia_seca: 88.0, proteina_cruda: 15.0, energia_metabolizable: 2.6, fibra_cruda: 10.0, calcio: 0.1, fosforo: 1.0 },
    { ingrediente: 'Harina de maíz', materia_seca: 90.0, proteina_cruda: 8.5, energia_metabolizable: 3.4, fibra_cruda: 2.2, calcio: 0.02, fosforo: 0.25 },
    { ingrediente: 'Pasto elefante', materia_seca: 25.0, proteina_cruda: 8.0, energia_metabolizable: 2.0, fibra_cruda: 35.0, calcio: 0.5, fosforo: 0.2 },
    { ingrediente: 'Melaza', materia_seca: 75.0, proteina_cruda: 3.0, energia_metabolizable: 3.0, fibra_cruda: 0.0, calcio: 0.8, fosforo: 0.1 },
    { ingrediente: 'Harina de soya', materia_seca: 89.0, proteina_cruda: 48.0, energia_metabolizable: 3.3, fibra_cruda: 3.5, calcio: 0.3, fosforo: 0.7 },
    { ingrediente: 'Caña de azúcar', materia_seca: 30.0, proteina_cruda: 4.0, energia_metabolizable: 2.2, fibra_cruda: 30.0, calcio: 0.2, fosforo: 0.15 },
    { ingrediente: 'Harina de hueso', materia_seca: 95.0, proteina_cruda: 10.0, energia_metabolizable: 1.5, fibra_cruda: 0.0, calcio: 30.0, fosforo: 15.0 },
    { ingrediente: 'Avena', materia_seca: 89.0, proteina_cruda: 13.0, energia_metabolizable: 2.8, fibra_cruda: 9.0, calcio: 0.08, fosforo: 0.4 },
  ];

  // Estado para los ingredientes filtrados
  const [ingredientes, setIngredientes] = useState(initialIngredientes);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultar = () => {
    if (!formData.ingrediente.trim()) {
      Swal.fire({
        title: 'Advertencia',
        text: 'Por favor, ingrese el nombre del ingrediente para consultar',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      setIngredientes(initialIngredientes); // Restablecer la tabla si no hay filtro
      return;
    }

    const filteredIngredientes = initialIngredientes.filter((ing) =>
      ing.ingrediente.toLowerCase().includes(formData.ingrediente.toLowerCase())
    );

    if (filteredIngredientes.length === 0) {
      Swal.fire({
        title: 'Sin resultados',
        text: 'No se encontraron ingredientes que coincidan con la búsqueda',
        icon: 'info',
        confirmButtonText: 'Aceptar',
      });
    }

    setIngredientes(filteredIngredientes);
  };

  return (
    <div className="composicion-container">
      <div className="composicion-header">
        <h2>Composición Bromatológica</h2>
      </div>

      {/* Tabla de ingreso de datos */}
      <div className="input-section">
        <h3>Ingresar Ingrediente para Consultar</h3>
        <div className="input-table-container">
          <table className="input-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Materia Seca (%)</th>
                <th>Proteína Cruda (%)</th>
                <th>Energía Metabolizable (Mcal/kg)</th>
                <th>Fibra Cruda (%)</th>
                <th>Calcio (%)</th>
                <th>Fósforo (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    name="ingrediente"
                    value={formData.ingrediente}
                    onChange={handleChange}
                    placeholder="Ej: Maíz"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="materia_seca"
                    value={formData.materia_seca}
                    onChange={handleChange}
                    placeholder="Ej: 88.0"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="proteina_cruda"
                    value={formData.proteina_cruda}
                    onChange={handleChange}
                    placeholder="Ej: 9.0"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="energia_metabolizable"
                    value={formData.energia_metabolizable}
                    onChange={handleChange}
                    placeholder="Ej: 3.3"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="fibra_cruda"
                    value={formData.fibra_cruda}
                    onChange={handleChange}
                    placeholder="Ej: 2.0"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="calcio"
                    value={formData.calcio}
                    onChange={handleChange}
                    placeholder="Ej: 0.03"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="fosforo"
                    value={formData.fosforo}
                    onChange={handleChange}
                    placeholder="Ej: 0.3"
                    disabled
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={handleConsultar}>
            Consultar
          </button>
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
                <th>Materia Seca (%)</th>
                <th>Proteína Cruda (%)</th>
                <th>Energía Metabolizable (Mcal/kg)</th>
                <th>Fibra Cruda (%)</th>
                <th>Calcio (%)</th>
                <th>Fósforo (%)</th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((ing, index) => (
                <tr key={index}>
                  <td>{ing.ingrediente}</td>
                  <td>{ing.materia_seca}</td>
                  <td>{ing.proteina_cruda}</td>
                  <td>{ing.energia_metabolizable}</td>
                  <td>{ing.fibra_cruda}</td>
                  <td>{ing.calcio}</td>
                  <td>{ing.fosforo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComposicionBronatologica;