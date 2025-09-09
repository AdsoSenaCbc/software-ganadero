import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionesLactancia.css';
 

import { GiMeal, GiCow } from 'react-icons/gi';
import { MdBolt } from 'react-icons/md';
import { apiUrl, authHeader } from '../../api/api';

/******************************* Helpers *******************************/
const initialForm = {
  id_animal: '',
  id_requerimiento: '',
  fecha_calculo: '',
  ms_total: '',
  peso: '',
  produccion_leche: '',
  grasa_pct: '',
  calculado_por: '',
  observaciones: '',
};

const emptyResults = {
  infoAnimal: {},
  requerimientosEnergeticos: {},
  requerimientosProteicos: {},
};

/**
 * -----------------------------
 * Helper formatters (module-scope)
 * -----------------------------
 */
// Etiquetas enriquecidas para selects de requerimientos
const fmtReqLabel = (r) => {
  if (!r) return '';
  if (r.descripcion) return r.descripcion;
  const parts = [];
  if (r.etapa || r.id_etapa) parts.push(`Etapa ${r.etapa ?? r.id_etapa}`);
  if (r.peso_min != null || r.peso_max != null) parts.push(`Peso ${r.peso_min ?? '?'}–${r.peso_max ?? '?'} kg`);
  const em = r.EM ?? r.em ?? r.energia_metabolizable;
  const pc = r.PC ?? r.pc ?? r.proteina_cruda ?? r.proteina_total;
  const ms = r.MS ?? r.ms ?? r.materia_seca;
  if (em != null) parts.push(`EM ${em}`);
  if (pc != null) parts.push(`PC ${pc} g`);
  if (ms != null) parts.push(`MS ${ms} kg`);
  return parts.join(' · ') || `Req ${r.id_requerimiento}`;
};

// Etiquetas para usuarios
const fmtUserLabel = (u) => {
  if (!u) return '';
  const nombre = u.nombre || u.nombres || u.first_name || '';
  const apellido = u.apellido || u.apellidos || u.last_name || '';
  const full = [nombre, apellido].filter(Boolean).join(' ').trim();
  return full || u.username || u.email || `Usuario ${u.id || u.id_usuario}`;
};

// Etiquetas para animales
const fmtAnimalLabel = (a) => {
  if (!a) return '';
  const nombre = a.nombre || a.identificador_unico || a.codigo || `Animal ${a.id}`;
  const etapa = a.etapa || (a.id_etapa != null ? `Etapa ${a.id_etapa}` : '');
  const cat = a.categoria || '';
  const extra = [etapa, cat].filter(Boolean).join(' · ');
  return extra ? `${nombre} (${extra})` : nombre;
};

// Formateador numérico seguro
const fmt = (v, d = 2) => (v === null || v === undefined || isNaN(v)) ? '-' : Number(v).toFixed(d);

