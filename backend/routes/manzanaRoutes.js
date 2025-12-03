import express from 'express';
import Manzana from '../models/Manzana.js';
import Actividad from "../models/Actividad.js";
import Cosecha from '../models/Cosecha.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();
// ----- Admin: gestionar índices de Manzana -----
router.get('/indices', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
        const indexes = await Manzana.collection.indexes();
        res.json(indexes);
    } catch (e) {
        res.status(500).json({ message: 'Error listando índices', error: e.message });
    }
});

router.delete('/indices/owner-nombre', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
        await Manzana.collection.dropIndex('owner_1_nombre_1');
        res.json({ message: 'Índice owner_1_nombre_1 eliminado' });
    } catch (e) {
        res.status(500).json({ message: 'Error eliminando índice', error: e.message });
    }
});

router.delete('/indices/nombre', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
        await Manzana.collection.dropIndex('nombre_1');
        res.json({ message: 'Índice nombre_1 eliminado' });
    } catch (e) {
        res.status(500).json({ message: 'Error eliminando índice nombre_1', error: e.message });
    }
});

// Crear una nueva manzana
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (!['admin','agricultor','usuario'].includes(req.user.role)) {
            return res.status(403).json({ message: 'No autorizado para crear manzanas' });
        }
        const nombreRaw = (req.body.nombre || '').trim();
        if (!nombreRaw) return res.status(400).json({ message: 'Nombre de manzana requerido' });
        const nuevaManzana = new Manzana({
            ...req.body,
            nombre: nombreRaw,
            owner: req.ownerId
        });
        const manzanaGuardada = await nuevaManzana.save();
        res.status(201).json(manzanaGuardada);
    } catch (error) {
        console.error('Error creando manzana:', error);
        res.status(500).json({ message: "Error al crear la manzana", error: error.message });
    }
});

// Obtener todas las manzanas
router.get("/", authMiddleware, async (req, res) => {
    try {
        const manzanas = await Manzana.find({ owner: req.ownerId }).populate("actividades");

        const hoy = new Date();

        // Modificar cada manzana para incluir todas las actividades pendientes
        const manzanasConPendientes = manzanas.map((manzana) => {
            const actividadesPendientes = manzana.actividades.filter((actividad) => {
                return actividad.fechaAlerta && new Date(actividad.fechaAlerta) <= hoy;
            });

            return {
                ...manzana._doc, 
                actividadesPendientes, // Agregamos todas las actividades pendientes
            };
        });

        res.json(manzanasConPendientes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las manzanas", error });
    }
});


// Actualizar una manzana
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const manzana = await Manzana.findById(req.params.id);
        if (!manzana) return res.status(404).json({ message: 'Manzana no encontrada' });
        if (manzana.owner && manzana.owner.toString() !== req.ownerId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para actualizar esta manzana' });
        }
        Object.assign(manzana, req.body);
        await manzana.save();
        res.json(manzana);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la manzana", error: error.message });
    }
});

// Eliminar una manzana
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const manzana = await Manzana.findById(req.params.id);
        if (!manzana) return res.status(404).json({ message: 'Manzana no encontrada' });
        if (manzana.owner && manzana.owner.toString() !== req.ownerId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para eliminar esta manzana' });
        }
        await manzana.deleteOne();
        res.json({ message: "Manzana eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la manzana", error: error.message });
    }
});

// Obtener todas las manzanas y actualizar su estado según las actividades
router.get("/estado", authMiddleware, async (req, res) => {
    try {
        const manzanas = await Manzana.find({ owner: req.ownerId }).populate("actividades");

        const hoy = new Date();

        for (const manzana of manzanas) {
            let estadoManzana = "verde"; // Estado por defecto
            let tienePendientes = false;
            const actividadesPorTipo = {};

            // Agrupar actividades por tipo y mantener la más reciente
            manzana.actividades.forEach(actividad => {
                if (!actividadesPorTipo[actividad.tipo] || new Date(actividad.fechaRealizacion) > new Date(actividadesPorTipo[actividad.tipo].fechaRealizacion)) {
                    actividadesPorTipo[actividad.tipo] = actividad;
                }
            });

            // Revisar el estado de las actividades
            for (const actividad of manzana.actividades) {
                const fechaAlerta = actividad.fechaAlerta ? new Date(actividad.fechaAlerta) : null;
                let nuevoEstado = "completada"; // Estado por defecto

                // Si la actividad es la más reciente de su tipo
                if (actividadesPorTipo[actividad.tipo]._id.toString() === actividad._id.toString()) {
                    if (fechaAlerta && fechaAlerta <= hoy) {
                        nuevoEstado = "pendiente"; // La fecha de alerta ya pasó
                        tienePendientes = true;
                    }
                }

                // Actualizar el estado de la actividad si cambió
                if (actividad.estado !== nuevoEstado) {
                    await Actividad.findByIdAndUpdate(actividad._id, { estado: nuevoEstado });
                }
            }

            // Si hay actividades pendientes, la manzana es roja, si no, es verde
            estadoManzana = tienePendientes ? "rojo" : "verde";

            // Actualizar estado de la manzana si ha cambiado
            if (manzana.estado !== estadoManzana) {
                await Manzana.findByIdAndUpdate(manzana._id, { estado: estadoManzana });
            }
        }

        res.json(manzanas);
    } catch (error) {
        console.error("❌ ERROR en /estado:", error);
        res.status(500).json({ message: "Error al actualizar estados", error });
    }
});




// Ruta para cosechar una manzana: crea documento Cosecha con snapshot y limpia actividades
router.post('/cosechar/:id', authMiddleware, async (req, res) => {
    try {
        const manzana = await Manzana.findById(req.params.id).populate('actividades');
        if (!manzana) return res.status(404).json({ message: 'Manzana no encontrada' });
        // Verificar propiedad
        if (manzana.owner && manzana.owner.toString() !== req.ownerId.toString()) {
            return res.status(403).json({ message: 'No autorizado para cosechar esta manzana' });
        }

        const actividadesSnapshot = manzana.actividades.map(a => ({
            tipo: a.tipo,
            fechaRealizacion: a.fechaRealizacion,
            costoTotal: a.costoTotal || 0,
            productosUtilizados: (a.productosUtilizados || []).map(p => ({
                producto: p.producto,
                cantidad: p.cantidad,
                costo: p.costo
            })),
            costoTrabajo: a.costoTrabajo || 0
        }));
        const totalCosto = actividadesSnapshot.reduce((acc, act) => acc + (act.costoTotal || 0), 0);

        const cosecha = await Cosecha.create({
            manzana: manzana._id,
            actividades: actividadesSnapshot,
            totalCosto,
            owner: req.ownerId
        });

        // Borrar actividades y limpiar referencia
        await Actividad.deleteMany({ _id: { $in: manzana.actividades } });
        manzana.actividades = [];
        manzana.estado = 'verde';
        await manzana.save();

        res.json({ message: 'Cosecha realizada', cosecha });
    } catch (error) {
        res.status(500).json({ message: 'Error al cosechar', error: error.message });
    }
});

export default router;
