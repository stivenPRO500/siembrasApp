import React, { useState, useEffect, useMemo } from 'react';
import dashStyles from './Dashboard.module.css';
import { getBackendUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const planInfo = {
  '1m': { label: '1 mes', precio: 50, dias: 30 },
  '3m': { label: '3 meses', precio: 140, dias: 90 },
  '1y': { label: '1 año', precio: 500, dias: 365 }
};

export default function Suscripcion() {
  const [plan, setPlan] = useState('1m');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const suspendido = localStorage.getItem('suscripcionSuspendido') === 'true';
  const requiereSuscripcion = localStorage.getItem('requiereSuscripcion') === 'true';
  const suscripcionExpira = localStorage.getItem('suscripcionExpira');
  const enGracia = localStorage.getItem('enGracia') === 'true';
  const [tieneActiva, setTieneActiva] = useState(false);

  // Determina estado de suscripción actual
  useEffect(() => {
    if (suscripcionExpira) {
      const expDate = new Date(suscripcionExpira);
      const now = new Date();
      if (expDate > now) {
        setTieneActiva(true);
      } else if (enGracia) {
        // En gracia consideramos activa parcial, pero dejamos visible aviso.
        setTieneActiva(false);
      } else {
        setTieneActiva(false);
      }
    } else {
      setTieneActiva(false);
    }
  }, [suscripcionExpira, enGracia]);

  const debeElegirPlan = useMemo(() => {
    // Solo agricultor elige plan. Si requiereSuscripcion es true o no tiene activa.
    if (role !== 'agricultor') return false;
    if (suspendido) return true; // suspendido necesita renovar.
    if (requiereSuscripcion) return true;
    if (!tieneActiva) return true;
    return false;
  }, [role, suspendido, requiereSuscripcion, tieneActiva]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!file) { setMsg('Adjunta el comprobante de pago.'); return; }
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('plan', plan);
      fd.append('comprobante', file);
      const res = await fetch(`${getBackendUrl()}/suscripciones/crear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Solicitud enviada. El administrador la revisará y aprobará.');
        try { localStorage.setItem('requiereSuscripcion', 'false'); } catch {}
        // Opcional: redirigir al dashboard
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setMsg(data.message || 'Error creando la suscripción');
      }
    } catch (e) {
      setMsg('Error de red');
    } finally {
      setLoading(false);
    }
  };

  if (role === 'usuario') {
    return (
      <div style={{ padding:16 }}>
        <div className={dashStyles.topBar}>
          <span className={dashStyles.titulo}>Suscripción</span>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
        </div>
        <p style={{ marginTop:16 }}>Tu acceso depende de la suscripción del agricultor. Pide al agricultor que gestione el pago.</p>
        {suspendido && <p style={{ color:'#c0392b' }}>La suscripción del agricultor está suspendida. Espera renovación.</p>}
      </div>
    );
  }
  // Agricultor con suscripción activa (no requiere renovar): mostrar resumen y botón volver.
  if (!debeElegirPlan) {
    return (
      <div style={{ padding:16 }}>
        <div className={dashStyles.topBar}>
          <span className={dashStyles.titulo}>Estado de suscripción</span>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/login')}>Volver</button>
        </div>
        {tieneActiva && suscripcionExpira && (
          <p style={{ marginTop:12 }}>Tu suscripción expira el <strong>{new Date(suscripcionExpira).toLocaleDateString()}</strong>.</p>
        )}
        {enGracia && (
          <p style={{ marginTop:12, color:'#e67e22' }}>Estás en periodo de gracia. Renueva ahora para no perder acceso.</p>
        )}
        {suspendido && (
          <p style={{ marginTop:12, color:'#c0392b' }}>Suspendida: debes crear una nueva solicitud.</p>
        )}
        <p style={{ marginTop:20 }}>Si necesitas cambiar de plan, espera a que caduque o contacta al administrador.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: 16 }}>
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Renueva o crea tu suscripción</span>
        <div>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/login')}>Volver</button>
        </div>
      </div>

      <p style={{ color:'#000000ff', marginTop:12, fontWeight: 'bold', backgroundColor: '#d803038a', padding: '8px', borderRadius: '4px' }}>
        {suspendido ? 'Tu suscripción está suspendida. Envía un nuevo pago para reactivarla.' : 'No tienes una suscripción activa. Elige un plan y sube el comprobante.'}
      </p>
      <div className={dashStyles.depositoInfo} style={{ marginTop: 8 }}>
        <strong>Datos para el depósito:</strong>
        <ul className={dashStyles.depositoInfoList}>
          <li className={dashStyles.depositoInfoItem}>
            <span className={dashStyles.depositoInfoBullet}></span>
            <span>
              Banco BAM · Cuenta de Ahorro No. <strong className={dashStyles.depositoCuenta}>40-5713949-0</strong>
            </span>
          </li>
          <li className={dashStyles.depositoInfoItem}>
            <span className={dashStyles.depositoInfoBullet}></span>
            <span>A nombre de <strong>Darwin Stiven Orellana Galeano</strong>.</span>
          </li>
          <li className={dashStyles.depositoInfoItem}>
            <span className={dashStyles.depositoInfoBullet}></span>
            <span>Adjunta una imagen nítida del comprobante de pago para su validación por el administrador.</span>
          </li>
        </ul>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems:'stretch' }}>
          {Object.entries(planInfo).map(([k, v]) => (
            <label
              key={k}
              className={`${dashStyles.actividadCard} ${plan===k ? dashStyles.selectedCard : ''}`}
              onClick={() => setPlan(k)}
            >
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800 }}>{v.label}</div>
                  <input type="radio" name="plan" value={k} checked={plan===k} onChange={() => setPlan(k)} style={{ display: 'none' }} />
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                  <span style={{ fontSize:28, fontWeight:800, color:'#0a5a02' }}>Q.{v.precio}</span>
                  <span style={{ fontSize:13, color:'#2c7a0a' }}>{v.dias} días</span>
                </div>
                <div style={{ fontSize:12, color:'#4b5c47' }}>Incluye soporte y actualizaciones durante el período.</div>
              </div>
            </label>
          ))}
        </div>

        <div className={dashStyles.actividadCard} style={{ marginTop:16, display:'flex', flexDirection:'column', alignItems:'stretch' }}>
          <label style={{ display:'block', marginBottom:8 }}>
            Adjunta comprobante de pago (imagen)
          </label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <div style={{ marginTop:16 }}>
          <button disabled={loading} className={dashStyles.btnAgregarManzana} type="submit">
            {loading ? 'Enviando…' : 'Enviar para aprobación'}
          </button>
        </div>
        {msg && <p style={{ marginTop:8 }}>{msg}</p>}
      </form>
    </div>
  );
}