const ResultCard = ({ title, icon, children }) => (
  <div className="result-card" data-aos="zoom-in">
    <div className="result-header">
      {icon}
      <h3>{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

/******************************* Component *******************************/
const RacionesLactancia = () => {
  const resultsRef = React.useRef(null);
  const [formData, setFormData] = useState(initialForm);
  const [animales, setAnimales] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ingredientesDisp, setIngredientesDisp] = useState([]);
  const [ingredientesSel, setIngredientesSel] = useState([]); // ids seleccionados
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [results, setResults] = useState(emptyResults);
  // Tanteo: kg tal cual (base húmeda) por ingrediente seleccionado
  const [kilosPorIng, setKilosPorIng] = useState({}); // { [id_ingrediente]: string|number }
  const [tanteoError, setTanteoError] = useState(null);
  
  const [loading, setLoading] = useState(false); // carga inicial de selects
  const [calculating, setCalculating] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [guardar, setGuardar] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [compactView, setCompactView] = useState(true);

  /* -------- Fetch select data on mount -------- */
  useEffect(() => {
    const fetchSelectData = async () => {
      setLoading(true);
      try {
        const headers = authHeader();
        const [aRes, rRes, uRes, iRes] = await Promise.all([
          fetch(apiUrl('/api/animals/'), { headers }),
          fetch(apiUrl('/api/requerimientos-nutricionales/api'), { headers }),
          fetch(apiUrl('/api/users/api'), { headers }),
          fetch(apiUrl('/api/ingredientes/api'), { headers }),
        ]);

        const safeJson = async (res) => {
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return null;
          try { return await res.json(); } catch { return null; }
        };


        if (aRes.ok) {
          const data = await safeJson(aRes);
          setAnimales(Array.isArray(data) ? data : []);
        } else if (aRes.status === 401) {
          setApiError('No autorizado. Inicie sesión nuevamente.');
        }

        if (rRes.ok) {
          const data = await safeJson(rRes);
          setRequerimientos(Array.isArray(data) ? data : []);
        }

        if (uRes.ok) {
          const data = await safeJson(uRes);
          setUsuarios(Array.isArray(data) ? data : []);
        }
        if (iRes.ok) {
          const data = await safeJson(iRes);
          // Normalizar campos: esperamos id_ingrediente y nombre
          setIngredientesDisp(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error cargando selects', err);
        setApiError('Error de red al cargar catálogos.');
      } finally {
        setLoading(false);
      }
    };
    fetchSelectData();
    AOS.init({ duration: 700 });
  }, []);

  /* -------- Handlers -------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de selección de ingredientes (definido en el scope del componente)
  const toggleIngrediente = (id) => {
    setIngredientesSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setKilosPorIng((prev) => {
      const next = { ...prev };
      if (prev[id] == null) next[id] = '';
      return next;
    });
  };
  const seleccionarTodos = () => {
    setIngredientesSel(ingredientesDisp.map((i) => i.id_ingrediente));
  };
  const limpiarSeleccion = () => {
    setIngredientesSel([]);
    setKilosPorIng({});
  };
  const handleKgChange = (id, val) => {
    // Guardar como string para permitir edición libre, pero convertir a número al usar
    setKilosPorIng((prev) => ({ ...prev, [id]: val }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCalculating(true);
    setApiError(null);
    setTanteoError(null);
    // Preparar ingredientes (tanteo) -> inclusion_pct según ms_total, convirtiendo kg tal cual a kg MS usando ms_pct
    let ingredientesPayload = [];
    const msTotalNum = parseFloat(formData.ms_total);
    const selIds = ingredientesSel || [];
    if (selIds.length && !isNaN(msTotalNum) && msTotalNum > 0) {
      // sumar kg ingresados (solo valores válidos > 0)
      const pares = selIds.map((id) => ({ id, kg_af: parseFloat(kilosPorIng?.[id]) }))
        .filter((p) => !isNaN(p.kg_af) && p.kg_af > 0);
      // Convertir a kg MS por ingrediente usando ms_pct del catálogo
      const paresMs = pares.map((p) => {
        const ingInfo = ingredientesDisp.find((x) => x.id_ingrediente === p.id);
        const ms_pct = typeof ingInfo?.ms_pct === 'number' ? ingInfo.ms_pct : 100; // fallback 100% MS si no hay dato
        const ms_frac = Math.max(0, Math.min(1, ms_pct / 100));
        const kg_ms = p.kg_af * ms_frac;
        return { id: p.id, kg_af: p.kg_af, kg_ms };
      });
      const sumaAf = paresMs.reduce((acc, p) => acc + p.kg_af, 0);
      const sumaMs = paresMs.reduce((acc, p) => acc + p.kg_ms, 0);
      if (sumaMs > 0) {
        if (sumaMs - msTotalNum > 1e-6) {
          setCalculating(false);
          setTanteoError(`La suma de kg MS calculada (${sumaMs.toFixed(3)} kg) excede la MS total (${msTotalNum.toFixed(3)} kg).`);
          return;
        }
        ingredientesPayload = paresMs.map((p) => ({
          id_ingrediente: p.id,
          inclusion_pct: (p.kg_ms / msTotalNum) * 100.0,
        }));
      }
    }
    try {
      // Resolver peso a enviar: usar el ingresado o el del animal seleccionado
      const selAnimal = animales.find(a => String(a.id) === String(formData.id_animal));
      const pesoNum = parseFloat(formData.peso ?? '');
      const pesoToSend = !isNaN(pesoNum) ? pesoNum : (typeof selAnimal?.peso === 'number' ? selAnimal.peso : undefined);
      if (pesoToSend === undefined) {
        setCalculating(false);
        setApiError('El animal no tiene peso registrado y no se ingresó un peso manual. Ingrese el peso (kg).');
        return;
      }
      const response = await fetch(apiUrl('/api/raciones/api/calcular'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          etapa: 'lactancia',
          id_animal: formData.id_animal || undefined,
          id_requerimiento: formData.id_requerimiento || undefined,
          fecha_calculo: formData.fecha_calculo || undefined,
          ms_total: formData.ms_total || undefined,
          calculado_por: formData.calculado_por || undefined,
          observaciones: formData.observaciones || undefined,
          peso: pesoToSend,
          produccion_leche: formData.produccion_leche,
          grasa_pct: formData.grasa_pct,
          guardar,
          optimizar: true,
          ingredientes_ids: ingredientesSel.map((v) => parseInt(v, 10)).filter((n) => !isNaN(n)),
          ingredientes: ingredientesPayload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error del servidor');
      setResults(data);
      // Mensaje simple de guardado
      if (data.saved) {
        setSaveMsg(`Cálculo guardado. ID ración: ${data.id_racion}`);
        setTimeout(() => setSaveMsg(''), 4000);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  // Exportar PDF (organizado)
  const handleExportPDF = async () => {
    const r = results || {};
    const animal = animales.find(a => String(a.id) === String(formData.id_animal));
    const reqSel = requerimientos.find(rr => String(rr.id_requerimiento || rr.id) === String(formData.id_requerimiento));
    const userSel = usuarios.find(u => String(u.id || u.id_usuario) === String(formData.calculado_por));
    const animalLabel = animal ? fmtAnimalLabel(animal) : '-';
    const reqLabel = reqSel ? fmtReqLabel(reqSel) : '-';
    const userLabel = userSel ? fmtUserLabel(userSel) : '-';
    const fecha = formData.fecha_calculo || new Date().toISOString().slice(0,10);

    const styles = `
      * { box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; color: #0b2533; margin: 24px; }
      h1 { margin: 0 0 14px; font-size: 22px; }
      h2 { margin: 18px 0 10px; font-size: 16px; }
      .meta, .tbl { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
      .meta th, .meta td, .tbl th, .tbl td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: left; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
      .kv { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .right { text-align: right; }
      .muted { color: #64748b; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 11px; background:#eef2ff; color:#3730a3; }
      .ok { background:#dcfce7; color:#166534; }
      .bad { background:#fee2e2; color:#991b1b; }
      @media print { .no-print { display: none; } }
    `;

    const animalInfo = `
      <div class="box">
        <h2>Animal</h2>
        <table class="tbl">
          <tr><th>Identificación</th><td>${animalLabel}</td></tr>
          <tr><th>Peso</th><td>${fmt(r.infoAnimal?.peso, 1)} kg</td></tr>
          <tr><th>Leche</th><td>${fmt(r.infoAnimal?.produccion_de_leche, 2)} kg/d</td></tr>
          <tr><th>Grasa en leche</th><td>${fmt(r.infoAnimal?.grasa_en_leche, 1)} %</td></tr>
        </table>
      </div>`;

    const reqsEner = r.requerimientosEnergeticos || {};
    const reqsProt = r.requerimientosProteicos || {};
    const tot = (r.racion_optima && r.racion_optima.totales) || {};
    const cump = (r.racion_optima && r.racion_optima.cumplimiento) || {};

    const compRows = [
      { grupo: 'Energía', label: 'EM (Mcal)', req: reqsEner.energia_metabolizable, ap: tot.EM, d: 2 },
      { grupo: 'Energía', label: 'EN (Mcal)', req: reqsEner.energia_neta, ap: tot.EN, d: 2 },
      { grupo: 'Energía', label: 'ED (Mcal)', req: reqsEner.energia_digestible, ap: tot.ED, d: 2 },
      { grupo: 'Energía', label: 'TND (kg)', req: reqsEner.tnd, ap: tot.TND, d: 3 },
      { grupo: 'Proteínas', label: 'PT (g)', req: reqsProt.proteina_total, ap: (tot.PT ?? tot.PC), d: 0 },
      { grupo: 'Proteínas', label: 'PD (g)', req: reqsProt.proteina_digestible, ap: tot.PD, d: 0 },
      { grupo: 'Proteínas', label: 'MS (kg)', req: reqsProt.materia_seca, ap: tot.MS, d: 3 },
    ];
    const compTable = `
      <div class="box">
        <h2>Requerimientos vs Aportes</h2>
        <table class="tbl">
          <thead><tr><th>Nutriente</th><th class="right">Requerido</th><th class="right">Aporte</th></tr></thead>
          <tbody>
            ${compRows.map(row => `
              <tr>
                <td>${row.grupo} — ${row.label}</td>
                <td class="right">${fmt(row.req, row.d)}</td>
                <td class="right">${fmt(row.ap, row.d)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    const sol = (r.racion_optima && r.racion_optima.solucion) || [];
    const solTable = `
      <div class="box">
        <h2>Ración óptima (kg MS por ingrediente)</h2>
        <table class="tbl">
          <thead>
            <tr><th>Ingrediente</th><th class="right">Kg MS</th><th class="right">EM (Mcal)</th><th class="right">PC (g)</th></tr>
          </thead>
          <tbody>
            ${sol.length ? sol.map(it => `
              <tr>
                <td>${it.nombre}</td>
                <td class="right">${fmt(it.kg_ms)}</td>
                <td class="right">${fmt(it.em_aporte)}</td>
                <td class="right">${fmt(it.pc_aporte_g)}</td>
              </tr>
            `).join('') : `<tr><td colspan="4" class="muted">Sin solución</td></tr>`}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th class="right">${fmt(tot.MS)}</th>
              <th class="right">${fmt(tot.EM)}</th>
              <th class="right">${fmt(tot.PC)}</th>
            </tr>
          </tfoot>
        </table>
        <div class="kv">
          <div><span class="muted">Totales extendidos</span></div>
          <div class="right">EN ${fmt(tot.EN)} · ED ${fmt(tot.ED)} · TND ${fmt(tot.TND)}</div>
        </div>
        <div class="kv">
          <div><span class="muted">Cumplimiento</span></div>
          <div class="right">
            <span class="badge ${cump.EM ? 'ok' : 'bad'}">EM</span>
            <span class="badge ${cump.PC ? 'ok' : 'bad'}">PC</span>
            <span class="badge ${cump.MS ? 'ok' : 'bad'}">MS</span>
          </div>
        </div>
      </div>`;

    const header = `
      <h1>Ración Lactancia</h1>
      <table class="meta">
        <tr><th>Animal</th><td>${animalLabel}</td><th>Requerimiento</th><td>${reqLabel}</td></tr>
        <tr><th>Calculado por</th><td>${userLabel}</td><th>Fecha</th><td>${fecha}</td></tr>
      </table>
    `;

    const layout = `
      ${header}
      <div class="grid">
        ${animalInfo}
        ${compTable}
      </div>
      ${solTable}
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Ración Lactancia</title><style>${styles}</style></head><body>`);
    win.document.write(layout);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  /* -------- JSX -------- */
  return (
    <div className="raciones-lactancia-container">
      <h1 className="raciones-title">Gestión de Raciones – Lactancia</h1>

      {/* Paso 1 & 2 */}
      <section className="raciones-form" data-aos="fade-up">
        <h2>Registro de Ración</h2>
        <form onSubmit={handleSubmit}>
          {/* Selección */}
          <fieldset className="raciones-step" data-aos="fade-right">
            <legend>1. Selección de datos</legend>
            <div className="grid-responsive">
              <div className="form-group">
                <label>Animal</label>
                <select name="id_animal" value={formData.id_animal} onChange={handleChange} required disabled={loading || calculating}>
                  <option value="" disabled>
                    {loading ? 'Cargando…' : animales.length === 0 ? 'Sin registros' : '-- Seleccione --'}
                  </option>
                  {animales
                    .filter((a) => {
                      // Mostrar solo animales de Lactancia si el dato existe
                      if (a && a.id_etapa != null) return Number(a.id_etapa) === 1;
                      if (a && a.etapa) return String(a.etapa).toLowerCase() === 'lactancia';
                      if (a && a.categoria) return String(a.categoria).toLowerCase().includes('lactancia');
                      return true; // si no hay campo de etapa, no filtramos
                    })
                    .map((a) => (
                      <option key={a.id} value={a.id}>{fmtAnimalLabel(a)}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Requerimiento</label>
                <select name="id_requerimiento" value={formData.id_requerimiento} onChange={handleChange} required disabled={loading || calculating}>
                  <option value="" disabled>
                    {loading ? 'Cargando…' : requerimientos.length === 0 ? 'Sin registros' : '-- Seleccione --'}
                  </option>
                  {requerimientos
                    .filter((r) => Number(r.id_etapa) === 1)
                    .map((r) => (
                    <option key={r.id_requerimiento} value={r.id_requerimiento}>{fmtReqLabel(r)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Calculado por</label>
                <select name="calculado_por" value={formData.calculado_por} onChange={handleChange} required disabled={loading || calculating}>
                  <option value="" disabled>
                    {loading ? 'Cargando…' : usuarios.length === 0 ? 'Sin registros' : '-- Seleccione --'}
                  </option>
                  {usuarios.map((u) => (
                    <option key={u.id_usuario ?? u.id} value={(u.id_usuario ?? u.id)}>{fmtUserLabel(u)}</option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Ingredientes disponibles */}
          <fieldset className="raciones-step" data-aos="fade-right">
            <legend>Ingredientes disponibles</legend>
            <div className="form-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="secondary-btn" onClick={seleccionarTodos} disabled={ingredientesDisp.length === 0}>Seleccionar todos</button>
              <button type="button" className="secondary-btn" onClick={limpiarSeleccion} disabled={ingredientesSel.length === 0}>Limpiar selección</button>
              <input
                type="text"
                placeholder="Buscar ingrediente..."
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                style={{ flex: '1 1 240px', minWidth: 200, padding: '0.45rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </div>
            {ingredientesDisp.length === 0 ? (
              <p className="muted">No hay ingredientes en el catálogo.</p>
            ) : (
              <div className="ingredientes-grid">
                {(ingredientesDisp.filter((ing) => {
                  const q = ingredientSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(ing.id_ingrediente).includes(q) ||
                    (ing.nombre || '').toLowerCase().includes(q)
                  );
                })).map((ing) => (
                  <div key={ing.id_ingrediente} className={`check-item ${ingredientesSel.includes(ing.id_ingrediente) ? 'checked' : ''}`}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <input type="checkbox" checked={ingredientesSel.includes(ing.id_ingrediente)} onChange={() => toggleIngrediente(ing.id_ingrediente)} />
                      <span>
                        {ing.nombre} <span className="muted">(ID {ing.id_ingrediente})</span>
                        {ing.costo_kg != null && (
                          <span className="pill" style={{ marginLeft: 8 }}>Costo ${Number(ing.costo_kg).toFixed(2)}/kg</span>
                        )}
                      </span>
                    </label>
                    {ingredientesSel.includes(ing.id_ingrediente) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <label className="muted" style={{ fontSize: 12 }}>Kg (tal cual):</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={kilosPorIng[ing.id_ingrediente] ?? ''}
                          onChange={(e) => handleKgChange(ing.id_ingrediente, e.target.value)}
                          style={{ width: 110, padding: '0.35rem 0.5rem' }}
                        />
                        {typeof ing.ms_pct === 'number' && (
                          <span className="muted" style={{ fontSize: 12 }}>MS {Number(ing.ms_pct).toFixed(1)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="muted">La optimización usará únicamente los ingredientes seleccionados. Seleccionados: {ingredientesSel.length}</p>
            {(() => {
              const msNum = parseFloat(formData.ms_total);
              const ids = ingredientesSel || [];
              const pares = ids.map((id) => ({ id, kg_af: parseFloat(kilosPorIng?.[id]) }))
                .filter((p) => !isNaN(p.kg_af) && p.kg_af > 0);
              const sumaAf = pares.reduce((a, p) => a + p.kg_af, 0);
              // convertir a MS con ms_pct
              const sumaMs = pares.reduce((acc, p) => {
                const ingInfo = ingredientesDisp.find((x) => x.id_ingrediente === p.id);
                const ms_pct = typeof ingInfo?.ms_pct === 'number' ? ingInfo.ms_pct : 100;
                const ms_frac = Math.max(0, Math.min(1, ms_pct / 100));
                return acc + p.kg_af * ms_frac;
              }, 0);
              if (isNaN(msNum) || msNum <= 0) return (
                <div className="pill" style={{ marginTop: 8 }}>
                  Suma tanteo: {sumaAf.toFixed(3)} kg tal cual · MS estimada: {sumaMs.toFixed(3)} kg
                </div>
              );
              const restanteMs = msNum - sumaMs;
              return (
                <div className={`pill ${restanteMs + 1e-6 >= 0 ? 'ok' : 'bad'}`} style={{ marginTop: 8 }}>
                  Suma tanteo: {sumaAf.toFixed(3)} kg tal cual · MS estimada: {sumaMs.toFixed(3)} kg · Restante MS: {restanteMs.toFixed(3)} kg
                </div>
              );
            })()}
            {tanteoError && (<p className="error" style={{ marginTop: 6 }}>{tanteoError}</p>)}
          </fieldset>

          {/* Parámetros */}
          <fieldset className="raciones-step" data-aos="fade-right">
            <legend>3. Parámetros de cálculo</legend>
            <div className="grid-responsive">
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  placeholder={() => {
                    const a = animales.find(x => String(x.id) === String(formData.id_animal));
                    return a && typeof a.peso === 'number' ? String(a.peso) : '';
                  }}
                />
                {(() => {
                  const a = animales.find(x => String(x.id) === String(formData.id_animal));
                  if (a && typeof a.peso === 'number' && (formData.peso === '' || isNaN(parseFloat(formData.peso)))) {
                    return (<small className="muted">Usando peso del animal: {Number(a.peso).toFixed(1)} kg si no ingresa uno.</small>);
                  }
                  return null;
                })()}
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" name="fecha_calculo" value={formData.fecha_calculo} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Materia Seca (kg)</label>
                <input type="number" step="0.01" name="ms_total" value={formData.ms_total} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Producción de leche (kg/día)</label>
                <input
                  type="number"
                  step="0.01"
                  name="produccion_leche"
                  value={formData.produccion_leche}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>% Grasa en leche</label>
                <input
                  type="number"
                  step="0.1"
                  name="grasa_pct"
                  value={formData.grasa_pct}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
              <textarea name="observaciones" rows="3" value={formData.observaciones} onChange={handleChange} />
            </div>
          </fieldset>

          <div className="actions-row">
            <label className="toggle">
              <input type="checkbox" checked={guardar} onChange={(e) => setGuardar(e.target.checked)} /> Guardar cálculo
            </label>
            <button className="submit-btn" type="submit" disabled={calculating || ingredientesSel.length === 0}>
              {calculating ? 'Calculando…' : 'Calcular y (opcional) Guardar'}
            </button>
          </div>
        </form>
      </section>

      {/* Mensajes */}
      {apiError && <p className="warn">Error: {apiError}</p>}
      {saveMsg && <p className="success">{saveMsg}</p>}

      {/* Resultados */}
      {!calculating && Object.keys(results.infoAnimal).length > 0 && (
        <section className="raciones-results" data-aos="fade-up">
          <h2>Resultados</h2>
          <div ref={resultsRef}>
          <div className="card-grid rich">
            <ResultCard title="Animal" icon={<GiCow className="result-icon" />}>
              <p><span className="badge">Peso</span> {Number(results.infoAnimal.peso || 0).toFixed(1)} kg</p>
              <p><span className="badge">Leche</span> {Number(results.infoAnimal.produccion_de_leche || 0).toFixed(2)} kg/d</p>
              <p><span className="badge">Grasa</span> {Number(results.infoAnimal.grasa_en_leche || 0).toFixed(1)} %</p>
            </ResultCard>
            <ResultCard title="Energía" icon={<MdBolt className="result-icon" />}>
              <p>EN: <strong>{results.requerimientosEnergeticos.energia_neta ?? '-'}</strong></p>
              <p>ED: <strong>{results.requerimientosEnergeticos.energia_digestible ?? '-'}</strong></p>
              <p>EM: <strong className="highlight">{results.requerimientosEnergeticos.energia_metabolizable ?? '-'}</strong></p>
              <p>TND: <strong>{results.requerimientosEnergeticos.tnd ?? '-'}</strong></p>
            </ResultCard>
            <ResultCard title="Proteínas" icon={<GiMeal className="result-icon" />}>
              <div className="kv">
                <span>PT:</span>
                <span>{results.requerimientosProteicos.proteina_total ?? '-'}</span>
              </div>
              <div className="kv">
                <span>PD:</span>
                <span>{results.requerimientosProteicos.proteina_digestible ?? '-'}</span>
              </div>
              <div className="kv">
                <span>MS:</span>
                <span>{results.requerimientosProteicos.materia_seca ?? '-'}</span>
              </div>
            </ResultCard>
          </div>
          {/* Comparativo Requerimientos vs Aportes de la mezcla */}
          {results?.infoAnimal && (results.requerimientosEnergeticos || results.requerimientosProteicos) && (
            <ResultCard title="Requerimientos vs Aportes (mezcla óptima)">
              <div className="comp-controls">
                <label className="toggle"><input type="checkbox" checked={compactView} onChange={(e)=>setCompactView(e.target.checked)} />Vista compacta</label>
              </div>
              {(() => {
                const r = results;
                 
                const meta = {
                  EM: { tip: 'Energía metabolizable diaria requerida o aportada por la mezcla.' },
                  EN: { tip: 'Energía neta estimada a partir de EM.' },
                  ED: { tip: 'Energía digestible estimada a partir de EM.' },
                  TND:{ tip: 'Total de nutrientes digestibles (kg) estimado.' },
                  PT: { tip: 'Proteína total (g/día).' },
                  PD: { tip: 'Proteína digestible estimada (g/día).' },
                  MS: { tip: 'Materia seca total de la ración (kg/día).' },
                };
                const rows = [
                  { block:'Energía', key: 'EM', label: 'EM (Mcal)', req: r.requerimientosEnergeticos?.energia_metabolizable, ap: r.racion_optima?.totales?.EM, d: 2 },
                  { block:'Energía', key: 'EN', label: 'EN (Mcal)', req: r.requerimientosEnergeticos?.energia_neta, ap: r.racion_optima?.totales?.EN, d: 2 },
                  { block:'Energía', key: 'ED', label: 'ED (Mcal)', req: r.requerimientosEnergeticos?.energia_digestible, ap: r.racion_optima?.totales?.ED, d: 2 },
                  { block:'Energía', key: 'TND', label: 'TND (kg)', req: r.requerimientosEnergeticos?.tnd, ap: r.racion_optima?.totales?.TND, d: 3 },
                  { block:'Proteínas', key: 'PT', label: 'PT (g)', req: r.requerimientosProteicos?.proteina_total, ap: (r.racion_optima?.totales?.PT ?? r.racion_optima?.totales?.PC), d: 0 },
                  { block:'Proteínas', key: 'PD', label: 'PD (g)', req: r.requerimientosProteicos?.proteina_digestible, ap: r.racion_optima?.totales?.PD, d: 0 },
                  { block:'Proteínas', key: 'MS', label: 'MS (kg)', req: r.requerimientosProteicos?.materia_seca, ap: r.racion_optima?.totales?.MS, d: 3 },
                ];
                const eps = 1e-3;
                const blocks = ['Energía','Proteínas'];
                const blockStatus = (b) => {
                  const set = rows.filter(x=>x.block===b);
                  const valids = set.filter(x=>x.req!=null && !isNaN(x.req) && x.ap!=null && !isNaN(x.ap));
                  if (!valids.length) return null;
                  const allOk = valids.every(x=> Number(x.ap)+eps >= Number(x.req));
                  return allOk;
                };
                return (
                  <div className="comp-table">
                    <div className="comp-head">
                      <div>Nutriente</div>
                      <div>Requerido</div>
                      <div>Aporte</div>
                      <div>Estado</div>
                    </div>
                    <div className="comp-body">
                      {blocks.map((b)=> (
                        <React.Fragment key={`block-${b}`}>
                          <div className="comp-row comp-subhead">
                            <div className="comp-cell comp-nutriente">
                              {b}
                              {blockStatus(b) === null ? (
                                <span className="badge" style={{marginLeft:8}}>s/datos</span>
                              ) : (
                                <span className={`badge ${blockStatus(b) ? 'badge-ok' : 'badge-bad'}`} style={{marginLeft:8}}>
                                  {blockStatus(b) ? 'Cumple global' : 'No cumple global'}
                                </span>
                              )}
                            </div>
                            <div className="comp-cell"></div>
                            <div className="comp-cell"></div>
                            <div className="comp-cell"></div>
                          </div>
                          {rows.filter(x=>x.block===b).map((row) => {
                            const hasReq = row.req !== null && row.req !== undefined && !isNaN(row.req);
                            const hasAp = row.ap !== null && row.ap !== undefined && !isNaN(row.ap);
                            const ok = hasReq && hasAp ? (Number(row.ap) + eps >= Number(row.req)) : false;
                            const diff = (hasReq && hasAp) ? (Number(row.ap) - Number(row.req)) : null;
                            const pct = (hasReq && hasAp && Number(row.req)>0) ? Math.max(0, Math.min(100, (Number(row.ap)/Number(row.req))*100)) : null;
                            return (
                              <div className="comp-row" key={row.key}>
                                <div className="comp-cell comp-nutriente" title={meta[row.key]?.tip}>{row.label}</div>
                                <div className="comp-cell comp-req">{fmt(row.req, row.d)}</div>
                                <div className="comp-cell comp-ap">
                                  {fmt(row.ap, row.d)}
                                  {!compactView && pct !== null && (
                                    <div className="progress"><div className={`progress-bar ${ok?'':'bad'}`} style={{width: `${pct}%`}} /></div>
                                  )}
                                </div>
                                <div className="comp-cell comp-status">
                                  {hasReq && hasAp ? (
                                    <span className={`badge ${ok ? 'badge-ok' : 'badge-bad'}`}>
                                      {ok ? 'Cumple' : 'Bajo'}{diff !== null ? ` (${diff >= 0 ? '+' : ''}${fmt(diff, row.d)})` : ''}
                                    </span>
                                  ) : (
                                    <span className="badge">-</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </ResultCard>
          )}
          {results?.racion_optima && (
            <ResultCard title={`Ración óptima ${results.racion_optima?.objetivo === 'costo' ? '(min costo)' : '(min MS)'} (kg MS por ingrediente)`}>
              {/* Estado global */}
              {results.racion_optima?.status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className={`pill ${results.racion_optima.status === 'Optimal' ? 'ok' : 'bad'}`}>
                    {results.racion_optima.status}
                  </span>
                  {results.racion_optima?.objetivo && (
                    <span className="pill" title="Objetivo de optimización">
                      {results.racion_optima.objetivo === 'costo' ? 'Min costo' : 'Min MS'}
                    </span>
                  )}
                </div>
              )}
              {results.racion_optima?.message && (
                <p className="error" style={{ marginTop: 8 }}>{results.racion_optima.message}</p>
              )}

              {/* Ingredientes considerados como chips */}
              <div style={{ marginTop: 6 }}>
                <div className="muted" style={{ marginBottom: 6 }}>Ingredientes considerados</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(results.racion_optima.ingredientes_considerados || []).length === 0 ? (
                    <span className="muted">-</span>
                  ) : (
                    (results.racion_optima.ingredientes_considerados || []).map((i) => (
                      <span key={i.id_ingrediente} className="pill" title={`ID ${i.id_ingrediente}`}>
                        ID {i.id_ingrediente}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Tabla compacta de solución */}
              <div style={{ marginTop: 12, overflowX: 'auto' }}>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Ingrediente</th>
                      <th>Kg MS</th>
                      <th>EM (Mcal)</th>
                      <th>PC (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(results.racion_optima.solucion || []).map((it) => (
                      <tr key={it.id_ingrediente}>
                        <td style={{ textAlign: 'left' }}>{it.nombre}</td>
                        <td>{fmt(it.kg_ms)}</td>
                        <td>{fmt(it.em_aporte)}</td>
                        <td>{fmt(it.pc_aporte_g)}</td>
                      </tr>
                    ))}
                    {(!results.racion_optima.solucion || results.racion_optima.solucion.length === 0) && (
                      <tr>
                        <td colSpan={4} className="muted">Sin solución</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Total</th>
                      <th>{fmt(results.racion_optima.totales?.MS)}</th>
                      <th>{fmt(results.racion_optima.totales?.EM)}</th>
                      <th>{fmt(results.racion_optima.totales?.PC)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Resumen ampliado de totales y cumplimiento */}
              <div className="kv-table" style={{ marginTop: 8 }}>
                <div className="kv">
                  <span className="muted">Totales extendidos</span>
                  <span>
                    EN {fmt(results.racion_optima.totales?.EN)} Mcal · ED {fmt(results.racion_optima.totales?.ED)} Mcal · TND {fmt(results.racion_optima.totales?.TND)} kg
                  </span>
                </div>
                <div className="kv">
                  <span className="muted">Cumplimiento</span>
                  <span>
                    <span className={`badge ${results.racion_optima.cumplimiento?.EM ? 'badge-ok' : 'badge-bad'}`} style={{ marginRight: 6 }}>EM</span>
                    <span className={`badge ${results.racion_optima.cumplimiento?.PC ? 'badge-ok' : 'badge-bad'}`} style={{ marginRight: 6 }}>PC</span>
                    <span className={`badge ${results.racion_optima.cumplimiento?.MS ? 'badge-ok' : 'badge-bad'}`}>MS</span>
                    <span className={`pill ${results.racion_optima.cumplimiento?.EM && results.racion_optima.cumplimiento?.PC && results.racion_optima.cumplimiento?.MS ? 'ok' : 'bad'}`} style={{ marginLeft: 8 }}>
                      {results.racion_optima.cumplimiento?.EM && results.racion_optima.cumplimiento?.PC && results.racion_optima.cumplimiento?.MS ? 'Cumple' : 'No cumple'}
                    </span>
                  </span>
                </div>
              </div>
            </ResultCard>
          )}
          <details style={{ marginTop: '1rem' }}>
            <summary onClick={() => setShowJson((s) => !s)}>JSON completo</summary>
            {showJson && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(results, null, 2)}</pre>}
          </details>
          </div>
          {/* Controles finales */}
          <div className="comp-controls" style={{ marginTop: '12px' }}>
            <button type="button" className="secondary-btn btn-blue" onClick={handleExportPDF}>Exportar PDF</button>
          </div>
        </section>
      )}

      {/* Navegación */}
      <div className="raciones-nav">
        <Link to="/alimentacion/racion" className="nav-link">Volver a Ración Animal</Link>
        <Link to="/alimentacion/racion-ceba" className="nav-link">Raciones Ceba</Link>
      </div>
    </div>
  );
};

export default RacionesLactancia;