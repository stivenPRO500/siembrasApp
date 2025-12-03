import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashStyles from './Dashboard.module.css';
import styles from './Cosechas.module.css';
import { getBackendUrl } from '../utils/api';
import { FaCheck } from 'react-icons/fa';

export default function Cosechas() {
  const [cosechas, setCosechas] = useState([]);
  const [abiertas, setAbiertas] = useState({}); // { [cosechaId]: true }
  // Formularios por cosecha
  const [prodForm, setProdForm] = useState({}); // { [id]: { nombre, cantidad, precio } }
  const [gastoForm, setGastoForm] = useState({}); // { [id]: { nombre, monto } }
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paidFilter, setPaidFilter] = useState('todos'); // 'todos' | 'pagados' | 'no-pagados'
  const [dateFilterType, setDateFilterType] = useState('todos'); // 'todos' | 'dia' | 'mes' | 'anio' | 'ultimos'
  const [dateDay, setDateDay] = useState(''); // YYYY-MM-DD
  const [dateMonth, setDateMonth] = useState(''); // YYYY-MM
  const [dateYear, setDateYear] = useState(''); // YYYY
  const [lastMonths, setLastMonths] = useState('1'); // 1,2,3,6,12
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const t = localStorage.getItem('token');
        const res = await fetch(`${getBackendUrl()}/cosechas`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {}
        });
        const data = await res.json().catch(() => []);
        if (!res.ok || !Array.isArray(data)) {
          console.warn('Respuesta de cosechas no válida o no autorizada', data);
          setCosechas([]);
          return;
        }
        setCosechas(data);
      } catch (e) {
        console.error('Error obteniendo cosechas', e);
        setCosechas([]);
      }
    };
    load();
  }, []);

  const ingresosTotal = (c) => {
    const arr = Array.isArray(c.producciones) ? c.producciones : [];
    return arr.reduce((acc, p) => acc + (Number(p.cantidad || 0) * Number(p.precio || 0)), 0);
  };
  const gastosExtraTotal = (c) => {
    const arr = Array.isArray(c.gastosExtra) ? c.gastosExtra : [];
    return arr.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  };
  const neto = (c) => ingresosTotal(c) - Number(c.totalCosto || 0) - gastosExtraTotal(c);

  const handleAddProduccion = async (id) => {
    const f = prodForm[id] || {};
    if (!f.nombre || isNaN(f.cantidad) || isNaN(f.precio)) return;
    try {
      const t = localStorage.getItem('token');
      const res = await fetch(`${getBackendUrl()}/cosechas/${id}/producciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ nombre: f.nombre, cantidad: Number(f.cantidad || 0), precio: Number(f.precio || 0) })
      });
      const updated = await res.json();
      if (res.ok) {
        setCosechas(prev => prev.map(c => c._id === id ? updated : c));
        setProdForm(prev => ({ ...prev, [id]: { nombre: '', cantidad: '', precio: '' } }));
      }
    } catch (e) { /* noop */ }
  };

  const handleAddGasto = async (id) => {
    const f = gastoForm[id] || {};
    if (!f.nombre || isNaN(f.monto)) return;
    try {
      const t = localStorage.getItem('token');
      const res = await fetch(`${getBackendUrl()}/cosechas/${id}/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ nombre: f.nombre, monto: Number(f.monto || 0) })
      });
      const updated = await res.json();
      if (res.ok) {
        setCosechas(prev => prev.map(c => c._id === id ? updated : c));
        setGastoForm(prev => ({ ...prev, [id]: { nombre: '', monto: '' } }));
      }
    } catch (e) { /* noop */ }
  };

  const togglePagado = async (id, pagado) => {
    try {
      const t = localStorage.getItem('token');
      const res = await fetch(`${getBackendUrl()}/cosechas/${id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ pagado })
      });
      const updated = await res.json();
      if (res.ok) {
        setCosechas(prev => prev.map(c => c._id === id ? updated : c));
      }
    } catch (e) { /* noop */ }
  };

  return (
    <div className={styles.container}>
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Cosechas</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            className={styles.topSearch}
            style={{ width: 220, maxWidth: '100%' }}
            type="text"
            placeholder="Buscar por manzana..."
            value={searchQuery}
            onChange={(e)=> setSearchQuery(e.target.value)}
          />
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/graficas')}>Gráficas</button>
          <button className={dashStyles.btnAgregarManzana} style={{ marginRight: 8 }} onClick={() => setShowFilters(v=>!v)}>Filtros</button>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
        </div>
      </div>
      {showFilters && (
        <div className={styles.filtersWrapper} onClick={(e)=> e.stopPropagation()}>
          <div className={styles.filtersPanel}>
            <select
              className={styles.inputDark}
              value={dateFilterType}
              onChange={(e)=> setDateFilterType(e.target.value)}
              title="Tipo de filtro de fecha"
            >
              <option value="todos">Todas las fechas</option>
              <option value="dia">Por día</option>
              <option value="mes">Por mes</option>
              <option value="anio">Por año</option>
              <option value="ultimos">Últimos N meses/año</option>
            </select>
            {dateFilterType === 'dia' && (
              <input
                className={styles.inputDark}
                type="date"
                value={dateDay}
                onChange={(e)=> setDateDay(e.target.value)}
              />
            )}
            {dateFilterType === 'mes' && (
              <input
                className={styles.inputDark}
                type="month"
                value={dateMonth}
                onChange={(e)=> setDateMonth(e.target.value)}
              />
            )}
            {dateFilterType === 'anio' && (
              <input
                className={styles.inputDark}
                type="number"
                placeholder="Año (YYYY)"
                value={dateYear}
                onChange={(e)=> setDateYear(e.target.value)}
              />
            )}
            {dateFilterType === 'ultimos' && (
              <select
                className={styles.inputDark}
                value={lastMonths}
                onChange={(e)=> setLastMonths(e.target.value)}
                title="Últimos"
              >
                <option value="1">Último mes</option>
                <option value="2">Últimos 2 meses</option>
                <option value="3">Últimos 3 meses</option>
                <option value="6">Últimos 6 meses</option>
                <option value="12">Último año</option>
              </select>
            )}
            <select
              className={styles.inputDark}
              value={paidFilter}
              onChange={(e)=> setPaidFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pagados">Pagados</option>
              <option value="no-pagados">No pagados</option>
            </select>
            <div className={styles.inlineActions}>
              <button
                className={dashStyles.btnAgregarManzana}
                onClick={()=> { setSearchQuery(''); setPaidFilter('todos'); setDateFilterType('todos'); setDateDay(''); setDateMonth(''); setDateYear(''); setLastMonths('1'); }}
              >Limpiar</button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.grid}>
        {cosechas.length > 0 && cosechas.filter(c => {
          const q = searchQuery.trim().toLowerCase();
          const name = (c.manzana?.nombre || '').toLowerCase();
          const matchesQuery = q === '' || name.includes(q);
          const matchesPaid = paidFilter === 'todos' || (paidFilter === 'pagados' ? !!c.pagado : !c.pagado);
          // date filter
          const d = new Date(c.fechaCosecha || c.createdAt);
          let matchesDate = true;
          if (dateFilterType === 'dia' && dateDay) {
            const sd = new Date(dateDay + 'T00:00:00');
            matchesDate = d.getFullYear() === sd.getFullYear() && d.getMonth() === sd.getMonth() && d.getDate() === sd.getDate();
          } else if (dateFilterType === 'mes' && dateMonth) {
            const [y,m] = dateMonth.split('-').map(Number);
            matchesDate = d.getFullYear() === y && (d.getMonth()+1) === m;
          } else if (dateFilterType === 'anio' && dateYear) {
            const y = Number(dateYear);
            matchesDate = d.getFullYear() === y;
          } else if (dateFilterType === 'ultimos') {
            const n = Number(lastMonths || '1');
            const now = new Date();
            const start = new Date(now);
            start.setHours(0,0,0,0);
            start.setMonth(start.getMonth() - n);
            matchesDate = d >= start && d <= now;
          }
          return matchesQuery && matchesPaid && matchesDate;
        }).length === 0 && (
          <p>No hay resultados con estos filtros.</p>
        )}
        {cosechas
          .filter(c => {
            const q = searchQuery.trim().toLowerCase();
            const name = (c.manzana?.nombre || '').toLowerCase();
            const matchesQuery = q === '' || name.includes(q);
            const matchesPaid = paidFilter === 'todos' || (paidFilter === 'pagados' ? !!c.pagado : !c.pagado);
            const d = new Date(c.fechaCosecha || c.createdAt);
            let matchesDate = true;
            if (dateFilterType === 'dia' && dateDay) {
              const sd = new Date(dateDay + 'T00:00:00');
              matchesDate = d.getFullYear() === sd.getFullYear() && d.getMonth() === sd.getMonth() && d.getDate() === sd.getDate();
            } else if (dateFilterType === 'mes' && dateMonth) {
              const [y,m] = dateMonth.split('-').map(Number);
              matchesDate = d.getFullYear() === y && (d.getMonth()+1) === m;
            } else if (dateFilterType === 'anio' && dateYear) {
              const y = Number(dateYear);
              matchesDate = d.getFullYear() === y;
            } else if (dateFilterType === 'ultimos') {
              const n = Number(lastMonths || '1');
              const now = new Date();
              const start = new Date(now);
              start.setHours(0,0,0,0);
              start.setMonth(start.getMonth() - n);
              matchesDate = d >= start && d <= now;
            }
            return matchesQuery && matchesPaid && matchesDate;
          })
          .map(c => {
          const abierta = !!abiertas[c._id];
          const prodF = prodForm[c._id] || { nombre: '', cantidad: '', precio: '' };
          const gastoF = gastoForm[c._id] || { nombre: '', monto: '' };
          const isPaid = !!c.pagado;
          return (
            <div
              key={c._id}
              className={`${styles.card} ${c.pagado ? styles.cardPaid : styles.cardUnpaid}`}
              onClick={() => setAbiertas(p => ({ ...p, [c._id]: !p[c._id] }))}
            >
              <div className={styles.header}>
                <div>
                  <div className={styles.title}>Manzana: {c.manzana?.nombre || 'N/A'}</div>
                  <div className={styles.meta}>Fecha: {new Date(c.fechaCosecha || c.createdAt).toLocaleDateString()}</div>
                </div>
                <div className={styles.summary} onClick={(e)=> e.stopPropagation()}>
                  <span className={`${styles.badge} ${styles.badgeRed}`}>Inversión: Q.{Number(c.totalCosto||0).toFixed(2)}</span>
                  <span className={`${styles.badge} ${styles.badgeGreen}`}>Ingresos: Q.{Number(ingresosTotal(c)).toFixed(2)}</span>
                  <span className={`${styles.badge} ${styles.badgeRed}`}>Gastos: Q.{Number(gastosExtraTotal(c)).toFixed(2)}</span>
                  <span className={`${styles.badge} ${styles.badgeGreen}`}>Neto: Q.{Number(neto(c)).toFixed(2)}</span>
                  <span className={styles.badge}>
                    <span className={styles.payFlag}>{c.pagado ? (<><FaCheck className={styles.paidIcon} /> Pagado</>) : 'No pagado'}</span>
                  </span>
                </div>
              </div>
              {abierta && (
                <div className={styles.details} onClick={(e)=> e.stopPropagation()}>
                  <div className={styles.sectionTitle}>Actividades ({c.actividades.length})</div>
                  <ul className={styles.list}>
                    {c.actividades.map((a,i) => (
                      <li key={i}>
                        {a.tipo} - {a.fechaRealizacion ? new Date(a.fechaRealizacion).toLocaleDateString() : 'Sin fecha'} - Q.{Math.round(Number(a.costoTotal||0))}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.sectionTitle}>Producción</div>
                  {!isPaid && (
                    <>
                      <div className={`${styles.inlineForm} ${styles.inlineFormProd}`}>
                        <input className={styles.input} type="text" placeholder="Nombre de la producción" value={prodF.nombre} onChange={e=> setProdForm(p=>({ ...p, [c._id]: { ...prodF, nombre: e.target.value } }))} />
                        <input className={styles.input} type="number" min="0" step="0.01" placeholder="Cantidad" value={prodF.cantidad} onChange={e=> setProdForm(p=>({ ...p, [c._id]: { ...prodF, cantidad: e.target.value } }))} />
                        <input className={styles.input} type="number" min="0" step="0.01" placeholder="Precio" value={prodF.precio} onChange={e=> setProdForm(p=>({ ...p, [c._id]: { ...prodF, precio: e.target.value } }))} />
                      </div>
                      <div className={styles.inlineActions}>
                        <button className={dashStyles.btnAgregarManzana} onClick={()=> handleAddProduccion(c._id)}>Agregar producción</button>
                      </div>
                    </>
                  )}
                  {Array.isArray(c.producciones) && c.producciones.length > 0 && (
                    <ul className={styles.list}>
                      {c.producciones.map((p, idx) => (
                        <li key={idx}>
                          {p.nombre} — {Number(p.cantidad||0)} x Q.{Number(p.precio||0).toFixed(2)} = Q.{(Number(p.cantidad||0)*Number(p.precio||0)).toFixed(2)}
                          {!isPaid && (
                            <button className={dashStyles.btnAgregarManzana} style={{ marginLeft: 8, background:'#c0392b' }} onClick={()=>{
                              const t = localStorage.getItem('token');
                              fetch(`${getBackendUrl()}/cosechas/${c._id}/producciones/${idx}`, { method:'DELETE', headers:{ Authorization:`Bearer ${t}` } })
                                .then(res=>res.json())
                                .then(updated=> setCosechas(prev => prev.map(cc => cc._id === c._id ? updated : cc)))
                                .catch(()=>{});
                            }}>Eliminar</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className={styles.sectionTitle}>Gastos extra</div>
                  {!isPaid && (
                    <>
                      <div className={`${styles.inlineForm} ${styles.inlineFormGasto}`}>
                        <input className={styles.input} type="text" placeholder="Nombre del gasto" value={gastoF.nombre} onChange={e=> setGastoForm(p=>({ ...p, [c._id]: { ...gastoF, nombre: e.target.value } }))} />
                        <input className={styles.input} type="number" min="0" step="0.01" placeholder="Monto" value={gastoF.monto} onChange={e=> setGastoForm(p=>({ ...p, [c._id]: { ...gastoF, monto: e.target.value } }))} />
                      </div>
                      <div className={styles.inlineActions}>
                        <button className={dashStyles.btnAgregarManzana} onClick={()=> handleAddGasto(c._id)}>Agregar gasto</button>
                      </div>
                    </>
                  )}
                  {Array.isArray(c.gastosExtra) && c.gastosExtra.length > 0 && (
                    <ul className={styles.list}>
                      {c.gastosExtra.map((g, idx) => (
                        <li key={idx}>
                          {g.nombre} — Q.{Number(g.monto||0).toFixed(2)}
                          {!isPaid && (
                            <button className={dashStyles.btnAgregarManzana} style={{ marginLeft: 8, background:'#c0392b' }} onClick={()=>{
                              const t = localStorage.getItem('token');
                              fetch(`${getBackendUrl()}/cosechas/${c._id}/gastos/${idx}`, { method:'DELETE', headers:{ Authorization:`Bearer ${t}` } })
                                .then(res=>res.json())
                                .then(updated=> setCosechas(prev => prev.map(cc => cc._id === c._id ? updated : cc)))
                                .catch(()=>{});
                            }}>Eliminar</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className={styles.actions} style={{ marginTop: 8 }}>
                    <button className={dashStyles.btnAgregarManzana} onClick={()=> togglePagado(c._id, !c.pagado)}>
                      {c.pagado ? 'Marcar como no pagado' : 'Marcar como pagado'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        {cosechas.length === 0 && <p>No hay cosechas todavía.</p>}
      </div>
    </div>
  );
}
