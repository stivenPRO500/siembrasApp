import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashStyles from './Dashboard.module.css';
import { getBackendUrl } from '../utils/api';

export default function Cosechas() {
  const [cosechas, setCosechas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/cosechas`);
        const data = await res.json();
        setCosechas(data);
      } catch (e) {
        console.error('Error obteniendo cosechas', e);
      }
    };
    load();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Cosechas</span>
        <div>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {cosechas.map(c => (
          <div key={c._id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, background:'#fff' }}>
            <div style={{ fontWeight: 600 }}>Manzana: {c.manzana?.nombre || 'N/A'}</div>
            <div>Fecha: {new Date(c.fechaCosecha || c.createdAt).toLocaleDateString()}</div>
            <div>Total costo: Q.{Math.round(Number(c.totalCosto || 0))}</div>
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor:'pointer' }}>Ver actividades ({c.actividades.length})</summary>
              <ul style={{ marginTop: 8 }}>
                {c.actividades.map((a,i) => (
                  <li key={i}>
                    {a.tipo} - {a.fechaRealizacion ? new Date(a.fechaRealizacion).toLocaleDateString() : 'Sin fecha'} - Q.{Math.round(Number(a.costoTotal||0))}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
        {cosechas.length === 0 && <p>No hay cosechas todavía.</p>}
      </div>
    </div>
  );
}
