import express from 'express';
import Manzana from '../models/Manzana.js';
import Actividad from "../models/Actividad.js";
import Cosecha from '../models/Cosecha.js';
const router = express.Router();

// Crear una nueva manzana
router.post('/', async (req, res) => {
    try {
        const nuevaManzana = new Manzana(req.body);
        const manzanaGuardada = await nuevaManzana.save();
        res.status(201).json(manzanaGuardada);
    } catch (error) {
        res.status(500).json({ message: "Error al crear la manzana", error });
    }
});

// Obtener todas las manzanas
router.get("/", async (req, res) => {
    try {
        const manzanas = await Manzana.find().populate("actividades");

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
router.put('/:id', async (req, res) => {
    try {
        const manzanaActualizada = await Manzana.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(manzanaActualizada);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la manzana", error });
    }
});

// Eliminar una manzana
router.delete('/:id', async (req, res) => {
    try {
        await Manzana.findByIdAndDelete(req.params.id);
        res.json({ message: "Manzana eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la manzana", error });
    }
});

// Obtener todas las manzanas y actualizar su estado según las actividades
router.get("/estado", async (req, res) => {
    try {
        const manzanas = await Manzana.find().populate("actividades");

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




export default router;

// Ruta para cosechar (debe ir antes de export en ESM? - añadir arriba de export but patch easier here)
router.post('/cosechar/:id', async (req, res) => {
    try {
        const manzana = await Manzana.findById(req.params.id).populate('actividades');
        if (!manzana) return res.status(404).json({ message: 'Manzana no encontrada' });

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
            totalCosto
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
