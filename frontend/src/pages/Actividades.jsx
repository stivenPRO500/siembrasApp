import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./Actividades.module.css";

const Actividades = () => {
    const { manzanaId } = useParams();
    const navigate = useNavigate();
    const [actividades, setActividades] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [actividadEditando, setActividadEditando] = useState(null);
    const [nuevoTipo, setNuevoTipo] = useState("");
    const [nuevaFecha, setNuevaFecha] = useState("");

    useEffect(() => {
        fetchActividades();
    }, [manzanaId]);

    const fetchActividades = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND}/actividades/${manzanaId}`);
            const data = await response.json();
            setActividades(data);
        } catch (error) {
            console.error("Error al obtener actividades:", error);
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };


    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta actividad?")) {
            try {
                await fetch(`${import.meta.env.VITE_BACKEND}/actividades/${id}`, {
                    method: "DELETE",
                });
                setActividades(actividades.filter((actividad) => actividad._id !== id));
            } catch (error) {
                console.error("Error al eliminar la actividad:", error);
            }
        }
    };

    const handleEdit = (actividad) => {
        setActividadEditando(actividad);
        setNuevoTipo(actividad.tipo);
        setNuevaFecha(formatDate(actividad.fechaRealizacion));
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND}/actividades/${actividadEditando._id}`, {
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
   

    return (
       
        <div className={styles.actividadesContainer}>
             <button
                onClick={() => navigate("/dashboard")}
                style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}
            >
                Regresar
            </button>
            <h2>Lista de Actividades</h2>
            <div className={styles.actividadesList}>
                {actividades.length > 0 ? (
                    actividades.map((actividad) => (
                        <div key={actividad._id} className={styles.actividadCard}>
                            <div>
                                <h3>{actividad.tipo}</h3>
                                <div className={styles.fechas}>
                                    <span>Fecha de Realización: {formatDate(actividad.fechaRealizacion)}</span>
                                </div>
                            </div>
                            <div className={styles.botones}>
                                <button className={styles.editar} onClick={() => handleEdit(actividad)}>Editar</button>
                                <button className={styles.eliminar} onClick={() => handleDelete(actividad._id)}>Eliminar</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No hay actividades para esta manzana.</p>
                )}
            </div>

            {modalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Editar Actividad</h3>
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
                        <div className={styles.modalBotones}>
                            <button className={styles.guardar} onClick={handleSave}>Guardar</button>
                            <button className={styles.cancelar} onClick={() => setModalOpen(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Actividades;
