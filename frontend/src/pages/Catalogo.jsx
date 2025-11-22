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
  librasPorBolsa: '', // sólo para semillas
  nota: '', // nota opcional
  archivo: null,
};

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); // modal crear
  const [editing, setEditing] = useState(null); // item en edición
  const [editForm, setEditForm] = useState(emptyForm);
  const [detalleProducto, setDetalleProducto] = useState(null);
  // Nuevos estados para búsqueda y filtro por tipo
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState(''); // '' = todos
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
        fd.append('precio', String(Math.round(Number(form.precio) || 0)));
        if (form.tipo === 'veneno') {
          fd.append('presentacion', form.presentacion);
          if (form.copasPorUnidad) fd.append('copasPorUnidad', form.copasPorUnidad);
        }
        if (form.tipo === 'semillas') {
          fd.append('presentacion', form.presentacion);
          if (form.librasPorBolsa) fd.append('librasPorBolsa', form.librasPorBolsa);
        }
        if (form.nota) fd.append('nota', form.nota);
        fd.append('imagen', form.archivo);
        res = await fetch(`${getBackendUrl()}/api/catalogo/upload`, {
          method: 'POST',
          body: fd,
        });
      } else {
        const payload = {
          nombre: form.nombre,
          tipo: form.tipo,
          precio: Math.round(Number(form.precio) || 0),
          presentacion: (form.tipo === 'veneno' || form.tipo === 'semillas') ? form.presentacion : undefined,
          copasPorUnidad: form.tipo === 'veneno' ? Number(form.copasPorUnidad || 0) : undefined,
          librasPorBolsa: form.tipo === 'semillas' ? Number(form.librasPorBolsa || 0) : undefined,
          nota: form.nota || undefined,
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
      librasPorBolsa: String(item.librasPorBolsa ?? ''),
      nota: item.nota || '',
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
        fd.append('precio', String(Math.round(Number(editForm.precio) || 0)));
        if (editForm.tipo === 'veneno') {
          fd.append('presentacion', editForm.presentacion);
          if (editForm.copasPorUnidad) fd.append('copasPorUnidad', editForm.copasPorUnidad);
        }
        if (editForm.tipo === 'semillas') {
          fd.append('presentacion', editForm.presentacion);
          if (editForm.librasPorBolsa) fd.append('librasPorBolsa', editForm.librasPorBolsa);
        }
        if (editForm.nota) fd.append('nota', editForm.nota);
        fd.append('imagen', editForm.archivo);
        res = await fetch(`${getBackendUrl()}/api/catalogo/${editing._id}/upload`, {
          method: 'PUT',
          body: fd,
        });
      } else {
        const payload = {
          nombre: editForm.nombre,
          tipo: editForm.tipo,
          precio: Math.round(Number(editForm.precio) || 0),
          presentacion: (editForm.tipo === 'veneno' || editForm.tipo === 'semillas') ? editForm.presentacion : undefined,
          copasPorUnidad: editForm.tipo === 'veneno' ? Number(editForm.copasPorUnidad || 0) : undefined,
          librasPorBolsa: editForm.tipo === 'semillas' ? Number(editForm.librasPorBolsa || 0) : undefined,
          nota: editForm.nota || undefined,
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

  // Cerrar con ESC cualquiera de los modales abiertos
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (showForm) setShowForm(false);
        if (editing) cancelEdit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showForm, editing]);

  const closeCreateModal = () => setShowForm(false);
  const closeEditModal = () => cancelEdit();

  // Filtrado por nombre y tipo
  const itemsFiltrados = items
    .filter(it => it.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .filter(it => filtroTipo ? it.tipo === filtroTipo : true);

  return (
    <div className={catalogoStyles.catalogoContainer}>
      {/* Top bar estilo Dashboard */}
      <div className={dashStyles.topBar}>
        <span className={dashStyles.titulo}>Mi Catálogo</span>
        <div className={dashStyles.searchBarContainer} style={{ gap: 8 }}>
          <div className={dashStyles.searchInputWrapper}>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={dashStyles.searchInput}
            />
            {/* Reutilizamos el icono de dashboard si existe */}
            {/* <FaSearch className={dashStyles.searchIcon} /> */}
          </div>
          <button className={dashStyles.btnAgregarManzana} onClick={() => setMostrarFiltros(s => !s)}>
            {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
          </button>
          <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/dashboard')}>Regresar</button>
          <button className={dashStyles.btnAgregarManzana} onClick={() => setShowForm(true)}>
            Agregar producto
          </button>
        </div>
      </div>
      {mostrarFiltros && (
        <div className={dashStyles.topBar} style={{ marginTop: 8, flexWrap: 'wrap', alignItems: 'center', color: '#fff' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', color: '#fff' }}>
            <label style={{ color: '#fff' }}>Tipo:</label>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              style={{ padding: 4, background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4 }}
            >
              <option value=''>Todos</option>
              <option value='veneno'>Veneno</option>
              <option value='abono'>Abono</option>
              <option value='material'>Material</option>
              <option value='semillas'>Semillas</option>
            </select>
            <button
              className={dashStyles.btnAgregarManzana}
              onClick={() => { setFiltroTipo(''); setBusqueda(''); }}
            >Limpiar</button>
          </div>
        </div>
      )}
      {/* Modal crear producto */}
      {showForm && (
        <div className={catalogoStyles.modalOverlayCatalogo} onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}>
          <div className={catalogoStyles.modalCatalogo}>
            <button type="button" className={catalogoStyles.cerrarModalBtn} onClick={closeCreateModal}>Cerrar</button>
            <h4 style={{marginTop:0, marginBottom:12}}>Nuevo producto</h4>
            <form onSubmit={onSubmit} className={catalogoStyles.formWrap + ' noGrid'}>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required className={catalogoStyles.fieldFull} />
        <select name="tipo" value={form.tipo} onChange={onChange}>
          <option value="veneno">Veneno</option>
          <option value="abono">Abono</option>
          <option value="material">Material</option>
          <option value="semillas">Semillas</option>
        </select>
  <input name="precio" type="number" step="1" placeholder="Precio (Q)" value={form.precio} onChange={onChange} required className={catalogoStyles.fieldFull} />
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
        {form.tipo === 'semillas' && (
          <div className={catalogoStyles.row2}>
            <select name="presentacion" value={form.presentacion} onChange={onChange}>
              <option value="bolsa">Bolsa</option>
              <option value="cubeta">Cubeta</option>
            </select>
            <input
              name="librasPorBolsa"
              type="number"
              step="0.01"
              placeholder="Libras por presentación"
              value={form.librasPorBolsa}
              onChange={onChange}
            />
          </div>
        )}
        <textarea
          name="nota"
          placeholder="Nota (solo visible en detalles)"
          value={form.nota}
          onChange={onChange}
          rows={3}
          style={{ resize:'vertical', width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#0e0e0e' }}
        />
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
          <button type="button" className={catalogoStyles.dangerBtn} onClick={closeCreateModal}>Cancelar</button>
        </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className={catalogoStyles.modalOverlayCatalogo} onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className={catalogoStyles.modalCatalogo}>
            <button type="button" className={catalogoStyles.cerrarModalBtn} onClick={closeEditModal}>Cerrar</button>
            <h4 style={{marginTop:0, marginBottom:12}}>Editar producto</h4>
            <form onSubmit={onSubmitEdit} className={catalogoStyles.editWrap + ' noGrid'}>
            <input name="nombre" placeholder="Nombre" value={editForm.nombre} onChange={onEditChange} required className={catalogoStyles.fieldFull} />
            <select name="tipo" value={editForm.tipo} onChange={onEditChange}>
              <option value="veneno">Veneno</option>
              <option value="abono">Abono</option>
              <option value="material">Material</option>
              <option value="semillas">Semillas</option>
            </select>
            <input name="precio" type="number" step="1" placeholder="Precio (Q)" value={editForm.precio} onChange={onEditChange} required className={catalogoStyles.fieldFull} />
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
            {editForm.tipo === 'semillas' && (
              <div className={catalogoStyles.row2}>
                <select name="presentacion" value={editForm.presentacion} onChange={onEditChange}>
                  <option value="bolsa">Bolsa</option>
                  <option value="cubeta">Cubeta</option>
                </select>
                <input
                  name="librasPorBolsa"
                  type="number"
                  step="0.01"
                  placeholder="Libras por presentación"
                  value={editForm.librasPorBolsa}
                  onChange={onEditChange}
                />
              </div>
            )}
            <textarea
              name="nota"
              placeholder="Nota (solo visible en detalles)"
              value={editForm.nota}
              onChange={onEditChange}
              rows={3}
              style={{ resize:'vertical', width:'100%', padding:'10px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.06)', color:'#0e0e0e' }}
            />
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
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Productos</h3>
      <div className={catalogoStyles.catalogoGrid}>
        {itemsFiltrados.map((it) => {
          const imageSrc = it.imagen
            ? (it.imagen.startsWith('/uploads') ? `${getBackendUrl()}${it.imagen}` : it.imagen)
            : null;
          return (
            <div
              key={it._id}
              className={catalogoStyles.catalogoCard}
              onClick={(e) => {
                // Evitar apertura de detalles si se hace click en botones internos
                if ((e.target.tagName === 'BUTTON')) return;
                setDetalleProducto(it);
              }}
            >
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
              <div style={{ fontSize: 13, marginTop: 4 }}>Precio: <strong>Q.{Math.round(Number(it.precio) || 0)}</strong></div>
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
      {detalleProducto && (
        <div className={catalogoStyles.modalOverlayCatalogo} onClick={(e)=>{ if(e.target===e.currentTarget) setDetalleProducto(null); }}>
          <div className={catalogoStyles.modalCatalogo}>
            <button type="button" className={catalogoStyles.cerrarModalBtn} onClick={()=>setDetalleProducto(null)}>Cerrar</button>
            <h3 style={{marginTop:0}}>{detalleProducto.nombre}</h3>
            <p style={{margin:'4px 0 8px', fontSize:13}}>Tipo: <strong>{detalleProducto.tipo}</strong></p>
            {detalleProducto.tipo==='veneno' && (
              <>
                {detalleProducto.presentacion && <p style={{margin:'2px 0', fontSize:13}}>Presentación: {detalleProducto.presentacion}</p>}
                {detalleProducto.copasPorUnidad!=null && <p style={{margin:'2px 0', fontSize:13}}>Copas por unidad: {detalleProducto.copasPorUnidad}</p>}
              </>
            )}
            {detalleProducto.tipo==='semillas' && detalleProducto.librasPorBolsa!=null && (
              <p style={{margin:'2px 0', fontSize:13}}>Libras por bolsa: {detalleProducto.librasPorBolsa}</p>
            )}
            <p style={{margin:'8px 0', fontSize:14}}>Precio: <strong>Q.{Math.round(Number(detalleProducto.precio)||0)}</strong></p>
            {detalleProducto.imagen && (
              <img src={detalleProducto.imagen.startsWith('/uploads')?`${getBackendUrl()}${detalleProducto.imagen}`:detalleProducto.imagen} alt={detalleProducto.nombre} style={{width:'100%', maxHeight:230, objectFit:'cover', borderRadius:14, marginBottom:12}} />
            )}
            <div style={{textAlign:'left'}}>
              <h4 style={{margin:'4px 0 6px'}}>Nota</h4>
              <p style={{whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.4}}>{detalleProducto.nota?.trim() ? detalleProducto.nota : 'Sin nota.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
