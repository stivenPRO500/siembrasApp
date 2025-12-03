import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaClipboardList, FaSignOutAlt, FaSearch, FaArrowLeft } from "react-icons/fa"; // Agrega icono de regresar
import { getBackendUrl } from '../utils/api';

// Picker para agregar productos uno a uno
function ProductoPicker({ productosCatalogo, productosSeleccionados, onAdd }) {
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState(0);
    const [unidad, setUnidad] = useState("copas");
    const [filtroProducto, setFiltroProducto] = useState("");
    const [mostrarLista, setMostrarLista] = useState(false);
    // Defensivo: asegurar que siempre tratamos con arrays válidos
    const catalogoSeguro = Array.isArray(productosCatalogo) ? productosCatalogo : [];
    const opciones = catalogoSeguro
        .filter((p) => !productosSeleccionados.some((s) => s.producto === p._id))
        .slice()
        .sort((a,b)=> (a.nombre||'').localeCompare(b.nombre||'', 'es', { sensitivity:'base' }))
        .filter(p => (p.nombre||'').toLowerCase().includes(filtroProducto.toLowerCase()));
    const prodSel = catalogoSeguro.find((p) => p._id === productoId);

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.8fr'  }}>
                <div style={{ position:'relative' }}>
                    <input
                        type="text"
                        placeholder="Selecciona producto..."
                        value={filtroProducto}
                        onChange={e=> { setFiltroProducto(e.target.value); setMostrarLista(true); }}
                        onFocus={()=> setMostrarLista(true)}
                        style={{ width:'70%', padding:'6px 8px', border:'1px solid #ddd', borderRadius:6, fontSize:'0.9rem' }}
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
                    <select value={unidad} onChange={(e) => setUnidad(e.target.value)} style={{ width:'100%' }}>
                        <option value="copas">Copas</option>
                        <option value="unidades">Unidades</option>
                    </select>
                ) : prodSel && prodSel.tipo === 'semillas' ? (
                    <select value={unidad} onChange={(e) => setUnidad(e.target.value)} style={{ padding:'6px 8px', fontSize:'0.9rem', width:'100%' }}>
                        <option value="libras">Libras</option>
                        <option value="unidad">Unidad</option>
                    </select>
                ) : (
                    <span style={{ fontSize: 12, color: '#666', display:'inline-block', width:'5ch', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{prodSel?.presentacion || 'unidades'}</span>
                )}
            </div>
            <div>
                <button type="button" className={styles.btnAgregarManzana} onClick={() => {
                    if (!productoId) return;
                    const prod = productosCatalogo.find(p => p._id === productoId);
                    let unidadEnviar = 'unidades';
                    if (prod) {
                        if (prod.tipo === 'veneno') unidadEnviar = unidad;
                        else if (prod.tipo === 'semillas') unidadEnviar = unidad; // libras o presentaciones
                        else unidadEnviar = 'unidades';
                    }
                    onAdd({ producto: productoId, cantidad: Number(cantidad) || 0, unidad: unidadEnviar });
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

// Lista de productos ya seleccionados con edición
function ListaSeleccionados({ productosCatalogo, seleccionados, onRemove }) {
    return (
        <div style={{ marginTop: 4 }}>
            {seleccionados.map((sel) => {
                const prod = (Array.isArray(productosCatalogo) ? productosCatalogo : []).find((p) => p._id === sel.producto);
                if (!prod) return null;
                let unidadMostrar;
                if (prod.tipo === 'veneno') {
                    unidadMostrar = sel.unidad || 'copas';
                } else if (prod.tipo === 'semillas') {
                    unidadMostrar = sel.unidad === 'libras' ? 'libras' : (prod.presentacion || 'presentaciones');
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

const Dashboard = () => {
    const [manzanas, setManzanas] = useState([]);
    const [nuevaManzana, setNuevaManzana] = useState("");
    const [crearManzanaMsg, setCrearManzanaMsg] = useState("");
    const navigate = useNavigate();

    // Estados para el formulario de actividades
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [actividad, setActividad] = useState({
        tipo: "",
        fechaRealizacion: "",
        fechaAlerta: "",
        manzanaId: ""
    });
    const [actividadPersonalizada, setActividadPersonalizada] = useState("");

    // Productos para actividad rápida desde dashboard
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]); // [{producto, cantidad, unidad?}]
    const [costoTrabajo, setCostoTrabajo] = useState(0);
    const [mostrarProductos, setMostrarProductos] = useState(false);

    // Estados para búsqueda y filtro
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState(""); // "" = todos, "rojo", "verde"
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    // Control de expansión de cada tarjeta de manzana
    const [manzanasAbiertas, setManzanasAbiertas] = useState({}); // { [idManzana]: true }

    const token = localStorage.getItem('token');
    const aprobado = localStorage.getItem('aprobado') === 'true';
    const role = localStorage.getItem('role');
    const [diasRestantes, setDiasRestantes] = useState(null);
    const [enGracia, setEnGracia] = useState(false);
    const [diasGraciaRestantes, setDiasGraciaRestantes] = useState(null);

    useEffect(() => {
        const t = localStorage.getItem('token');
        if (!t) return;
        fetch(`${getBackendUrl()}/suscripciones/mi-ultima`, { headers:{ Authorization:`Bearer ${t}` }})
            .then(r => r.json())
            .then(doc => {
                if (doc && doc.fechaFin) {
                    const fin = new Date(doc.fechaFin);
                    const hoy = new Date();
                    const diff = Math.ceil((fin.setHours(0,0,0,0) - hoy.setHours(0,0,0,0)) / (1000*60*60*24));
                    setDiasRestantes(diff);
                    // Calcular período de gracia si expiró
                    if (diff < 0) {
                        const diasDesdeExp = Math.abs(diff);
                        if (diasDesdeExp <= 5) {
                            setEnGracia(true);
                            setDiasGraciaRestantes(5 - diasDesdeExp);
                        }
                    }
                } else {
                    setDiasRestantes(null);
                }
            })
            .catch(()=>{});
    }, []);

    useEffect(() => {
        const t = localStorage.getItem('token');
        if (!t) return;
        fetch(`${getBackendUrl()}/manzanas`, { headers:{ Authorization:`Bearer ${t}` }})
            .then(res => res.json())
            .then(data => setManzanas(data))
            .catch(error => console.error("Error al obtener manzanas:", error));
    }, []);

    useEffect(() => {
        const cargarCatalogo = async () => {
            try {
                const t = localStorage.getItem('token');
                const res = await fetch(`${getBackendUrl()}/api/catalogo`, {
                    headers: t ? { Authorization: `Bearer ${t}` } : {}
                });
                const data = await res.json().catch(() => []);
                if (!res.ok || !Array.isArray(data)) {
                    console.warn('Catálogo no disponible o respuesta inválida', data);
                    setProductosCatalogo([]);
                    return;
                }
                setProductosCatalogo(data);
            } catch (e) {
                console.error('Error cargando catálogo:', e);
                setProductosCatalogo([]);
            }
        };
        cargarCatalogo();
    }, []);

    // Solicitar acceso (si no aprobado)
    const [solicitudMsg, setSolicitudMsg] = useState('');
    const solicitarAcceso = async () => {
        setSolicitudMsg('');
        try {
            const res = await fetch(`${getBackendUrl()}/solicitudes/solicitar`, {
                method:'POST',
                headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
                body: JSON.stringify({ motivo: 'Quiero acceso completo' })
            });
            const data = await res.json();
            if (res.ok) {
                setSolicitudMsg('Solicitud enviada, espera aprobación.');
            } else {
                setSolicitudMsg(data.message || 'Error enviando solicitud');
            }
        } catch(e){
            setSolicitudMsg('Error de red');
        }
    };

    const handleAgregarManzana = () => {
        if (!nuevaManzana.trim()) return;
        const t = localStorage.getItem('token');
        fetch(`${getBackendUrl()}/manzanas`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization:`Bearer ${t}` },
            body: JSON.stringify({ nombre: nuevaManzana })
        })
        .then(async res => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCrearManzanaMsg(data.message || 'No se pudo crear la manzana');
                return;
            }
            setManzanas([...manzanas, data]);
            setNuevaManzana("");
            setCrearManzanaMsg('');
        })
        .catch(error => {
            console.error("Error al agregar manzana:", error);
            setCrearManzanaMsg('Error de red al crear la manzana');
        });
    };

    const handleAgregarActividad = (id) => {
        setActividad({
            tipo: "",
            fechaRealizacion: "",
            fechaAlerta: "",
            manzanaId: id
        });
        setMostrarFormulario(true);
        setProductosSeleccionados([]);
        setCostoTrabajo(0);
        setMostrarProductos(false);
    };

    const handleSubmitActividad = (e) => {
        e.preventDefault();
        const tipoElegido = actividad.tipo === '__personalizada__' ? actividadPersonalizada.trim() : actividad.tipo;
        if (!tipoElegido) return; // evitar enviar vacío
        const productosParaEnviar = productosSeleccionados.map((p) => ({
            producto: p.producto,
            cantidad: Number(p.cantidad || 0),
            unidad: p.unidad || 'unidades',
        }));
        const t = localStorage.getItem('token');
        fetch(`${getBackendUrl()}/actividades`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization:`Bearer ${t}` },
            body: JSON.stringify({
                tipo: tipoElegido,
                fechaRealizacion: actividad.fechaRealizacion,
                fechaAlerta: actividad.fechaAlerta,
                manzana: actividad.manzanaId,
                productosUtilizados: productosParaEnviar,
                costoTrabajo: Number(costoTrabajo) || 0,
            })
        })
        .then(res => res.json())
        .then(data => {
            setManzanas(manzanas.map(manzana =>
                manzana._id === actividad.manzanaId
                    ? { ...manzana, actividades: [...manzana.actividades, data] }
                    : manzana
            ));
            setMostrarFormulario(false);
            setProductosSeleccionados([]);
            setCostoTrabajo(0);
        })
        .catch(error => console.error("Error al agregar actividad:", error));
    };
    // Calcula los días desde la última actividad de "sembrar"
const diasDesdeSiembra = (manzana) => {
    // Busca la actividad de tipo "sembrar" más reciente
    const siembras = manzana.actividades
        .filter(a => a.tipo === "sembrar" && a.fechaRealizacion)
        .sort((a, b) => new Date(b.fechaRealizacion) - new Date(a.fechaRealizacion));
    if (siembras.length === 0) return null;
    const fechaSiembra = new Date(siembras[0].fechaRealizacion);
    const hoy = new Date();
    const diffTime = hoy.setHours(0,0,0,0) - fechaSiembra.setHours(0,0,0,0);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

    const handleEliminarManzana = async (id) => {
        const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta manzana?");
        if (!confirmar) return;
        const t = localStorage.getItem('token');
        try {
            const response = await fetch(`${getBackendUrl()}/manzanas/${id}`, {
                method: "DELETE",
                headers:{ Authorization:`Bearer ${t}` }
            });
            if (!response.ok) {
                throw new Error("Error al eliminar la manzana");
            }
            alert("Manzana eliminada correctamente");
            setManzanas(manzanas.filter((manzana) => manzana._id !== id));
        } catch (error) {
            console.error("Error eliminando manzana:", error);
            alert("No se pudo eliminar la manzana.");
        }
    };
    
    useEffect(() => {
        const obtenerManzanas = async () => {
            try {
                const t = localStorage.getItem('token');
                const res = await fetch(`${getBackendUrl()}/manzanas/estado`, { headers:{ Authorization:`Bearer ${t}` }});
                const data = await res.json();
                setManzanas(data);
            } catch (error) {
                console.error("Error al obtener manzanas:", error);
            }
        };
        obtenerManzanas();
        const interval = setInterval(obtenerManzanas, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filtrar manzanas por búsqueda y estado
    const manzanasFiltradas = manzanas.filter(manzana => {
        const coincideBusqueda = manzana.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroEstado ? manzana.estado === filtroEstado : true;
        return coincideBusqueda && coincideEstado;
    });

    // Acción para refrescar datos (manzanas + suscripción)
    const refrescar = () => {
        const t = localStorage.getItem('token');
        if (!t) return;
        // Refrescar estado de suscripción
        fetch(`${getBackendUrl()}/suscripciones/mi-ultima`, { headers:{ Authorization:`Bearer ${t}` }})
            .then(r => r.json())
            .then(doc => {
                if (doc && doc.fechaFin) {
                    const fin = new Date(doc.fechaFin);
                    const hoy = new Date();
                    const diff = Math.ceil((fin.setHours(0,0,0,0) - hoy.setHours(0,0,0,0)) / (1000*60*60*24));
                    setDiasRestantes(diff);
                    if (diff < 0) {
                        const diasDesdeExp = Math.abs(diff);
                        if (diasDesdeExp <= 5) {
                            setEnGracia(true);
                            setDiasGraciaRestantes(5 - diasDesdeExp);
                        } else {
                            setEnGracia(false);
                            setDiasGraciaRestantes(null);
                        }
                    } else {
                        setEnGracia(false);
                        setDiasGraciaRestantes(null);
                    }
                } else {
                    setDiasRestantes(null);
                    setEnGracia(false);
                    setDiasGraciaRestantes(null);
                }
            })
            .catch(()=>{});

        // Refrescar manzanas (estado consolidado)
        fetch(`${getBackendUrl()}/manzanas/estado`, { headers:{ Authorization:`Bearer ${t}` }})
            .then(res => res.json())
            .then(data => setManzanas(Array.isArray(data) ? data : []))
            .catch(()=>{});
    };

    // ...existing code...
   return (
    <div className={styles.dashboardContainer}>
        <div className={styles.topBar}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
               
                <span
                    className={styles.titulo}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/")}
                >
                    Mis Manzanas
                </span>
            </div>
            {typeof diasRestantes === 'number' && (
                <span style={{ color:'#fff', marginLeft: 12 }}>⏳ {diasRestantes} días para renovar</span>
            )}
            {enGracia && (
                <span style={{ color:'#b58900', marginLeft: 12 }}>⚠️suscripcion vencida: {diasGraciaRestantes} día(s) restantes</span>
            )}
            <div className={styles.searchBarContainer}>
               
                <div className={styles.searchInputWrapper}>
                    <input
                        type="text"
                        placeholder="Buscar manzana..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                    <FaSearch className={styles.searchIcon} />
                </div>
                <div style={{ position:'relative' }}>
                    <button
                        className={styles.btnAgregarManzana}
                        onClick={() => setShowFilterMenu(v => !v)}
                        title="Filtrar por color"
                    >
                        {`Filtro: ${filtroEstado === '' ? 'todos' : filtroEstado}`}
                    </button>
                    {showFilterMenu && (
                        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'rgba(23,21,18,0.96)', color:'#eaf7d9', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, boxShadow:'0 12px 32px rgba(0,0,0,0.4)', minWidth:180, zIndex:20 }}>
                            {[
                                { key:'', label:'todos' },
                                { key:'rojo', label:'solo rojas' },
                                { key:'verde', label:'solo verdes' }
                            ].map(opt => (
                                <div
                                    key={opt.key === '' ? 'todos' : opt.key}
                                    onClick={() => { setFiltroEstado(opt.key); setShowFilterMenu(false); }}
                                    style={{ padding:'8px 12px', cursor:'pointer', background: (filtroEstado === opt.key) ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                                <button
                    className={styles.btnAgregarManzana}
                    onClick={() => navigate('/catalogo')}
                    title="Ir al catálogo de productos"
                >
                    Catálogo
                </button>
                                {!aprobado && role !== 'admin' && (
                                    <button className={styles.btnAgregarManzana} onClick={solicitarAcceso}>
                                        Solicitar acceso
                                    </button>
                                )}
                {(role === 'agricultor' ) && (
                    <>
                        <button className={styles.btnAgregarManzana} onClick={() => navigate('/suscripcion')}>
                            Pago
                        </button>
                        <button className={styles.btnAgregarManzana} onClick={() => navigate('/colaboradores')}>
                            Colaboradores
                        </button>
                    
                    </>
                )}

                {(role === 'admin') && (
                    <>
                       
                        <button className={styles.btnAgregarManzana} onClick={() => navigate('/colaboradores')}>
                            Colaboradores
                        </button>
                        <button className={styles.btnAgregarManzana} onClick={() => navigate('/agregar-usuario')}>
                            Usuarios
                        </button>
                    </>
                )}
                 <button className={styles.btnAgregarManzana} onClick={refrescar}>
                            Refrescar
                        </button>
                
            </div>
        </div>
                {!aprobado && role !== 'admin' && solicitudMsg && (
                    <p style={{color:'#fff', margin:'4px 12px'}}>{solicitudMsg}</p>
                )}
        {/* ...resto del código... */}
    
            {/* Formulario para agregar manzanas */}
            <div className={styles.formAgregarManzana}>
                <input
                    type="text"
                    placeholder="Nombre de la nueva manzana"
                    value={nuevaManzana}
                    onChange={(e) => setNuevaManzana(e.target.value)}
                />
                <button className={styles.btnAgregarManzana} onClick={handleAgregarManzana}>
                    ➕ Agregar Manzana
                </button>
                {crearManzanaMsg && (
                    <div style={{ color: '#c0392b', marginTop: 6 }}>{crearManzanaMsg}</div>
                )}
            </div>

            {/* Lista de manzanas */}
            <div className={styles.manzanasGrid}>
                {manzanasFiltradas.map((manzana) => {
                    // Filtrar actividades que ya alcanzaron su fecha de alerta (vencidas o actuales)
                    const actividadesPendientes = manzana.actividades
                        .filter((a) => 
                            a.fechaAlerta &&
                            new Date(a.fechaAlerta).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0)
                        )
                        .sort((a, b) => new Date(b.fechaAlerta) - new Date(a.fechaAlerta));

                    // Obtener solo la actividad más reciente por tipo
                    const actividadesPorTipo = {};
                    actividadesPendientes.forEach((actividad) => {
                        if (!actividadesPorTipo[actividad.tipo]) {
                            actividadesPorTipo[actividad.tipo] = actividad;
                        }
                    });

                    // Convertir el objeto en array de actividades únicas por tipo
                    const actividadesFiltradas = Object.values(actividadesPorTipo);

                                        const abierta = !!manzanasAbiertas[manzana._id];
                                        const toggleManzana = () => {
                                                setManzanasAbiertas(prev => ({
                                                        ...prev,
                                                        [manzana._id]: !prev[manzana._id]
                                                }));
                                        };

                    return (
                                                <div
                                                    key={manzana._id}
                                                    className={`${styles.manzanaCard} ${styles[manzana.estado] || ""}`}
                                                    style={{ cursor: 'pointer', position: 'relative' }}
                                                    onClick={toggleManzana}
                                                >
                                                     <h2 style={{ marginTop: 0 }}>
                                                            {manzana.nombre}
                                                            {(() => {
                                                                const dias = diasDesdeSiembra(manzana);
                                                                return dias !== null ? (
                                                                    <span className={styles.contadorDias}>{dias} dias</span>
                                                                ) : null;
                                                            })()}
                                                     </h2>
                                                                                 <p style={{ margin: '4px 0 8px' }}>{manzana.actividades.length} actividades realizadas</p>
                                                     {abierta && (
                                                         <>
                                                             {/* Mostrar alerta SOLO si la manzana está en rojo y hay actividades pendientes */}
                                                             {manzana.estado === "rojo" && manzana.actividades
                                                                 .filter(a => a.estado === "pendiente")
                                                                 .map(a => (
                                                                     <p key={a._id} className={styles.alerta}>
                                                                         ⚠️ Actividad pendiente: {a.tipo}
                                                                     </p>
                                                                 ))}
                                                             <div className={styles.cardButtons} onClick={e => e.stopPropagation()}>
                                                                 <button className={styles.btnAgregar} onClick={() => handleAgregarActividad(manzana._id)}>
                                                                     Agregar
                                                                 </button>
                                                                 <button className={styles.btnEliminar} onClick={() => handleEliminarManzana(manzana._id)}>
                                                                     Eliminar
                                                                 </button>
                                                                 <button className={styles.btnAccion} onClick={() => navigate(`/actividades/${manzana._id}`)}>
                                                                     Ver
                                                                 </button>
                                                             </div>
                                                         </>
                                                     )}
                                                </div>
                    );
                })}
            </div>

            {/* Formulario modal para agregar actividad */}
            {mostrarFormulario && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Agregar Actividad</h2>
                        <form onSubmit={handleSubmitActividad}>
                            {(() => {
                                const base = [
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
                                const opcionesOrdenadas = base.sort((a,b)=> a.localeCompare(b,'es',{sensitivity:'base'}));
                                return (
                                    <>
                                        <select
                                            value={actividad.tipo}
                                            onChange={(e) => setActividad({ ...actividad, tipo: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled hidden>Selecciona una actividad</option>
                                            {opcionesOrdenadas.map(opt => (
                                                <option key={opt.toLowerCase()} value={opt.toLowerCase()}>{opt}</option>
                                            ))}
                                            <option value="__personalizada__">Personalizada…</option>
                                        </select>
                                        {actividad.tipo === '__personalizada__' && (
                                            <input
                                                type="text"
                                                placeholder="Nombre de actividad"
                                                value={actividadPersonalizada}
                                                onChange={(e)=> setActividadPersonalizada(e.target.value)}
                                                required
                                                style={{ marginTop:8 }}
                                            />
                                        )}
                                    </>
                                );
                            })()}
                            <label>Fecha de Realización</label>
                            <input
                                type="date"
                                value={actividad.fechaRealizacion}
                                onChange={(e) => setActividad({ ...actividad, fechaRealizacion: e.target.value })}
                                required
                                placeholder="Fecha de Realización"
                                title="Fecha de Realización"
                            />
                            <label>Fecha de Alerta</label>
                            <input
                                type="date"
                                value={actividad.fechaAlerta}
                                onChange={(e) => setActividad({ ...actividad, fechaAlerta: e.target.value })}
                                placeholder="Fecha de Alerta"
                                title="Fecha de Alerta"
                            />
                            {/* Productos (opcional) */}
                            <div style={{ marginTop: 8 }}>
                                <button type="button" className={styles.btnAgregarManzana} onClick={() => setMostrarProductos(!mostrarProductos)}>
                                    {mostrarProductos ? 'Ocultar productos' : 'Agregar productos'}
                                </button>
                            </div>
                            {mostrarProductos && (
                                <div style={{ marginTop: 8 }}>
                                    <h4>Productos utilizados</h4>
                                    {/* Picker para agregar uno a uno */}
                                    <ProductoPicker
                                        productosCatalogo={productosCatalogo}
                                        productosSeleccionados={productosSeleccionados}
                                        onAdd={(nuevo) => setProductosSeleccionados((prev) => [...prev, nuevo])}
                                    />
                                    {/* Lista de seleccionados */}
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
                            <div className={styles.modalActions}>
                                <button type="submit">✅ Guardar Actividad</button>
                                <button type="button" onClick={() => setMostrarFormulario(false)}>❌ Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
