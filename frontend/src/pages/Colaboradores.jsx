import React, { useEffect, useState } from 'react';
import dashStyles from './Dashboard.module.css';
import styles from './Colaboradores.module.css';
import { getBackendUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Colaboradores() {
  const [colabs, setColabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const [msg, setMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ username:'', email:'', password:'' });
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const cargar = async () => {
    setLoading(true); setMsg('');
    try {
      const t = localStorage.getItem('token');
      const res = await fetch(`${getBackendUrl()}/auth/mis-colaboradores`, { headers:{ Authorization:`Bearer ${t}` }});
      const data = await res.json();
      if (res.ok) setColabs(data); else setMsg(data.message || 'Error obteniendo colaboradores');
    } catch { setMsg('Error de red'); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const t = localStorage.getItem('token');
      const res = await fetch(`${getBackendUrl()}/auth/colaboradores`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) { setForm({ username:'', email:'', password:'' }); cargar(); setMsg('Colaborador creado'); }
      else setMsg(data.message || 'Error creando colaborador');
    } catch { setMsg('Error de red'); }
  };

  const iniciarEdicion = (c) => {
    setEditingId(c._id);
    setEditData({ username: c.username, email: c.email, password:'' });
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setEditData({ username:'', email:'', password:'' });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setMsg('');
    try {
      const t = localStorage.getItem('token');
      const payload = { username: editData.username, email: editData.email };
      if (editData.password.trim()) payload.password = editData.password.trim();
      const res = await fetch(`${getBackendUrl()}/auth/colaboradores/${editingId}`, {
        method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Colaborador actualizado');
        setColabs(colabs.map(c => c._id === editingId ? { ...c, username: payload.username, email: payload.email } : c));
        cancelarEdicion();
      } else {
        setMsg(data.message || 'Error actualizando');
      }
    } catch { setMsg('Error de red'); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('Eliminar colaborador?')) return;
    try {
      const t = localStorage.getItem('token');
      const res = await fetch(`${getBackendUrl()}/auth/colaboradores/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${t}` }});
      const data = await res.json();
      if (res.ok) { setColabs(colabs.filter(c => c._id !== id)); }
      else alert(data.message || 'Error eliminando');
    } catch { alert('Error de red'); }
  };

  if (!['agricultor','admin'].includes(role)) {
    return (
      <div style={{ padding:16 }}>
        <div className={dashStyles.topBar}>
          <span className={dashStyles.titulo}>Colaboradores</span>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
        </div>
        <p style={{ marginTop:16 }}>Solo el agricultor o admin pueden gestionar colaboradores.</p>
      </div>
    );
  }

  const limite = colabs.length >= (role === 'admin' ? 5 : 2);

  return (
    <div className={styles.wrapper}>
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Mis Colaboradores</span>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
          {!limite && (
            <button
              type='button'
              className={dashStyles.btnAgregarManzana}
              onClick={() => setShowAddForm(v => !v)}
            >{showAddForm ? 'Cerrar formulario' : 'Agregar colaborador'}</button>
          )}
        </div>
      </div>
      {msg && <p style={{ color: msg.toLowerCase().includes('error') ? '#c0392b' : '#2ecc71', marginTop:4 }}>{msg}</p>}
      {limite && <div className={styles.badgeLimit}>Límite alcanzado ({role === 'admin' ? 5 : 2})</div>}

      {showAddForm && !limite && (
        <div className={styles.addFormWrapper}>
          <h3>Nuevo colaborador</h3>
          <form onSubmit={crear} className={styles.formGrid}>
            <input placeholder='Usuario' value={form.username} onChange={e => setForm({ ...form, username:e.target.value })} required />
            <input type='email' placeholder='Email' value={form.email} onChange={e => setForm({ ...form, email:e.target.value })} required />
            <input type='password' placeholder='Contraseña' value={form.password} onChange={e => setForm({ ...form, password:e.target.value })} required />
            <div style={{ display:'flex', gap:10 }}>
              <button disabled={loading} className={styles.saveBtn} type='submit'>Crear</button>
              <button type='button' className={styles.cancelBtn} onClick={() => { setShowAddForm(false); }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading && <p style={{ marginTop:12 }}>Cargando…</p>}
      <div className={styles.cardsGrid}>
        {colabs.map(c => {
          const enEdicion = editingId === c._id;
          return (
            <div key={c._id} className={styles.colCard}>
              <div className={styles.colHeader}>{c.username}</div>
              <div className={styles.colEmail}>{c.email}</div>
              {enEdicion && (
                <div className={styles.editSection}>
                  <h4>Editar colaborador</h4>
                  <form onSubmit={guardarEdicion}>
                    <div className={styles.editGrid}>
                      <input value={editData.username} onChange={e => setEditData({ ...editData, username:e.target.value })} placeholder='Usuario' required />
                      <input type='email' value={editData.email} onChange={e => setEditData({ ...editData, email:e.target.value })} placeholder='Email' required />
                      <input type='password' value={editData.password} onChange={e => setEditData({ ...editData, password:e.target.value })} placeholder='Nueva contraseña (opcional)' />
                    </div>
                    <div className={styles.editActions}>
                      <button type='submit' className={styles.saveBtn}>Guardar</button>
                      <button type='button' className={styles.cancelBtn} onClick={cancelarEdicion}>Cancelar</button>
                    </div>
                  </form>
                </div>
              )}
              <div className={styles.actions}>
                {!enEdicion && <button className={`${styles.btn} ${styles.editBtn}`} onClick={() => iniciarEdicion(c)}>Editar</button>}
                {!enEdicion && <button className={`${styles.btn} ${styles.delete}`} onClick={() => eliminar(c._id)}>Eliminar</button>}
                {enEdicion && <button className={`${styles.btn} ${styles.delete}`} onClick={cancelarEdicion}>Cerrar edición</button>}
              </div>
            </div>
          );
        })}
        {colabs.length === 0 && !loading && <p style={{ marginTop:12 }}>No hay colaboradores.</p>}
      </div>
    </div>
  );
}
