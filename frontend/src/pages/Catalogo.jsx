import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dashStyles from './Dashboard.module.css';
import catalogoStyles from './Catalogo.module.css';
import { getBackendUrl } from '../utils/api';

const emptyForm = {
  nombre: '',
  tipo: 'veneno',
  precio: '',
  presentacion: 'litro',
  copasPorUnidad: '40',
  archivo: null,
};

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // item en edición
  const [editForm, setEditForm] = useState(emptyForm);
  const navigate = useNavigate();

  const load = async () => {
    try {
  const res = await fetch(`${getBackendUrl()}/api/catalogo`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error('Error cargando catálogo', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (form.archivo) {
        const fd = new FormData();
        fd.append('nombre', form.nombre);
        fd.append('tipo', form.tipo);
        fd.append('precio', form.precio);
        if (form.tipo === 'veneno') {
          fd.append('presentacion', form.presentacion);
          if (form.copasPorUnidad) fd.append('copasPorUnidad', form.copasPorUnidad);
        }
        fd.append('imagen', form.archivo);
        res = await fetch(`${getBackendUrl()}/api/catalogo/upload`, {
          method: 'POST',
          body: fd,
        });
      } else {
        const payload = {
          nombre: form.nombre,
          tipo: form.tipo,
          precio: Number(form.precio) || 0,
          presentacion: form.tipo === 'veneno' ? form.presentacion : undefined,
          copasPorUnidad: form.tipo === 'veneno' ? Number(form.copasPorUnidad || 0) : undefined,
        };
        res = await fetch(`${getBackendUrl()}/api/catalogo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        setForm(emptyForm);
        await load();
      } else {
        console.error('Error creando producto');
      }
    } catch (e) {
      console.error('Error creando producto', e);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
  const res = await fetch(`${getBackendUrl()}/api/catalogo/${id}`, { method: 'DELETE' });
      if (res.ok) await load();
    } catch (e) {
      console.error('Error eliminando', e);
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setEditForm({
      nombre: item.nombre || '',
      tipo: item.tipo || 'veneno',
      precio: String(item.precio ?? ''),
      presentacion: item.presentacion || 'litro',
      copasPorUnidad: String(item.copasPorUnidad ?? ''),
      archivo: null,
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditForm(emptyForm);
  };

  const onSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    try {
      let res;
      if (editForm.archivo) {
        const fd = new FormData();
        fd.append('nombre', editForm.nombre);
        fd.append('tipo', editForm.tipo);
        fd.append('precio', editForm.precio);
        if (editForm.tipo === 'veneno') {
          fd.append('presentacion', editForm.presentacion);
          if (editForm.copasPorUnidad) fd.append('copasPorUnidad', editForm.copasPorUnidad);
        }
        fd.append('imagen', editForm.archivo);
        res = await fetch(`${getBackendUrl()}/api/catalogo/${editing._id}/upload`, {
          method: 'PUT',
          body: fd,
        });
      } else {
        const payload = {
          nombre: editForm.nombre,
          tipo: editForm.tipo,
          precio: Number(editForm.precio) || 0,
          presentacion: editForm.tipo === 'veneno' ? editForm.presentacion : undefined,
          copasPorUnidad: editForm.tipo === 'veneno' ? Number(editForm.copasPorUnidad || 0) : undefined,
        };
        res = await fetch(`${getBackendUrl()}/api/catalogo/${editing._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        await load();
        cancelEdit();
      } else {
        console.error('Error actualizando producto');
      }
    } catch (err) {
      console.error('Error actualizando producto', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={catalogoStyles.catalogoContainer}>
      {/* Top bar estilo Dashboard */}
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Mi Catálogo</span>
        <div>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
          <button className={dashStyles.btnAgregarManzana} style={{ marginLeft: 8 }} onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Ocultar formulario' : 'Agregar producto'}
          </button>
        </div>
      </div>
      
  {showForm && (
  <form onSubmit={onSubmit} className={catalogoStyles.formWrap}>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required className={catalogoStyles.fieldFull} />
        <select name="tipo" value={form.tipo} onChange={onChange}>
          <option value="veneno">Veneno</option>
          <option value="abono">Abono</option>
          <option value="material">Material</option>
        </select>
        <input name="precio" type="number" step="0.01" placeholder="Precio" value={form.precio} onChange={onChange} required />
        {form.tipo === 'veneno' && (
          <div className={catalogoStyles.row2}>
            <select name="presentacion" value={form.presentacion} onChange={onChange}>
              <option value="litro">Litro</option>
              <option value="bolsa">Bolsa</option>
              <option value="galon">Galón</option>
              <option value="caneca">Caneca</option>
            </select>
            <input
              name="copasPorUnidad"
              type="number"
              step="0.01"
              placeholder="Copas por unidad (ej. 40 para litro)"
              value={form.copasPorUnidad}
              onChange={onChange}
            />
          </div>
        )}
        <div className={catalogoStyles.uploadBlock}>
          <label>O subir archivo / tomar foto</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setForm(f => ({ ...f, archivo: file }));
            }}
          />
          {form.archivo && (
            <img src={URL.createObjectURL(form.archivo)} alt="preview" className={catalogoStyles.previewImage} />
          )}
        </div>
        <div className={catalogoStyles.formActions}>
          <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </form>
      )}

      {editing && (
        <div className={catalogoStyles.editWrap}>
          <h4>Editar producto</h4>
          <form onSubmit={onSubmitEdit}>
            <input name="nombre" placeholder="Nombre" value={editForm.nombre} onChange={onEditChange} required className={catalogoStyles.fieldFull} />
            <select name="tipo" value={editForm.tipo} onChange={onEditChange}>
              <option value="veneno">Veneno</option>
              <option value="abono">Abono</option>
              <option value="material">Material</option>
            </select>
            <input name="precio" type="number" step="0.01" placeholder="Precio" value={editForm.precio} onChange={onEditChange} required />
            {editForm.tipo === 'veneno' && (
              <div className={catalogoStyles.row2}>
                <select name="presentacion" value={editForm.presentacion} onChange={onEditChange}>
                  <option value="litro">Litro</option>
                  <option value="bolsa">Bolsa</option>
                  <option value="galon">Galón</option>
                  <option value="caneca">Caneca</option>
                </select>
                <input
                  name="copasPorUnidad"
                  type="number"
                  step="0.01"
                  placeholder="Copas por unidad"
                  value={editForm.copasPorUnidad}
                  onChange={onEditChange}
                />
              </div>
            )}
            <div className={catalogoStyles.uploadBlock}>
              <label>Subir nueva imagen (opcional)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setEditForm(f => ({ ...f, archivo: file }));
                }}
              />
              {editForm.archivo && (
                <img src={URL.createObjectURL(editForm.archivo)} alt="preview" className={catalogoStyles.previewImage} />
              )}
            </div>
            <div className={catalogoStyles.formActions}>
              <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
              <button type="button" onClick={cancelEdit} className={catalogoStyles.dangerBtn}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Productos</h3>
      <div className={catalogoStyles.catalogoGrid}>
        {items.map((it) => {
          const imageSrc = it.imagen
            ? (it.imagen.startsWith('/uploads') ? `${getBackendUrl()}${it.imagen}` : it.imagen)
            : null;
          return (
            <div key={it._id} className={catalogoStyles.catalogoCard}>
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={it.nombre}
                  className={catalogoStyles.catalogoImg}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  height: 140,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#222,#444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  letterSpacing: 1,
                  color: '#bbb'
                }}>Sin imagen</div>
              )}
              <div style={{ fontWeight: 600, marginTop: 10, fontSize: 16 }}>{it.nombre}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Tipo: {it.tipo}</div>
              {it.presentacion && <div style={{ fontSize: 13, opacity: 0.9 }}>Presentación: {it.presentacion}</div>}
              <div style={{ fontSize: 13, marginTop: 4 }}>Precio: <strong>${Number(it.precio).toFixed(2)}</strong></div>
              <div className={catalogoStyles.catalogoBtnRow}>
                <button
                  onClick={() => startEdit(it)}
                  style={{
                    background: '#2980b9',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 10px',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >Editar</button>
                <button
                onClick={() => onDelete(it._id)}
                style={{
                  background: '#c0392b',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
