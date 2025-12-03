import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashStyles from './Dashboard.module.css';
import styles from './Graficas.module.css';
import { getBackendUrl } from '../utils/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function Graficas() {
  const navigate = useNavigate();
  const [cosechas, setCosechas] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [metric, setMetric] = useState('Ingresos'); // 'Ingresos' | 'Neto' | 'Gastos'
  const [compareIG, setCompareIG] = useState(false); // comparar ingresos y gastos
  const [dateFilterType, setDateFilterType] = useState('ultimos'); // default últimos
  const [dateDay, setDateDay] = useState(''); // YYYY-MM-DD
  const [dateMonth, setDateMonth] = useState(''); // YYYY-MM
  const [dateYear, setDateYear] = useState(''); // YYYY
  const [lastMonths, setLastMonths] = useState('3'); // 1,2,3,6,12
  const [selectedManzanas, setSelectedManzanas] = useState({}); // { [id]: true }
  const [allSelected, setAllSelected] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const t = localStorage.getItem('token');
        const res = await fetch(`${getBackendUrl()}/cosechas`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {}
        });
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) {
          setCosechas(data);
        } else {
          setCosechas([]);
        }
      } catch (e) {
        setCosechas([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const manzanas = useMemo(() => {
    const map = new Map();
    for (const c of cosechas) {
      const id = c.manzana?._id || c.manzana?.id || 'sin-id';
      const name = c.manzana?.nombre || 'N/A';
      if (!map.has(id)) map.set(id, name);
    }
    return Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }, [cosechas]);

  const filtered = useMemo(() => {
    const now = new Date();
    const list = cosechas.filter(c => {
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
        const start = new Date(now);
        start.setHours(0,0,0,0);
        start.setMonth(start.getMonth() - n);
        matchesDate = d >= start && d <= now;
      }
      if (!matchesDate) return false;
      if (allSelected) return true;
      const id = c.manzana?._id || c.manzana?.id || 'sin-id';
      return !!selectedManzanas[id];
    });
    return list;
  }, [cosechas, dateFilterType, dateDay, dateMonth, dateYear, lastMonths, allSelected, selectedManzanas]);

  const chartData = useMemo(() => {
    // agrupar por manzana
    const group = new Map();
    for (const c of filtered) {
      const id = c.manzana?._id || c.manzana?.id || 'sin-id';
      const name = c.manzana?.nombre || 'N/A';
      const ingresos = (Array.isArray(c.producciones) ? c.producciones : []).reduce((acc, p) => acc + (Number(p.cantidad || 0) * Number(p.precio || 0)), 0);
      const gastosExtra = (Array.isArray(c.gastosExtra) ? c.gastosExtra : []).reduce((acc, g) => acc + Number(g.monto || 0), 0);
      const inversion = Number(c.totalCosto || 0);
      const gastos = inversion + gastosExtra;
      const neto = ingresos - gastos;
      const cur = group.get(id) || { name, Ingresos: 0, Gastos: 0, Neto: 0 };
      cur.Ingresos += ingresos;
      cur.Gastos += gastos;
      cur.Neto += neto;
      group.set(id, cur);
    }
    return Array.from(group.values());
  }, [filtered]);

  const handleToggleAll = (checked) => {
    setAllSelected(checked);
    if (checked) {
      setSelectedManzanas({});
    }
  };

  const handleToggleOne = (id, checked) => {
    const next = { ...selectedManzanas, [id]: checked };
    // si alguno está en true, allSelected false; si ninguno, set allSelected true
    const any = Object.values(next).some(v => v);
    setAllSelected(!any);
    setSelectedManzanas(next);
  };

  return (
    <div className={styles.container}>
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Gráficas</span>
        <div className={styles.topBarRow}>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/cosechas')}>Regresar</button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.controls}>
          <select className={styles.inputDark} value={metric} onChange={(e)=> setMetric(e.target.value)}>
            <option value="Ingresos">Ingresos</option>
            <option value="Neto">Neto</option>
            <option value="Gastos">Gastos</option>
          </select>
          <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={compareIG} onChange={(e)=> setCompareIG(e.target.checked)} />
            Comparar Ingresos y Gastos
          </label>
          <select className={styles.inputDark} value={dateFilterType} onChange={(e)=> setDateFilterType(e.target.value)}>
            <option value="ultimos">Últimos N meses/año</option>
            <option value="dia">Por día</option>
            <option value="mes">Por mes</option>
            <option value="anio">Por año</option>
            <option value="todos">Todas las fechas</option>
          </select>
          {dateFilterType === 'dia' && (
            <input className={styles.inputDark} type="date" value={dateDay} onChange={(e)=> setDateDay(e.target.value)} />
          )}
          {dateFilterType === 'mes' && (
            <input className={styles.inputDark} type="month" value={dateMonth} onChange={(e)=> setDateMonth(e.target.value)} />
          )}
          {dateFilterType === 'anio' && (
            <input className={styles.inputDark} type="number" placeholder="Año (YYYY)" value={dateYear} onChange={(e)=> setDateYear(e.target.value)} />
          )}
          {dateFilterType === 'ultimos' && (
            <select className={styles.inputDark} value={lastMonths} onChange={(e)=> setLastMonths(e.target.value)}>
              <option value="1">Último mes</option>
              <option value="2">Últimos 2 meses</option>
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Último año</option>
            </select>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={allSelected} onChange={(e)=> handleToggleAll(e.target.checked)} />
            Todas las manzanas
          </label>
          {!allSelected && (
            <div className={styles.checkboxList}>
              {manzanas.map(m => (
                <label key={m.id} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <input type="checkbox" checked={!!selectedManzanas[m.id]} onChange={(e)=> handleToggleOne(m.id, e.target.checked)} />
                  {m.nombre}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>Serie: {compareIG ? 'Ingresos y Gastos' : metric}</div>
          {loading && <div>Cargando…</div>}
        </div>
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `Q.${Number(v||0).toFixed(2)}`} />
              <Legend />
              {compareIG ? (
                <>
                  <Bar dataKey="Ingresos" fill="#2e7d32" name="Ingresos" />
                  <Bar dataKey="Gastos" fill="#c62828" name="Gastos" />
                </>
              ) : (
                <Bar dataKey={metric} fill={metric === 'Gastos' ? '#c62828' : metric === 'Neto' ? '#1565c0' : '#2e7d32'} name={metric} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
