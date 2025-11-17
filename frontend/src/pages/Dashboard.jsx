import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaClipboardList, FaSignOutAlt, FaSearch } from "react-icons/fa"; // Agrega FaSearch
import { getBackendUrl } from '../utils/api';

// Picker para agregar productos uno a uno
function ProductoPicker({ productosCatalogo, productosSeleccionados, onAdd }) {
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState(0);
    const [unidad, setUnidad] = useState("copas");

    const opciones = productosCatalogo.filter((p) => !productosSeleccionados.some((s) => s.producto === p._id));
    const prodSel = productosCatalogo.find((p) => p._id === productoId);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                <option value="">Selecciona un producto</option>
                {opciones.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre} {p.presentacion ? `(${p.presentacion})` : ''}</option>
                ))}
            </select>
            <input type="number" min="0" step="0.01" placeholder="Cantidad" value={cantidad} onChange={(e) => setCantidad(parseFloat(e.target.value))} />
            {prodSel && prodSel.tipo === 'veneno' ? (
                <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                    <option value="copas">Copas</option>
                    <option value="unidades">Unidades</option>
                </select>
            ) : (
                <span style={{ fontSize: 12, color: '#666' }}>{prodSel?.presentacion || 'unidades'}</span>
            )}
            <button type="button" onClick={() => {
                if (!productoId) return;
                onAdd({ producto: productoId, cantidad: Number(cantidad) || 0, unidad });
                setProductoId(""); setCantidad(0); setUnidad('copas');
            }}>Agregar</button>
        </div>
    );
}

// Lista de productos ya seleccionados con edición
function ListaSeleccionados({ productosCatalogo, seleccionados, onCantidad, onUnidad, onRemove }) {
    return (
        <div>
            {seleccionados.map((sel) => {
                const prod = productosCatalogo.find((p) => p._id === sel.producto);
                if (!prod) return null;
                return (
                    <div key={sel.producto} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <div>{prod.nombre} {prod.presentacion ? `(${prod.presentacion})` : ''}</div>
                        <input type="number" min="0" step="0.01" value={sel.cantidad} onChange={(e) => onCantidad(sel.producto, parseFloat(e.target.value))} />
                        {prod.tipo === 'veneno' ? (
                            <select value={sel.unidad || 'copas'} onChange={(e) => onUnidad(sel.producto, e.target.value)}>
                                <option value="copas">Copas</option>
                                <option value="unidades">Unidades</option>
                            </select>
                        ) : (
                            <span style={{ fontSize: 12, color: '#666' }}>{prod.presentacion || 'unidades'}</span>
                        )}
                        <button type="button" onClick={() => onRemove(sel.producto)}>Quitar</button>
                    </div>
                );
            })}
        </div>
    );
}

