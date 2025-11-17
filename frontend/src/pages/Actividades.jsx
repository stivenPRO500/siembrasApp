import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dashStyles from "./Dashboard.module.css";

import { getBackendUrl } from '../utils/api';
import styles from "./Actividades.module.css";

const Actividades = () => {
    const { manzanaId } = useParams();
    const navigate = useNavigate();
    const [actividades, setActividades] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [actividadEditando, setActividadEditando] = useState(null);
    const [nuevoTipo, setNuevoTipo] = useState("");
    const [nuevaFecha, setNuevaFecha] = useState("");
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    // productosSeleccionados: [{ producto: id, cantidad: number, unidad?: 'copas'|'litros' }]
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [costoTrabajo, setCostoTrabajo] = useState(0);
    const [mostrarPicker, setMostrarPicker] = useState(false);
    const [productoAAgregar, setProductoAAgregar] = useState("");
    const [cantidadAAgregar, setCantidadAAgregar] = useState(0);
    const [unidadAAgregar, setUnidadAAgregar] = useState("copas");
    const [actividadesAbiertas, setActividadesAbiertas] = useState({}); // { [actividadId]: true }

    useEffect(() => {
        fetchActividades();
        fetchCatalogo();
    }, [manzanaId]);

    const fetchActividades = async () => {
        try {
            const response = await fetch(`${getBackendUrl()}/actividades/${manzanaId}`);
            const data = await response.json();
            setActividades(data);
        } catch (error) {
            console.error("Error al obtener actividades:", error);
        }
    };

    const fetchCatalogo = async () => {
        try {
            const response = await fetch(`${getBackendUrl()}/api/catalogo`);
            const data = await response.json();
            setProductosCatalogo(data);
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
                await fetch(`${getBackendUrl()}/actividades/${id}`, {
                    method: "DELETE",
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
        setNuevaFecha(formatDate(actividad.fechaRealizacion));
        setProductosSeleccionados(actividad.productosUtilizados || []);
        setCostoTrabajo(actividad.costoTrabajo || 0);
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`${getBackendUrl()}/actividades/${actividadEditando._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tipo: nuevoTipo, fechaRealizacion: nuevaFecha }),
            });

            if (response.ok) {
                fetchActividades();
                setModalOpen(false);
                setActividadEditando(null);
            }
        } catch (error) {
            console.error("Error al actualizar la actividad:", error);
        }
    };

    const handleProductoChange = (productoId, cantidad) => {
        setProductosSeleccionados((prev) => {
            const index = prev.findIndex((p) => p.producto === productoId);
            if (index !== -1) {
                const updated = [...prev];
                updated[index].cantidad = cantidad;
                return updated;
            }
            return [...prev, { producto: productoId, cantidad }];
        });
    };

    const handleUnidadChange = (productoId, unidad) => {
        setProductosSeleccionados((prev) => {
            const index = prev.findIndex((p) => p.producto === productoId);
            if (index !== -1) {
                const updated = [...prev];
                updated[index].unidad = unidad;
                return updated;
            }
            return [...prev, { producto: productoId, cantidad: 0, unidad }];
        });
    };

    const handleAgregarProductoSeleccionado = () => {
        if (!productoAAgregar) return;
        // evitar duplicados
        if (productosSeleccionados.some((p) => p.producto === productoAAgregar)) return;
        setProductosSeleccionados((prev) => [
            ...prev,
            {
                producto: productoAAgregar,
                cantidad: Number(cantidadAAgregar) || 0,
                unidad: unidadAAgregar,
            },
        ]);
        setProductoAAgregar("");
        setCantidadAAgregar(0);
        setUnidadAAgregar("copas");
        setMostrarPicker(false);
    };

    const handleQuitarProductoSeleccionado = (productoId) => {
        setProductosSeleccionados((prev) => prev.filter((p) => p.producto !== productoId));
    };

    const handleSubmit = async () => {
        // Enviar cantidad y unidad; backend realiza conversion según copasPorUnidad
        const productosParaEnviar = productosSeleccionados.map((p) => ({
            producto: p.producto,
            cantidad: Number(p.cantidad || 0),
            unidad: p.unidad || 'unidades',
        }));

        const nuevaActividad = {
            tipo: nuevoTipo,
            fechaRealizacion: nuevaFecha,
            manzana: manzanaId,
            productosUtilizados: productosParaEnviar,
            costoTrabajo: Number(costoTrabajo) || 0,
        };

        try {
            const response = await fetch(`${getBackendUrl()}/actividades`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevaActividad),
            });

            if (response.ok) {
                fetchActividades();
                setModalOpen(false);
                // reset form state
                setActividadEditando(null);
                setNuevoTipo("");
                setNuevaFecha("");
                setProductosSeleccionados([]);
                setCostoTrabajo(0);
            } else {
                console.error('Error al crear la actividad');
            }
        } catch (error) {
            console.error('Error al enviar la actividad:', error);
        }
    };

    return (
       
        <div className={styles.actividadesContainer}>
            {/* Top bar estilo Dashboard */}
            <div className={dashStyles.topBar}>
                <span className={dashStyles.titulo}>Mis Actividades</span>
                <div>
                    <button className={dashStyles.btnAgregarManzana} onClick={() => navigate("/dashboard")}>Regresar</button>
                            <button className={dashStyles.btnAgregarManzana} onClick={() => navigate('/cosechas')} style={{ marginLeft: 8 }}>Ver cosechas</button>
                    <button className={dashStyles.btnAgregarManzana} onClick={() => setModalOpen(true)} style={{ marginLeft: 8 }}>Agregar actividad</button>
                            <button className={dashStyles.btnAgregarManzana} style={{ marginLeft: 8, background:'#c0392b' }} onClick={async () => {
                                if(!window.confirm('¿Cosechar? Se vaciarán las actividades.')) return;
                                try {
                                    const res = await fetch(`${getBackendUrl()}/manzanas/cosechar/${manzanaId}`, { method: 'POST' });
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
          
            <div className={styles.actividadesList}>
                {actividades.length > 0 ? (
                    actividades.map((actividad) => {
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
                                        {typeof actividad.costoTrabajo === 'number' && (
                                            <div style={{ marginBottom: 6 }}>
                                                <strong>Costo de trabajo:</strong> ${Number(actividad.costoTrabajo || 0).toFixed(2)}
                                            </div>
                                        )}
                                        {typeof actividad.costoTotal === 'number' && (
                                            <div style={{ marginBottom: 6 }}>
                                                <strong>Costo total:</strong> ${actividad.costoTotal.toFixed(2)}
                                            </div>
                                        )}
                                        {Array.isArray(actividad.productosUtilizados) && actividad.productosUtilizados.length > 0 && (
                                            <>
                                                <strong>Productos utilizados:</strong>
                                                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                                                    {actividad.productosUtilizados.map((p, idx) => {
                                                        const prod = productosCatalogo.find((x) => x._id === p.producto);
                                                        const nombreProd = prod?.nombre || 'Producto';
                                                        return (
                                                            <li key={idx}>
                                                                {nombreProd}{p.cantidad != null ? ` (${p.cantidad}${p.unidad ? ` ${p.unidad}` : ''})` : ''} - Costo: ${Number(p.costo || 0).toFixed(2)}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </>
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
                    Total invertido: ${actividades.reduce((acc, a) => acc + (Number(a.costoTotal) || 0), 0).toFixed(2)}
                </div>
            )}

            {modalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{actividadEditando ? 'Editar Actividad' : 'Nueva Actividad'}</h3>
                        <label>Tipo:</label>


                        <input
                            type="text"
                            list="tipos-actividad"
                            placeholder="Selecciona una actividad"
                            value={nuevoTipo}
                            onChange={(e) => setNuevoTipo(e.target.value)}
                        />

                        <datalist id="tipos-actividad">
                            <option value="fumigar gusano" />
                            <option value="fumigar rolla" />
                            <option value="abonar" />
                            <option value="sembrar" />
                        </datalist>

                        <label>Fecha de Realización:</label>
                        <input
                            type="date"
                            value={nuevaFecha}
                            onChange={(e) => setNuevaFecha(e.target.value)}
                        />
                        <div>
                            <h3>Productos Utilizados</h3>
                            {/* Picker para agregar uno a uno */}
                            {!mostrarPicker && (
                                <button className={dashStyles.btnAgregarManzana} type="button" onClick={() => setMostrarPicker(true)}>Agregar producto</button>
                            )}
                            {mostrarPicker && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                    <select value={productoAAgregar} onChange={(e) => setProductoAAgregar(e.target.value)}>
                                        <option value="">Selecciona un producto</option>
                                        {productosCatalogo
                                            .filter((p) => !productosSeleccionados.some((s) => s.producto === p._id))
                                            .map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.nombre} {p.presentacion ? `(${p.presentacion})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                    <input type="number" min="0" step="0.01" placeholder="Cantidad" value={cantidadAAgregar} onChange={(e) => setCantidadAAgregar(parseFloat(e.target.value))} />
                                    {(() => {
                                        const prod = productosCatalogo.find((x) => x._id === productoAAgregar);
                                        if (prod && prod.tipo === 'veneno') {
                                            return (
                                                <select value={unidadAAgregar} onChange={(e) => setUnidadAAgregar(e.target.value)}>
                                                    <option value="copas">Copas</option>
                                                    <option value="unidades">Unidades</option>
                                                </select>
                                            );
                                        }
                                        return <span style={{ fontSize: 12, color: '#666' }}>{prod?.presentacion || 'unidades'}</span>;
                                    })()}
                                    <button type="button" onClick={handleAgregarProductoSeleccionado}>Agregar</button>
                                </div>
                            )}

                            {/* Lista de seleccionados */}
                            {productosSeleccionados.map((sel) => {
                                const prod = productosCatalogo.find((p) => p._id === sel.producto);
                                if (!prod) return null;
                                return (
                                    <div key={sel.producto} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px auto', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                        <div>{prod.nombre} {prod.presentacion ? `(${prod.presentacion})` : ''}</div>
                                        <input type="number" min="0" step="0.01" value={sel.cantidad}
                                            onChange={(e) => handleProductoChange(sel.producto, parseFloat(e.target.value))} />
                                        {prod.tipo === 'veneno' ? (
                                            <select value={sel.unidad || 'copas'} onChange={(e) => handleUnidadChange(sel.producto, e.target.value)}>
                                                <option value="copas">Copas</option>
                                                <option value="unidades">Unidades</option>
                                            </select>
                                        ) : (
                                            <span style={{ fontSize: 12, color: '#666' }}>{prod.presentacion || 'unidades'}</span>
                                        )}
                                        <button type="button" onClick={() => handleQuitarProductoSeleccionado(sel.producto)}>Quitar</button>
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            <label>Costo de Trabajo:</label>
                            <input
                                type="number"
                                value={costoTrabajo}
                                onChange={(e) => setCostoTrabajo(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className={styles.modalBotones}>
                            {actividadEditando ? (
                                <button className={styles.guardar} onClick={handleSave}>Guardar</button>
                            ) : (
                                <button className={styles.guardar} onClick={handleSubmit}>Crear</button>
                            )}
                            <button className={styles.cancelar} onClick={() => setModalOpen(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Actividades;
