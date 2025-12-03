import React, { useState } from 'react';
import styles from './Login.module.css';
import { getBackendUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';

// Registro simplificado: siempre rol agricultor, sin plan ni comprobante.
export default function RegistroSuscripcion() {
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'agricultor' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!form.username || !form.email || !form.password) { setMsg('Completa todos los datos'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Cuenta creada. Inicia sesión para elegir tu plan.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setMsg(data.message || 'Error al crear cuenta');
      }
    } catch (e) {
      setMsg('Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>Crear cuenta</h2>
        {msg && <p style={{ marginBottom: 8 }}>{msg}</p>}
        <form onSubmit={onSubmit} className={styles.registerForm}>
          <input type="text" placeholder="Usuario" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} required />
          <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input type="password" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          <div style={{ fontSize:'0.85rem', marginTop:4, color:'#0b5b02' }}>Rol asignado: Agricultor</div>
          <button style={{ marginTop:14 }} className={styles.loginButton} disabled={loading} type="submit">
            {loading? 'Creando…' : 'Crear cuenta'}
          </button>
          <div className={styles.linkRow}>
            <span className={styles.linkText} onClick={() => navigate('/login')}>Volver al inicio de sesión</span>
          </div>
        </form>
      </div>
    </div>
  );
}