const Dashboard = () => {
    const [manzanas, setManzanas] = useState([]);
    const [nuevaManzana, setNuevaManzana] = useState("");
    const navigate = useNavigate();

    // Estados para el formulario de actividades
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [actividad, setActividad] = useState({
        tipo: "",
        fechaRealizacion: "",
        fechaAlerta: "",
        manzanaId: ""
    });

    // Productos para actividad rápida desde dashboard
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]); // [{producto, cantidad, unidad?}]
    const [costoTrabajo, setCostoTrabajo] = useState(0);
    const [mostrarProductos, setMostrarProductos] = useState(false);

    // Estados para búsqueda y filtro
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState(""); // "" = todos, "rojo", "verde"
    // Control de expansión de cada tarjeta de manzana
    const [manzanasAbiertas, setManzanasAbiertas] = useState({}); // { [idManzana]: true }

    useEffect(() => {
        fetch(`${getBackendUrl()}/manzanas`)
            .then(res => res.json())
            .then(data => setManzanas(data))
            .catch(error => console.error("Error al obtener manzanas:", error));
    }, []);

    useEffect(() => {
        const cargarCatalogo = async () => {
            try {
                const res = await fetch(`${getBackendUrl()}/api/catalogo`);
                const data = await res.json();
                setProductosCatalogo(data);
            } catch (e) {
                console.error('Error cargando catálogo:', e);
            }
        };
        cargarCatalogo();
    }, []);

    const handleAgregarManzana = () => {
        if (!nuevaManzana.trim()) return;

        fetch(`${getBackendUrl()}/manzanas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: nuevaManzana })
        })
        .then(res => res.json())
        .then(data => {
            setManzanas([...manzanas, data]);
            setNuevaManzana("");
        })
        .catch(error => console.error("Error al agregar manzana:", error));
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
        // Enviamos cantidad y unidad; backend calcula costo usando copasPorUnidad cuando unidad='copas'
        const productosParaEnviar = productosSeleccionados.map((p) => ({
            producto: p.producto,
            cantidad: Number(p.cantidad || 0),
            unidad: p.unidad || 'unidades',
        }));

        fetch(`${getBackendUrl()}/actividades`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo: actividad.tipo,
                fechaRealizacion: actividad.fechaRealizacion,
                fechaAlerta: actividad.fechaAlerta,
                manzana: actividad.manzanaId, // Esto debe tener el ID de la manzana
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
    
        try {
            const response = await fetch(`${getBackendUrl()}/manzanas/${id}`, {
                method: "DELETE",
            });
    
            if (!response.ok) {
                throw new Error("Error al eliminar la manzana");
            }
    
            alert("Manzana eliminada correctamente");
            setManzanas(manzanas.filter((manzana) => manzana._id !== id)); // Actualiza el estado
        } catch (error) {
            console.error("Error eliminando manzana:", error);
            alert("No se pudo eliminar la manzana.");
        }
    };
    
    useEffect(() => {
        const obtenerManzanas = async () => {
            try {
                const res = await fetch(`${getBackendUrl()}/manzanas/estado`); // Llamamos al nuevo endpoint
                const data = await res.json();
                setManzanas(data);
            } catch (error) {
                console.error("Error al obtener manzanas:", error);
            }
        };
    
        obtenerManzanas();
    
        // Actualizar cada 30 segundos para verificar cambios en las alertas
        const interval = setInterval(obtenerManzanas, 30000);
    
        return () => clearInterval(interval); // Limpiar intervalo al desmontar el componente
    }, []);

    // Filtrar manzanas por búsqueda y estado
    const manzanasFiltradas = manzanas.filter(manzana => {
        const coincideBusqueda = manzana.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroEstado ? manzana.estado === filtroEstado : true;
        return coincideBusqueda && coincideEstado;
    });

    // ...existing code...
   return (
    <div className={styles.dashboardContainer}>
        <div className={styles.topBar}>
            <span
                    className={styles.titulo}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/")}
                >
                    Mis Manzanas
                </span>
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
                <button
                    className={`${styles.btnAgregarManzana} ${filtroEstado === "rojo" ? styles.activeFilter : ""}`}
                    onClick={() => setFiltroEstado(filtroEstado === "rojo" ? "" : "rojo")}
                >
                    Solo Rojas
                </button>
                <button
                    className={`${styles.btnAgregarManzana} ${filtroEstado === "verde" ? styles.activeFilter : ""}`}
                    onClick={() => setFiltroEstado(filtroEstado === "verde" ? "" : "verde")}
                >
                    Solo Verdes
                </button>
                <button
                    className={styles.btnAgregarManzana}
                    onClick={() => navigate('/catalogo')}
                    title="Ir al catálogo de productos"
                >
                    Catálogo
                </button>
            </div>
        </div>
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
                                                     {!abierta && (
                                                         <p style={{ fontSize: 12, opacity: .7, margin: 0 }}>Haz clic para ver acciones y actividades pendientes</p>
                                                     )}
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
                                                             {/* Actividades vencidas (únicas por tipo) */}
                                                             {actividadesFiltradas.length > 0 && (
                                                                 <div style={{ marginBottom: 8 }}>
                                                                     <strong style={{ fontSize: 13 }}>Actividades vencidas por tipo:</strong>
                                                                     {actividadesFiltradas.map(a => (
                                                                         <div key={a._id} style={{ fontSize: 12 }}>• {a.tipo}</div>
                                                                     ))}
                                                                 </div>
                                                             )}
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
                                                        <select
                                                                value={actividad.tipo}
                                                                onChange={(e) => setActividad({ ...actividad, tipo: e.target.value })}
                                                                required
                                                        >
                                <option value="" disabled hidden>Selecciona una actividad</option>
                                <option value="fumigar gusano">Fumigar Gusano</option>
                                <option value="fumigar rolla">Fumigar Rolla</option>
                                <option value="abonar">Abonar</option>
                                <option value="sembrar">Sembrar</option>
                                <option value="fumigar monte">Fumigar Monte</option>
                                <option value="poner manguera">Poner Manguera</option>
                                <option value="cortar">Cortar</option>
                                <option value="inyectar">Inyectar</option>
                                <option value="tronquiar">Tronquiar</option>
                                <option value="fumigar gilote">Fumigar Gilote</option>
                                <option value="tractorar">Tractorear</option>
                                <option value="otros">Otros</option>
                            </select>
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
                                        onCantidad={(id, cant) => setProductosSeleccionados((prev) => {
                                            const idx = prev.findIndex((p) => p.producto === id);
                                            const up = [...prev];
                                            if (idx !== -1) up[idx].cantidad = cant; return up;
                                        })}
                                        onUnidad={(id, unidad) => setProductosSeleccionados((prev) => {
                                            const idx = prev.findIndex((p) => p.producto === id);
                                            const up = [...prev];
                                            if (idx !== -1) up[idx].unidad = unidad; return up;
                                        })}
                                        onRemove={(id) => setProductosSeleccionados((prev) => prev.filter((p) => p.producto !== id))}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                        <label style={{ display: 'block', marginBottom: 4 }}>Costo de trabajo</label>
                                        <input type="number" step="0.01" min="0" value={costoTrabajo} onChange={(e) => setCostoTrabajo(parseFloat(e.target.value))} />
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
