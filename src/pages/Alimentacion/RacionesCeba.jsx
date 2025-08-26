import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './RacionesCeba.css';
import { FaCow } from 'react-icons/fa6';
import { apiUrl, authHeader } from '../../api/api';

/**
 * RacionesCeba
 * Pantalla para calcular y mostrar los requerimientos nutricionales
 * de la etapa de ceba (engorde) de bovinos. Se conecta al endpoint
 * Flask `/api/raciones/api/calcular` enviando peso y ganancia diaria de peso (GDP).
 */
const RacionesCeba = () => {
  const resultsRef = useRef(null);
  const [formData, setFormData] = useState({
    id_animal: '',
    id_requerimiento: '',
    calculado_por: '',
    gdp: '',
  });
  // listas para selects
  const [animales, setAnimales] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ingredientesDisp, setIngredientesDisp] = useState([]);
  const [ingredientesSel, setIngredientesSel] = useState([]); // ids seleccionados
  const [ingredientSearch, setIngredientSearch] = useState('');

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guardar, setGuardar] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [compactView, setCompactView] = useState(false);
  const [showZeroIngredients, setShowZeroIngredients] = useState(false);

  // Formateador numérico seguro
  const fmt = (v, d = 2) => (v === null || v === undefined || isNaN(v)) ? '-' : Number(v).toFixed(d);
  const eps = 1e-6;

  const handleExportPDF = async () => {
    const node = resultsRef.current;
    if (!node) return;
    // Si no hay resultados, continuará exportando el área visible (como antes)
    // para mantener el comportamiento previo funcional.
    // Labels para encabezado
    const animal = animales.find(a => String(a.id) === String(formData.id_animal));
    const req = requerimientos.find(r => String(r.id_requerimiento || r.id) === String(formData.id_requerimiento));
    const user = usuarios.find(u => String(u.id) === String(formData.calculado_por));
    const animalLabel = animal ? (animal.nombre || animal.id_animal || `Animal ${animal.id}`) : '-';
    const reqLabel = fmtReqLabel(req);
    const userLabel = fmtUserLabel(user);
    const fecha = new Date().toLocaleString();
    // Estilos para impresión en nueva ventana
    const styles = `
      @page { size: A4; margin: 14mm; }
      * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
      h1 { color: #00324C; margin: 0 0 4px 0; }
      h2, h3 { color: #0b2533; margin: 10px 0 6px 0; }
      .meta { width: 100%; border-collapse: collapse; margin: 8px 0 14px 0; }
      .meta th { text-align: left; color: #4b5563; font-weight: 600; padding: 4px 6px; }
      table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 8px; }
      thead th { background: #eef2f7; text-align: left; padding: 8px 10px; border-top: 1px solid #dbe2ea; border-bottom: 1px solid #dbe2ea; }
      td { padding: 6px 10px; border-bottom: 1px solid #eef2f7; }
      tr:nth-child(odd) td { background: #fafcff; }
      .comp-controls, .toggle, button, .nav-link { display: none !important; }
      .section { page-break-after: avoid; }
    `;
    const header = `
      <h1>Ración Ceba</h1>
      <table class="meta">
        <tr><th>Animal</th><td>${animalLabel}</td><th>Requerimiento</th><td>${reqLabel}</td></tr>
        <tr><th>Calculado por</th><td>${userLabel}</td><th>Fecha</th><td>${fecha}</td></tr>
      </table>
    `;
    const content = `<div class="section">${node.innerHTML}</div>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Ración Ceba</title><style>${styles}</style></head><body>`);
    win.document.write(header);
    win.document.write(content);
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // Helpers para etiquetas en selects (mostrar info principal tal como viene de la BD)
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

  const fmtUserLabel = (u) => {
    if (!u) return '';
    const nombre = u.nombre || u.nombres || u.first_name || '';
    const apellido = u.apellido || u.apellidos || u.last_name || '';
    const full = [nombre, apellido].filter(Boolean).join(' ').trim();
    return full || u.username || u.email || `Usuario ${u.id}`;
  };

  useEffect(() => {
    AOS.init({ duration: 800 });
    // cargar selects
    const fetchSelects = async () => {
      try {
        const headers = authHeader();
        const [aRes, rRes, uRes, iRes] = await Promise.all([
          fetch(apiUrl('/api/animals/'), { headers }),
          fetch(apiUrl('/api/requerimientos-nutricionales/api'), { headers }),
          fetch(apiUrl('/api/users/api'), { headers }),
          fetch(apiUrl('/api/ingredientes/api'), { headers }),
        ]);
        const toJsonIfOk = async (res) => {
          const ct = res.headers.get('content-type') || '';
          return ct.includes('application/json') ? res.json() : [];
        };
        if (aRes.ok) setAnimales(await toJsonIfOk(aRes));
        if (rRes.ok) setRequerimientos(await toJsonIfOk(rRes));
        if (uRes.ok) setUsuarios(await toJsonIfOk(uRes));
        if (iRes.ok) setIngredientesDisp(await toJsonIfOk(iRes));
      } catch (e) {
        console.error('Error cargando selects', e);
      }
    };
    fetchSelects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchRequerimientos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validaciones previas
      if (!formData.id_animal) {
        setLoading(false);
        setError('Seleccione un animal de ceba.');
        return;
      }
      if (!ingredientesSel || ingredientesSel.length === 0) {
        setLoading(false);
        setError('Seleccione al menos un ingrediente para optimizar.');
        return;
      }
      const headers = { 'Content-Type': 'application/json', ...authHeader() };
      const resp = await fetch(apiUrl('/api/raciones/api/calcular'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          etapa: 'ceba',
          id_animal: parseInt(formData.id_animal, 10) || null,
          id_requerimiento: parseInt(formData.id_requerimiento, 10) || null,
          calculado_por: parseInt(formData.calculado_por, 10) || null,
          gdp: parseFloat(formData.gdp),
          guardar,
          ms_total: results?.racion_optima?.totales?.MS ?? undefined,
          observaciones: '',
          optimizar: true,
          ingredientes_ids: (ingredientesSel && ingredientesSel.length > 0) ? ingredientesSel.map((v) => parseInt(v, 10)) : undefined,
        }),
      });
      // Verificar que la respuesta sea JSON
      const contentType = resp.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        const text = await resp.text();
        throw new Error(`Respuesta no JSON. Status ${resp.status}. Primero 100 chars: ${text.slice(0, 100)}`);
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error del servidor');
      setResults(data);
      if (data.saved) {
        setSaveMsg(`Cálculo guardado. ID ración: ${data.id_racion}`);
        setTimeout(() => setSaveMsg(''), 4000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRequerimientos();
  };

  return (
    <div className="raciones-ceba-container">
      <h1 className="raciones-title">Raciones – Ceba</h1>

      {/* FORMULARIO */}
      <section className="raciones-form" data-aos="fade-up">
        <h2>Datos del Animal</h2>
        <form onSubmit={handleSubmit}>
          {/* Identificadores y guardado */}
          <fieldset className="raciones-step" data-aos="fade-right">
            <legend>Identificadores y guardado</legend>
            <div className="grid-3">
              <div className="form-group">
                <label>Animal</label>
                <select name="id_animal" value={formData.id_animal} onChange={handleChange}>
                  <option value="">Seleccione…</option>
                  {animales
                    .filter((a) => {
                      if (a && a.id_etapa != null) return Number(a.id_etapa) === 2;
                      if (a && a.etapa_nombre) return String(a.etapa_nombre).toLowerCase() === 'ceba';
                      if (a && a.categoria) return String(a.categoria).toLowerCase().includes('ceba');
                      return true;
                    })
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre ?? a.id}
                      </option>
                    ))}
                </select>
                {animales.length === 0 && (<p className="muted">No hay animales disponibles.</p>)}
              </div>
              <div className="form-group">
                <label>Requerimiento</label>
                <select name="id_requerimiento" value={formData.id_requerimiento} onChange={handleChange}>
                  <option value="">Seleccione…</option>
                  {requerimientos
                    .filter((r) => Number(r.id_etapa) === 2)
                    .map((r) => (
                    <option key={r.id_requerimiento} value={r.id_requerimiento}>
                      {fmtReqLabel(r)}
                    </option>
                  ))}
                </select>
                {requerimientos.length === 0 && (<p className="muted">No hay requerimientos cargados.</p>)}
              </div>
              <div className="form-group">
                <label>Calculado por (Usuario)</label>
                <select name="calculado_por" value={formData.calculado_por} onChange={handleChange}>
                  <option value="">Seleccione…</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {fmtUserLabel(u)}
                    </option>
                  ))}
                </select>
                {usuarios.length === 0 && (<p className="muted">No hay usuarios disponibles.</p>)}
              </div>
            </div>
            <label className="toggle" style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" checked={guardar} onChange={(e) => setGuardar(e.target.checked)} /> Guardar cálculo en la base de datos
            </label>
          </fieldset>
          <div className="form-group">
            <label>Ganancia Diaria de Peso – GDP (kg/día)</label>
            <input
              type="number"
              name="gdp"
              step="0.01"
              value={formData.gdp}
              onChange={handleChange}
              required
            />
          </div>

          {/* Ingredientes disponibles */}
          <fieldset className="raciones-step" data-aos="fade-right" style={{ marginTop: '1rem' }}>
            <legend>Ingredientes disponibles</legend>
            <div className="form-actions" style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="secondary-btn" onClick={() => setIngredientesSel(ingredientesDisp.map(i => i.id_ingrediente))} disabled={ingredientesDisp.length === 0}>
                Seleccionar todos
              </button>
              <button type="button" className="secondary-btn" onClick={() => setIngredientesSel([])} disabled={ingredientesSel.length === 0}>
                Limpiar selección
              </button>
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
                  <label key={ing.id_ingrediente} className={`check-item ${ingredientesSel.includes(ing.id_ingrediente) ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={ingredientesSel.includes(ing.id_ingrediente)}
                      onChange={() => setIngredientesSel((prev) => prev.includes(ing.id_ingrediente) ? prev.filter(x => x !== ing.id_ingrediente) : [...prev, ing.id_ingrediente])}
                    />
                    <span>
                      {ing.nombre} <span className="muted">(ID {ing.id_ingrediente})</span>
                      {ing.costo_kg != null && (
                        <span className="pill" style={{ marginLeft: 8 }}>Costo ${Number(ing.costo_kg).toFixed(2)}/kg</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              La optimización usará únicamente los ingredientes seleccionados. Seleccionados: {ingredientesSel.length}
            </p>
          </fieldset>

          <button type="submit" className="submit-btn" disabled={loading || ingredientesSel.length === 0}>
            {guardar ? 'Calcular y Guardar' : 'Calcular'}
          </button>
        </form>
      </section>

      {/* ESTADOS */}
      {loading && <p>Cargando resultados…</p>}
      {error && <p className="error">{error}</p>}
      {saveMsg && <p className="success">{saveMsg}</p>}

      {/* RESULTADOS */}
      {results && !loading && !error && (
        <section className="raciones-results" data-aos="fade-up" ref={resultsRef}>
          <h2>Requerimientos Calculados</h2>
          <article className="result-card">
            <FaCow className="result-icon" />
            <div>
              <h3>Animal</h3>
              <p>GDP: {formData.gdp || 0} kg/día</p>
              <h3>Requerimientos</h3>
              <div className="kv-table">
                <div className="kv"><span>EM (Mcal)</span><span>{results.requerimientos?.EM ?? '-'}</span></div>
                <div className="kv"><span>EN (Mcal)</span><span>{results.requerimientos?.EN ?? '-'}</span></div>
                <div className="kv"><span>ED (Mcal)</span><span>{results.requerimientos?.ED ?? '-'}</span></div>
                <div className="kv"><span>TND (kg)</span><span>{results.requerimientos?.TND ?? '-'}</span></div>
                <div className="kv"><span>PC (g)</span><span>{results.requerimientos?.PC ?? '-'}</span></div>
                <div className="kv"><span>PD (g)</span><span>{results.requerimientos?.PD ?? '-'}</span></div>
                <div className="kv"><span>MS (kg)</span><span>{results.requerimientos?.MS ?? '-'}</span></div>
              </div>
            </div>
          </article>
          {results?.racion_optima && (
            <>
              <article className="result-card">
                <div>
                  <h3>Ración óptima {results.racion_optima?.objetivo === 'costo' ? '(min costo)' : '(min MS)'} (kg MS por ingrediente)</h3>
                  {results.racion_optima?.status && (
                    <p className={`pill ${results.racion_optima.status === 'Optimal' ? 'ok' : 'bad'}`}>
                      {results.racion_optima.status}
                    </p>
                  )}
                  {results.racion_optima?.message && (
                    <p className="error" style={{ marginTop: 8 }}>{results.racion_optima.message}</p>
                  )}
                  <div className="kv-table">
                    {(() => {
                      const cons = results.racion_optima.ingredientes_considerados || [];
                      const sol = results.racion_optima.solucion || [];
                      const positive = sol.filter(it => Number(it.kg_ms) > 0).sort((a,b)=>Number(b.kg_ms)-Number(a.kg_ms));
                      const zeroList = cons
                        .map(c => c.id_ingrediente)
                        .filter(id => !positive.some(p => p.id_ingrediente === id));
                      return (
                        <>
                          <div className="kv">
                            <span className="muted">Ingredientes considerados</span>
                            <span>
                              {cons.length} total · {positive.length} con aporte · {zeroList.length} sin aporte
                            </span>
                          </div>
                          {/* Tabla: ingredientes con aporte */}
                          <table style={{ width: '100%', marginTop: 6, borderCollapse: 'separate', borderSpacing: 0 }}>
                            <colgroup>
                              <col style={{ width: '60%' }} />
                              <col style={{ width: '15%' }} />
                              <col style={{ width: '12.5%' }} />
                              <col style={{ width: '12.5%' }} />
                            </colgroup>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Ingrediente</th>
                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>kg MS</th>
                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>EM (Mcal)</th>
                                <th style={{ textAlign: 'right', padding: '6px 8px' }}>PC (g)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positive.map((it, idx) => (
                                <tr key={it.id_ingrediente} style={idx % 2 === 1 ? { background: '#f8fafc' } : {}}>
                                  <td style={{ padding: '6px 8px' }} title={`EM ${fmt(it.em_aporte,2)} Mcal · PC ${fmt(it.pc_aporte_g,0)} g`}>{it.nombre}</td>
                                  <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(it.kg_ms, 3)}</td>
                                  <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(it.em_aporte, 2)}</td>
                                  <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(it.pc_aporte_g, 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {/* Toggle para mostrar los de 0 kg */}
                          {zeroList.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <button type="button" className="secondary-btn" onClick={() => setShowZeroIngredients(s => !s)}>
                                {showZeroIngredients ? 'Ocultar' : 'Ver'} ingredientes sin aporte ({zeroList.length})
                              </button>
                              {showZeroIngredients && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 6 }}>
                                  {zeroList.map((id) => (
                                    <span key={id} className="pill" style={{ background: '#f8fafc', color: '#0f172a', borderColor: '#e5e7eb' }}>
                                      ID {id}: 0.000 kg MS
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="kv" style={{ marginTop: '6px' }}>
                    <span>Total</span>
                    <span>
                      MS {fmt(results.racion_optima.totales?.MS, 3)} kg · EM {fmt(results.racion_optima.totales?.EM, 2)} Mcal · PC {fmt(results.racion_optima.totales?.PC ?? results.racion_optima.totales?.PT, 0)} g · EN {fmt(results.racion_optima.totales?.EN, 2)} Mcal · ED {fmt(results.racion_optima.totales?.ED, 2)} Mcal · TND {fmt(results.racion_optima.totales?.TND, 3)} kg
                      <span className={`pill ${results.racion_optima.cumplimiento?.EM && results.racion_optima.cumplimiento?.PC && results.racion_optima.cumplimiento?.MS ? 'ok' : 'bad'}`} style={{ marginLeft: '0.5rem' }}>
                        {results.racion_optima.cumplimiento?.EM && results.racion_optima.cumplimiento?.PC && results.racion_optima.cumplimiento?.MS ? 'Cumple' : 'No cumple'}
                      </span>
                    </span>
                  </div>
                </div>
              </article>

              {/* Comparativo Requerimientos vs Aportes */}
              <article className="result-card">
                <div>
                  <div className="comp-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>Requerimientos vs Aportes (mezcla óptima)</h3>
                    <label className="toggle" style={{ fontSize: 14 }}>
                      <input type="checkbox" checked={compactView} onChange={(e) => setCompactView(e.target.checked)} /> Vista compacta
                    </label>
                  </div>
                  {(() => {
                    const r = results;
                    const reqE = r.requerimientos || {};
                    const tot = r.racion_optima?.totales || {};
                    const meta = {
                      EM: { tip: 'Energía metabolizable (Mcal/día).' },
                      EN: { tip: 'Energía neta estimada (Mcal/día).' },
                      ED: { tip: 'Energía digestible estimada (Mcal/día).' },
                      TND:{ tip: 'Total de nutrientes digestibles (kg/día).' },
                      PC: { tip: 'Proteína cruda o total (g/día).' },
                      PD: { tip: 'Proteína digestible estimada (g/día).' },
                      MS: { tip: 'Materia seca total (kg/día).' },
                    };
                    const rows = [
                      { block:'Energía', key: 'EM', label: 'EM (Mcal)', req: reqE?.EM, ap: tot?.EM, d: 2 },
                      { block:'Energía', key: 'EN', label: 'EN (Mcal)', req: reqE?.EN, ap: tot?.EN, d: 2 },
                      { block:'Energía', key: 'ED', label: 'ED (Mcal)', req: reqE?.ED, ap: tot?.ED, d: 2 },
                      { block:'Energía', key: 'TND', label: 'TND (kg)', req: reqE?.TND, ap: tot?.TND, d: 3 },
                      { block:'Proteínas', key: 'PC', label: 'PC/PT (g)', req: reqE?.PC ?? reqE?.PT, ap: (tot?.PC ?? tot?.PT), d: 0 },
                      { block:'Proteínas', key: 'PD', label: 'PD (g)', req: reqE?.PD, ap: tot?.PD, d: 0 },
                      { block:'Proteínas', key: 'MS', label: 'MS (kg)', req: reqE?.MS, ap: tot?.MS, d: 3 },
                    ];
                    const blocks = ['Energía','Proteínas'];
                    const okBlock = (b) => {
                      const set = rows.filter(x=>x.block===b);
                      const valids = set.filter(x=>x.req!=null && !isNaN(x.req) && x.ap!=null && !isNaN(x.ap));
                      if (!valids.length) return null;
                      const allOk = valids.every(x=> Number(x.ap)+eps >= Number(x.req));
                      return allOk;
                    };
                    return (
                      <div>
                        {!compactView && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                            {blocks.map(b => (
                              <div key={b} className="kv-table" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <strong>{b}</strong>
                                  {okBlock(b) !== null && (
                                    <span className={`pill ${okBlock(b) ? 'ok' : 'bad'}`}>{okBlock(b) ? 'Cumple' : 'No cumple'}</span>
                                  )}
                                </div>
                                {rows.filter(x=>x.block===b).map((x) => {
                                  const ok = (x.ap!=null && x.req!=null && !isNaN(x.ap) && !isNaN(x.req)) ? (Number(x.ap)+eps >= Number(x.req)) : null;
                                  return (
                                    <div key={x.key} className="kv">
                                      <span title={meta[x.key]?.tip}>{x.label}</span>
                                      <span>
                                        Req {fmt(x.req, x.d)} · Ap {fmt(x.ap, x.d)} {ok!==null && (
                                          <span className={`pill ${ok ? 'ok' : 'bad'}`} style={{ marginLeft: 6 }}>{ok ? 'OK' : 'Bajo'}</span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                        {compactView && (
                          <div style={{ display: 'grid', gap: 10 }}>
                            {['Energía','Proteínas'].map((b) => (
                              <div key={b} className="kv-table" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <strong>{b}</strong>
                                  {okBlock(b) !== null && (
                                    <span className={`pill ${okBlock(b) ? 'ok' : 'bad'}`}>{okBlock(b) ? 'Cumple' : 'No cumple'}</span>
                                  )}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                  <colgroup>
                                    <col style={{ width: '44%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '20%' }} />
                                  </colgroup>
                                  <thead>
                                    <tr>
                                      <th style={{ textAlign: 'left', padding: '8px 10px' }}>Indicador</th>
                                      <th style={{ textAlign: 'right', padding: '8px 10px' }}>Req</th>
                                      <th style={{ textAlign: 'right', padding: '8px 10px' }}>Ap</th>
                                      <th style={{ textAlign: 'center', padding: '8px 10px' }}>Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.filter(r => r.block === b).map((x, idx) => {
                                      const ok = (x.ap!=null && x.req!=null && !isNaN(x.ap) && !isNaN(x.req)) ? (Number(x.ap)+eps >= Number(x.req)) : null;
                                      const zebra = idx % 2 === 1 ? { background: '#f8fafc' } : {};
                                      return (
                                        <tr key={x.key} style={zebra}>
                                          <td style={{ padding: '6px 10px' }} title={meta[x.key]?.tip}>{x.label}</td>
                                          <td style={{ textAlign: 'right', padding: '6px 10px' }}>{fmt(x.req, x.d)}</td>
                                          <td style={{ textAlign: 'right', padding: '6px 10px' }}>{fmt(x.ap, x.d)}</td>
                                          <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                                            {ok!==null ? (<span className={`pill ${ok ? 'ok' : 'bad'}`}>{ok ? 'OK' : 'Bajo'}</span>) : '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </article>
            </>
          )}
          <div className="comp-controls">
            <button type="button" className="full-btn btn-blue" onClick={handleExportPDF}>
              Exportar PDF
            </button>
          </div>
        </section>
      )}

      {/* NAVEGACIÓN */}
      <nav className="raciones-nav" data-aos="fade-up">
        <Link to="/alimentacion/racion" className="nav-link">
          Volver a Raciones
        </Link>
        <Link to="/alimentacion/racion-lactancia" className="nav-link">
          Raciones Lactancia
        </Link>
      </nav>
    </div>
  );
};

export default RacionesCeba;