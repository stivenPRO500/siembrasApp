import express from 'express';
import Actividad from '../models/Actividad.js';
import Manzana from '../models/Manzana.js';

const router = express.Router();

// Crear una nueva actividad
router.post("/", async (req, res) => {
    try {
        const nuevaActividad = new Actividad(req.body);
        const actividadGuardada = await nuevaActividad.save();

        // Agregar la actividad a la manzana correspondiente
        await Manzana.findByIdAndUpdate(req.body.manzana, {
            $push: { actividades: actividadGuardada._id }
        });

        // Si la actividad no tiene fecha de alerta, la manzana se mantiene verde
        if (!req.body.fechaAlerta || req.body.fechaAlerta === "") {
            await Manzana.findByIdAndUpdate(req.body.manzana, { estado: "verde" });
        } else {
            // Revisar si existe una actividad futura del mismo tipo
            const actividadesMismaManzana = await Actividad.find({
                manzana: req.body.manzana,
                tipo: req.body.tipo,
                fechaAlerta: { $gt: new Date() } // Busca actividades con fecha futura
            });

            let nuevoEstado = "rojo";
            if (actividadesMismaManzana.length > 0) {
                nuevoEstado = "verde"; // Si hay una actividad futura del mismo tipo, vuelve a verde
            }

            await Manzana.findByIdAndUpdate(req.body.manzana, { estado: nuevoEstado });
        }

        res.status(201).json(actividadGuardada);
    } catch (error) {
        res.status(500).json({ message: "Error al crear la actividad", error });
    }
});


// Obtener todas las actividades
router.get('/', async (req, res) => {
    try {
        const actividades = await Actividad.find().populate('manzana');
        res.json(actividades);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las actividades", error });
    }
});

// Actualizar una actividad
router.put('/:id', async (req, res) => {
    try {
        const actividadActualizada = await Actividad.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(actividadActualizada);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la actividad", error });
    }
});

// Eliminar una actividad
router.delete('/:id', async (req, res) => {
    try {
        const actividadEliminada = await Actividad.findByIdAndDelete(req.params.id);

        // Eliminar la referencia en la manzana
        await Manzana.findByIdAndUpdate(actividadEliminada.manzana, {
            $pull: { actividades: req.params.id }
        });

        res.json({ message: "Actividad eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la actividad", error });
    }
});
// En tu controlador
router.get('/:id', async (req, res) => {
    try {
        const actividades = await Actividad.find({ manzana: req.params.id });
        res.json(actividades);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener actividades" });
    }
});

// Revisar y actualizar estado de actividades



export default router;
