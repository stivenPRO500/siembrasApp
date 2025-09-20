import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaClipboardList, FaSignOutAlt, FaSearch } from "react-icons/fa"; // Agrega FaSearch

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

    // Estados para búsqueda y filtro
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState(""); // "" = todos, "rojo", "verde"

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND}/manzanas`)
            .then(res => res.json())
            .then(data => setManzanas(data))
            .catch(error => console.error("Error al obtener manzanas:", error));
    }, []);

    const handleAgregarManzana = () => {
        if (!nuevaManzana.trim()) return;

        fetch(`${import.meta.env.VITE_BACKEND}/manzanas`, {
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
    };

    const handleSubmitActividad = (e) => {
        e.preventDefault();

        fetch(`${import.meta.env.VITE_BACKEND}/actividades`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo: actividad.tipo,
                fechaRealizacion: actividad.fechaRealizacion,
                fechaAlerta: actividad.fechaAlerta,
                manzana: actividad.manzanaId // Esto debe tener el ID de la manzana
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
            const response = await fetch(`${import.meta.env.VITE_BACKEND}/manzanas/${id}`, {
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
                const res = await fetch(`${import.meta.env.VITE_BACKEND}/manzanas/estado`); // Llamamos al nuevo endpoint
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

                    return (
                        <div key={manzana._id} className={`${styles.manzanaCard} ${styles[manzana.estado] || ""}`}>
                           <h2>
                              {manzana.nombre}
                              {/* Contador de días desde la última siembra */}
                              {(() => {
                               const dias = diasDesdeSiembra(manzana);
                               return dias !== null ? (
                                     <span className={styles.contadorDias}>
                                       {dias} dias
                                     </span>
                               ) : null;
                             })()}
                           </h2>
                            <p>{manzana.actividades.length} actividades realizadas</p>

                            {/* Mostrar alerta SOLO si la manzana está en rojo y hay actividades pendientes */}
                            {manzana.estado === "rojo" && manzana.actividades
                                .filter(a => a.estado === "pendiente")
                                .map(a => (
                                    <p key={a._id} className={styles.alerta}>
                                        ⚠️ Actividad pendiente: {a.tipo}
                                    </p>
                                ))
                            }

                            <div className={styles.cardButtons}>
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
                            </select>
                            <input
                                type="date"
                                value={actividad.fechaRealizacion}
                                onChange={(e) => setActividad({ ...actividad, fechaRealizacion: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                value={actividad.fechaAlerta}
                                onChange={(e) => setActividad({ ...actividad, fechaAlerta: e.target.value })}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
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
