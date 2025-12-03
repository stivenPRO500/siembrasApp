import React, { useEffect, useState } from "react";
import { FaSearch } from 'react-icons/fa';
import { useParams, useNavigate } from "react-router-dom";
import dashStyles from "./Dashboard.module.css";

import { getBackendUrl } from '../utils/api';
import styles from "./Actividades.module.css";

// Reutilizamos componentes del Dashboard para unificar el formulario
function ProductoPicker({ productosCatalogo, productosSeleccionados, onAdd }) {
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState(0);
    const [unidad, setUnidad] = useState("copas");
    const [filtroProducto, setFiltroProducto] = useState("");
    const [mostrarLista, setMostrarLista] = useState(false);

    const opciones = productosCatalogo
        .filter((p) => !productosSeleccionados.some((s) => s.producto === p._id))
        .slice()
        .sort((a,b)=> (a.nombre||'').localeCompare(b.nombre||'', 'es', { sensitivity:'base' }))
        .filter(p => (p.nombre||'').toLowerCase().includes(filtroProducto.toLowerCase()));
    const prodSel = productosCatalogo.find((p) => p._id === productoId);

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.8fr' }}>
                <div style={{ position:'relative' }}>
                    <input
                        type="text"
                        placeholder="Producto..."
                        value={filtroProducto}
                        onChange={e=> { setFiltroProducto(e.target.value); setMostrarLista(true); }}
                        onFocus={()=> setMostrarLista(true)}
                        style={{width:'70%', padding:'6px 8px', border:'1px solid #ddd', borderRadius:6, fontSize:'0.9rem' }}
                    />
                    {mostrarLista && opciones.length > 0 && (
                        <div style={{ position:'absolute', top:'calc(100% + 3px)', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderRadius:6, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:140, overflowY:'auto', zIndex:30 }}>
                            {opciones.map(p => (
                                <div
                                    key={p._id}
                                    onMouseDown={() => {
                                        setFiltroProducto(`${p.nombre}${p.presentacion ? ` (${p.presentacion})` : ''}`);
                                        setProductoId(p._id);
                                        const prod = productosCatalogo.find(pp => pp._id === p._id);
                                        if (prod?.tipo === 'veneno') setUnidad('copas');
                                        else if (prod?.tipo === 'semillas') setUnidad('libras');
                                        else setUnidad('unidades');
                                        setMostrarLista(false);
                                    }}
                                    style={{ padding:'6px 8px', cursor:'pointer', fontSize:'0.9rem' }}
                                >{p.nombre} {p.presentacion ? `(${p.presentacion})` : ''}</div>
                            ))}
                        </div>
                    )}
                </div>
                <input type="number" min="0" width='100%' step="0.01" placeholder="Cant." value={cantidad} onChange={(e) => setCantidad(parseFloat(e.target.value))} style={{ padding:'6px 8px', fontSize:'0.9rem', width:'5ch' }} />
                {prodSel && prodSel.tipo === 'veneno' ? (
                    <select value={unidad} onChange={(e) => setUnidad(e.target.value)} style={{ width: "100%"}}>
                        <option value="copas">Copas</option>
                        <option value="unidades">Unidades</option>
                    </select>
                ) : prodSel && prodSel.tipo === 'semillas' ? (
                    <select value={unidad} onChange={(e) => setUnidad(e.target.value)} style={{ padding:'6px 8px', fontSize:'0.9rem',width: "100%" }}>
                        <option value="libras">Libras</option>
                        <option value="unidad">Unidad</option>
                    </select>
                ) : (
                    <span style={{fontSize: 12, color: '#666', display:'inline-block', width:'5ch', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{prodSel?.presentacion || 'unidades'}</span>
                )}
            </div>
            <div>
                <button type="button" className={dashStyles.btnAgregarManzana} onClick={() => {
                    if (!productoId) return;
                    onAdd({ producto: productoId, cantidad: Number(cantidad) || 0, unidad });
                    setProductoId("");
                    setCantidad(0);
                    setUnidad('copas');
                    setFiltroProducto("");
                    setMostrarLista(false);
                }}>Agregar producto</button>
            </div>
        </div>
    );
}

function ListaSeleccionados({ productosCatalogo, seleccionados, onRemove }) {
    return (
        <div style={{ marginTop: 4 }}>
            {seleccionados.map((sel) => {
                const prod = productosCatalogo.find((p) => p._id === sel.producto);
                if (!prod) return null;
                let unidadMostrar;
                if (prod.tipo === 'veneno') {
                    unidadMostrar = sel.unidad || 'copas';
                } else if (prod.tipo === 'semillas') {
                    unidadMostrar = sel.unidad === 'libras' ? 'libras' : 'unidad';
                } else {
                    unidadMostrar = prod.presentacion || 'unidades';
                }
                const cantidadTexto = `${Number(sel.cantidad || 0)} ${unidadMostrar}`;
                return (
                    <div key={sel.producto} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', background: '#fff', color: '#000', border: '1px solid #ddd', borderRadius: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#000' }}>
                            {prod.nombre} {prod.presentacion ? `(${prod.presentacion})` : ''} - {cantidadTexto}
                        </span>
                        <button type="button" onClick={() => onRemove(sel.producto)} style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>Quitar</button>
                    </div>
                );
            })}
        </div>
    );
}

const Actividades = () => {
    const { manzanaId } = useParams();
    const navigate = useNavigate();
    const [actividades, setActividades] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [actividadEditando, setActividadEditando] = useState(null);
    const [nuevoTipo, setNuevoTipo] = useState("");
    const [nuevaFecha, setNuevaFecha] = useState("");
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    // Productos y costos (igual que en Dashboard)
    const [productosSeleccionados, setProductosSeleccionados] = useState([]); // [{producto, cantidad, unidad?}]
    const [costoTrabajo, setCostoTrabajo] = useState(0);
    const [mostrarProductos, setMostrarProductos] = useState(false);
    const [nuevaFechaAlerta, setNuevaFechaAlerta] = useState("");
    // Estados para nombre personalizado (crear y editar)
    const [nuevoTipoPersonalizado, setNuevoTipoPersonalizado] = useState("");
    const [editarTipoPersonalizado, setEditarTipoPersonalizado] = useState("");
    const [actividadesAbiertas, setActividadesAbiertas] = useState({}); // { [actividadId]: true }
    // Filtros y orden
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState(""); // "" = todos
    const [orden, setOrden] = useState('desc'); // 'desc' = recientes->antiguas (default), 'asc' = antiguas->recientes
    const [busqueda, setBusqueda] = useState(""); // búsqueda por tipo de actividad

    useEffect(() => {
        fetchActividades();
        fetchCatalogo();
    }, [manzanaId]);

    const fetchActividades = async () => {
        try {
            const t = localStorage.getItem('token');
            const response = await fetch(`${getBackendUrl()}/actividades/${manzanaId}`, { headers:{ Authorization:`Bearer ${t}` } });
            if (response.status === 403) {
                console.warn('No autorizado para ver actividades de esta manzana');
                setActividades([]);
                return;
            }
            const data = await response.json();
            setActividades(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener actividades:", error);
        }
    };

    const fetchCatalogo = async () => {
        try {
            const t = localStorage.getItem('token');
            const response = await fetch(`${getBackendUrl()}/api/catalogo`, { headers:{ Authorization:`Bearer ${t}` } });
            const data = await response.json();
            setProductosCatalogo(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al obtener catálogo:", error);
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
 };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta actividad?")) {
            try {
                const t = localStorage.getItem('token');
                await fetch(`${getBackendUrl()}/actividades/${id}`, {
                    method: "DELETE",
                    headers:{ Authorization:`Bearer ${t}` }
                });
                setActividades(actividades.filter((actividad) => actividad._id !== id));
            } catch (error) {
                console.error("Error al eliminar la actividad:", error);
            }
        }
    };

    const toggleActividad = (id) => {
        setActividadesAbiertas((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleEdit = (actividad) => {
        setActividadEditando(actividad);
        setNuevoTipo(actividad.tipo);
        setEditarTipoPersonalizado("");
        setNuevaFecha(formatDate(actividad.fechaRealizacion));
        setNuevaFechaAlerta(actividad.fechaAlerta ? formatDate(actividad.fechaAlerta) : "");
        setProductosSeleccionados(actividad.productosUtilizados || []);
        setCostoTrabajo(actividad.costoTrabajo || 0);
        setMostrarProductos(false);
        setModalOpen(true);
    };

    const abrirNuevaActividad = () => {
        // Limpiar cualquier estado de edición previo antes de abrir nuevo formulario
        setActividadEditando(null);
        setNuevoTipo("");
        setNuevoTipoPersonalizado("");
        setNuevaFecha("");
        setNuevaFechaAlerta("");
        setProductosSeleccionados([]);
        setCostoTrabajo(0);
        setMostrarProductos(false);
        setModalOpen(true);
    };

    const cerrarModal = () => {
        // Al cancelar también limpiamos el estado para evitar que se reabra con datos viejos
        setModalOpen(false);
        setActividadEditando(null);
        setNuevoTipo("");
        setNuevoTipoPersonalizado("");
        setEditarTipoPersonalizado("");
        setNuevaFecha("");
        setNuevaFechaAlerta("");
        setProductosSeleccionados([]);
        setCostoTrabajo(0);
        setMostrarProductos(false);
    };

    const handleSave = async () => {
        if (!actividadEditando) return;
        const tipoElegido = nuevoTipo === '__personalizada__' ? editarTipoPersonalizado.trim() : nuevoTipo;
        if (!tipoElegido) return;
        // Preparar productos para enviar igual que en creación
        const productosParaEnviar = productosSeleccionados.map((p) => {
            const tipoProd = productosCatalogo.find(x => x._id === p.producto)?.tipo;
            let unidadEnviar = 'unidades';
            if (tipoProd === 'veneno') unidadEnviar = p.unidad || 'copas';
            else if (tipoProd === 'semillas') unidadEnviar = p.unidad || 'unidad'; // 'libras' o 'unidad'
            return {
                producto: p.producto,
                cantidad: Number(p.cantidad || 0),
                unidad: unidadEnviar,
            };
        });
        const payload = {
            tipo: tipoElegido,
            fechaRealizacion: nuevaFecha,
            fechaAlerta: nuevaFechaAlerta,
            productosUtilizados: productosParaEnviar,
            costoTrabajo: Math.round(Number(costoTrabajo) || 0),
        };
        try {
            const t = localStorage.getItem('token');
            const response = await fetch(`${getBackendUrl()}/actividades/${actividadEditando._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization:`Bearer ${t}` },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                await fetchActividades();
                setModalOpen(false);
                setActividadEditando(null);
                // limpiar estados
                setNuevoTipo('');
                setEditarTipoPersonalizado('');
                setNuevaFecha('');
                setProductosSeleccionados([]);
                setCostoTrabajo(0);
                setNuevaFechaAlerta("");
                setMostrarProductos(false);
            } else {
                console.error('Error al actualizar la actividad');
            }
        } catch (error) {
            console.error('Error al actualizar la actividad:', error);
        }
    };

    const handleSubmit = async () => {
        // Enviar cantidad y unidad; backend realiza conversion según copasPorUnidad (veneno) o libras (semillas)
        const tipoElegido = nuevoTipo === '__personalizada__' ? nuevoTipoPersonalizado.trim() : nuevoTipo;
        if (!tipoElegido) return;
        const productosParaEnviar = productosSeleccionados.map((p) => {
            const tipoProd = productosCatalogo.find(x => x._id === p.producto)?.tipo;
            let unidadEnviar = 'unidades';
            if (tipoProd === 'veneno') unidadEnviar = p.unidad || 'copas';
            else if (tipoProd === 'semillas') unidadEnviar = p.unidad || 'unidad';
            return {
                producto: p.producto,
                cantidad: Number(p.cantidad || 0),
                unidad: unidadEnviar,
            };
        });

        const nuevaActividad = {
            tipo: tipoElegido,
            fechaRealizacion: nuevaFecha,
            fechaAlerta: nuevaFechaAlerta,
            manzana: manzanaId,
            productosUtilizados: productosParaEnviar,
            costoTrabajo: Math.round(Number(costoTrabajo) || 0),
        };

        try {
            const t = localStorage.getItem('token');
            const response = await fetch(`${getBackendUrl()}/actividades`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:`Bearer ${t}`
                },
                body: JSON.stringify(nuevaActividad),
            });

            if (response.ok) {
                fetchActividades();
                setModalOpen(false);
                // reset form state
                setActividadEditando(null);
                setNuevoTipo("");
                setNuevoTipoPersonalizado("");
                setNuevaFecha("");
                setProductosSeleccionados([]);
                setCostoTrabajo(0);
                setNuevaFechaAlerta("");
                setMostrarProductos(false);
            } else {
                console.error('Error al crear la actividad');
            }
        } catch (error) {
            console.error('Error al enviar la actividad:', error);
        }
    };

    // Tipos disponibles (coinciden con opciones del formulario)
    const tiposActividadBase = [
        'Fumigar Gusano', 
        'Fumigar Rolla', 
        'Abonar', 
        'Sembrar',
        'Fumigar Monte',
        'Poner Manguera', 
        'Cortar', 
        'Inyectar', 
        'Tronquiar', 
        'Fumigar Gilote', 
        'Tractorar',
        'Revisar Manguera',
        'Quitar Manguera',
        'Poner Nailo',
        'Poner Manta',
        'Inyectar Abono'
    ];
    const tiposActividad = tiposActividadBase
        .slice()
        .sort((a,b)=> a.localeCompare(b,'es',{sensitivity:'base'}))
        .map(t=> t.toLowerCase());

    // Aplicar filtro por tipo y orden antes de renderizar
    const actividadesMostrar = actividades
        .filter((a) => (filtroTipo ? a.tipo === filtroTipo : true))
        .filter((a) => a.tipo.toLowerCase().includes(busqueda.toLowerCase()))
        .slice() // crear copia antes de ordenar
        .sort((a, b) => {
            const ta = new Date(a.fechaRealizacion || 0).getTime();
            const tb = new Date(b.fechaRealizacion || 0).getTime();
            return orden === 'desc' ? tb - ta : ta - tb;
        });

    return (
       
        <div className={styles.actividadesContainer}>
            {/* Top bar estilo Dashboard */}
            <div className={dashStyles.topBar}>
                <span className={dashStyles.titulo}>Mis Actividades</span>
                <div className={dashStyles.searchBarContainer} style={{ gap: 8 }}>
                    <div className={dashStyles.searchInputWrapper}>
                        <input
                            type="text"
                            placeholder="Buscar actividad..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={dashStyles.searchInput}
                        />
                        <FaSearch className={dashStyles.searchIcon} />
                    </div>
                    <button className={dashStyles.btnAgregarManzana} onClick={() => navigate("/dashboard")}>Regresar</button>
                    <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/cosechas')}>Ver cosechas</button>
                    <button className={dashStyles.btnAgregarManzana} onClick={() => setMostrarFiltros((s) => !s)}>Filtros</button>
                    <button className={dashStyles.btnAgregarManzana} onClick={abrirNuevaActividad}>Agregar actividad</button>
                    <button className={dashStyles.btnAgregarManzana} style={{ background:'#c0392b' }} onClick={async () => {
                                if(!window.confirm('¿Cosechar? Se vaciarán las actividades.')) return;
                                try {
                                    const t = localStorage.getItem('token');
                                    const res = await fetch(`${getBackendUrl()}/manzanas/cosechar/${manzanaId}`, { method: 'POST', headers:{ Authorization:`Bearer ${t}` } });
                                    if(res.ok){
                                        await fetchActividades();
                                        navigate('/cosechas');
                                    }
                                } catch(e){
                                    console.error('Error al cosechar', e);
                                }
                            }}>Cosechar</button>
                </div>
            </div>
            {/* Panel de filtros */}
            {mostrarFiltros && (
                <div className={dashStyles.topBar} style={{ marginTop: 8, flexWrap: 'wrap', alignItems: 'center', color: '#fff' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', color: '#fff' }}>
                        <label style={{ color: '#fff' }}>Tipo:</label>
                        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ padding: 4, background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4 }}>
                            <option value="">Todos</option>
                            {tiposActividad.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <label style={{ color: '#fff' }}>Orden:</label>
                        <select value={orden} onChange={(e) => setOrden(e.target.value)} style={{ padding: 4, background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4 }}>
                            <option value="desc">Recientes primero</option>
                            <option value="asc">Más antiguas primero</option>
                        </select>
                        <button className={dashStyles.btnAgregarManzana} onClick={() => { setFiltroTipo(''); setOrden('desc'); setBusqueda(''); }}>Limpiar</button>
                    </div>
                </div>
            )}
          
            <div className={styles.actividadesList}>
                {actividadesMostrar.length > 0 ? (
                    actividadesMostrar.map((actividad) => {
                        const abierta = !!actividadesAbiertas[actividad._id];
                        return (
                            <div
                                key={actividad._id}
                                className={styles.actividadCard}
                                onClick={() => toggleActividad(actividad._id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div>
                                    <h3>{actividad.tipo}</h3>
                                    <div className={styles.fechas}>
                                        <span>Fecha de Realización: {formatDate(actividad.fechaRealizacion)}</span>
                                    </div>
                                </div>
                                {!abierta && (
                                    <div className={styles.botones}>
                                        <button
                                            className={styles.editar}
                                            onClick={(e) => { e.stopPropagation(); handleEdit(actividad); }}
                                        >Editar</button>
                                        <button
                                            className={styles.eliminar}
                                            onClick={(e) => { e.stopPropagation(); handleDelete(actividad._id); }}
                                        >Eliminar</button>
                                    </div>
                                )}

                                {abierta && (
                                    <div style={{ marginTop: 8, fontSize: 14, width: '100%' }}>
                                        
                                        {Array.isArray(actividad.productosUtilizados) && actividad.productosUtilizados.length > 0 && (
                                            <>
                                                <strong>Productos utilizados:</strong>
                                                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                                                    {actividad.productosUtilizados.map((p, idx) => {
                                                        const prod = productosCatalogo.find((x) => x._id === p.producto);
                                                        const nombreProd = prod?.nombre || 'Producto';
                                                        let unidadMostrar;
                                                        if (prod?.tipo === 'veneno') {
                                                            unidadMostrar = p.unidad || 'copas';
                                                        } else if (prod?.tipo === 'semillas') {
                                                            unidadMostrar = p.unidad === 'libras' ? 'libras' : 'unidad';
                                                        } else {
                                                            unidadMostrar = 'unidades';
                                                        }
                                                        return (
                                                            <li key={idx}>
                                                                {nombreProd}{p.cantidad != null ? ` (${p.cantidad} ${unidadMostrar})` : ''} - Costo: Q.{Math.round(Number(p.costo || 0))}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </>
                                        )}{typeof actividad.costoTrabajo === 'number' && (
                                            <div style={{ marginBottom: 6 }}>
                                                <strong>Costo de trabajo:</strong> <span className={styles.moneda}>Q.</span>{Math.round(Number(actividad.costoTrabajo || 0))}
                                            </div>
                                        )}
                                        {typeof actividad.costoTotal === 'number' && (
                                            <div style={{ marginBottom: 6 }}>
                                                <strong>Costo total:</strong> <span className={styles.moneda}>Q.</span>{Math.round(Number(actividad.costoTotal || 0))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p>No hay actividades para esta manzana.</p>
                )}
            </div>

            {actividades.length > 0 && (
                <div className={styles.totalBox}>
                    Total invertido: Q.{Math.round(actividades.reduce((acc, a) => acc + (Number(a.costoTotal) || 0), 0))}
                </div>
            )}

            {modalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{actividadEditando ? 'Editar Actividad' : 'Nueva Actividad'}</h3>
                        <label>Tipo:</label>
                        <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} required>
                            <option value="" disabled hidden>Selecciona una actividad</option>
                            {tiposActividad.map((t) => (
                                <option key={t} value={t}>{t.replace(/\b\w/g, c=>c.toUpperCase())}</option>
                            ))}
                            <option value="__personalizada__">Personalizada…</option>
                        </select>
                        {nuevoTipo === '__personalizada__' && (
                            <input
                                type="text"
                                placeholder="Nombre de actividad"
                                value={nuevoTipoPersonalizado}
                                onChange={(e)=> setNuevoTipoPersonalizado(e.target.value)}
                                required
                                style={{ marginTop:8 }}
                            />
                        )}
                        <label>Fecha de Realización:</label>
                        <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} required />
                        <label>Fecha de Alerta:</label>
                        <input type="date" value={nuevaFechaAlerta} onChange={(e) => setNuevaFechaAlerta(e.target.value)} />
                        {/* Productos (opcional) */}
                        <div style={{ marginTop: 8 }}>
                            <button type="button" className={dashStyles.btnAgregarManzana} onClick={() => setMostrarProductos(!mostrarProductos)}>
                                {mostrarProductos ? 'Ocultar productos' : 'Agregar productos'}
                            </button>
                        </div>
                        {mostrarProductos && (
                            <div style={{ marginTop: 8 }}>
                                <h4>Productos utilizados</h4>
                                <ProductoPicker
                                    productosCatalogo={productosCatalogo}
                                    productosSeleccionados={productosSeleccionados}
                                    onAdd={(nuevo) => setProductosSeleccionados((prev) => [...prev, nuevo])}
                                />
                                <ListaSeleccionados
                                    productosCatalogo={productosCatalogo}
                                    seleccionados={productosSeleccionados}
                                    onRemove={(id) => setProductosSeleccionados((prev) => prev.filter((p) => p.producto !== id))}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <label style={{ display: 'block', marginBottom: 4 }}>Costo de trabajo (Q.)</label>
                                    <input type="number" step="1" min="0" value={costoTrabajo} onChange={(e) => setCostoTrabajo(parseInt(e.target.value,10) )} />
                                </div>
                            </div>
                        )}
                        <div className={styles.modalBotones}>
                            {actividadEditando ? (
                                <button className={styles.guardar} onClick={handleSave}>Guardar</button>
                            ) : (
                                <button className={styles.guardar} onClick={handleSubmit}>Crear</button>
                            )}
                            <button className={styles.cancelar} onClick={cerrarModal}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Actividades;
