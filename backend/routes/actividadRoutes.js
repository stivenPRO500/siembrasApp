import express from 'express';
import Actividad from '../models/Actividad.js';
import Manzana from '../models/Manzana.js';
import Catalogo from '../models/Catalogo.js';

const router = express.Router();

// Crear una nueva actividad
router.post("/", async (req, res) => {
    try {
        // Calcular costos por producto y totales, soportando 'copas' para cualquier veneno
        let costoProductos = 0;
        let productosCalculados = [];

        if (Array.isArray(req.body.productosUtilizados)) {
            for (const item of req.body.productosUtilizados) {
                const prod = await Catalogo.findById(item.producto);
                if (!prod) {
                    return res.status(400).json({ message: `Producto con ID ${item.producto} no encontrado.` });
                }

                const unidad = item.unidad || 'unidades';
                let costoLinea = 0;

                if (prod.tipo === 'veneno' && unidad === 'copas') {
                    // costo por copa = precio / copasPorUnidad (o fallback por presentación)
                    let copasPorUnidad = Number(prod.copasPorUnidad) || 0;
                    if (!copasPorUnidad) {
                        // Fallbacks: litro=40, galon~151.4, caneca~800, bolsa=40 (ajustable)
                        if (prod.presentacion === 'litro') copasPorUnidad = 40;
                        else if (prod.presentacion === 'galon') copasPorUnidad = 151.4;
                        else if (prod.presentacion === 'caneca') copasPorUnidad = 800;
                        else copasPorUnidad = 40;
                    }
                    const costoCopa = prod.precio / copasPorUnidad;
                    costoLinea = costoCopa * Number(item.cantidad || 0);
                } else if (prod.tipo === 'semillas' && unidad === 'libras') {
                    // costo por libra = precio / librasPorBolsa
                    const librasPorBolsa = Number(prod.librasPorBolsa) || 1;
                    const costoPorLibra = prod.precio / librasPorBolsa;
                    costoLinea = costoPorLibra * Number(item.cantidad || 0);
                } else {
                    // unidades completas (presentaciones completas)
                    costoLinea = prod.precio * Number(item.cantidad || 0);
                }

                costoProductos += costoLinea;
                productosCalculados.push({
                    producto: prod._id,
                    cantidad: Number(item.cantidad || 0),
                    unidad,
                    costo: Number(costoLinea.toFixed(2)),
                });
            }
        }

        const costoTrabajo = Number(req.body.costoTrabajo || 0);
        const costoTotal = Number((costoProductos + costoTrabajo).toFixed(2));

        const nuevaActividad = new Actividad({
            ...req.body,
            productosUtilizados: productosCalculados,
            costoTrabajo,
            costoTotal,
        });
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
        const actividadExistente = await Actividad.findById(req.params.id);
        if (!actividadExistente) {
            return res.status(404).json({ message: 'Actividad no encontrada' });
        }

        // Recalcular costos si vienen productosUtilizados o costoTrabajo
        let productosCalculados = actividadExistente.productosUtilizados || [];
        if (Array.isArray(req.body.productosUtilizados)) {
            productosCalculados = [];
            let costoProductos = 0;
            for (const item of req.body.productosUtilizados) {
                const prod = await Catalogo.findById(item.producto);
                if (!prod) {
                    return res.status(400).json({ message: `Producto con ID ${item.producto} no encontrado.` });
                }
                const unidad = item.unidad || 'unidades';
                let costoLinea = 0;
                if (prod.tipo === 'veneno' && unidad === 'copas') {
                    let copasPorUnidad = Number(prod.copasPorUnidad) || 0;
                    if (!copasPorUnidad) {
                        if (prod.presentacion === 'litro') copasPorUnidad = 40;
                        else if (prod.presentacion === 'galon') copasPorUnidad = 151.4;
                        else if (prod.presentacion === 'caneca') copasPorUnidad = 800;
                        else copasPorUnidad = 40;
                    }
                    const costoCopa = prod.precio / copasPorUnidad;
                    costoLinea = costoCopa * Number(item.cantidad || 0);
                } else if (prod.tipo === 'semillas' && unidad === 'libras') {
                    const costoPorLibra = prod.precio / (prod.librasPorBolsa || 1);
                    costoLinea = costoPorLibra * Number(item.cantidad || 0);
                } else {
                    costoLinea = prod.precio * Number(item.cantidad || 0);
                }
                costoProductos += costoLinea;
                productosCalculados.push({
                    producto: prod._id,
                    cantidad: Number(item.cantidad || 0),
                    unidad,
                    costo: Number(costoLinea.toFixed(2))
                });
            }
            req.body.costoTrabajo = Number(req.body.costoTrabajo || 0);
            req.body.costoTotal = Number((costoProductos + req.body.costoTrabajo).toFixed(2));
        } else if (typeof req.body.costoTrabajo !== 'undefined') {
            // Si sólo actualiza costoTrabajo recalcular costoTotal con productos previos
            const costoProductosPrevio = productosCalculados.reduce((acc, p) => acc + Number(p.costo || 0), 0);
            req.body.costoTrabajo = Number(req.body.costoTrabajo || 0);
            req.body.costoTotal = Number((costoProductosPrevio + req.body.costoTrabajo).toFixed(2));
        }

        // Preparar objeto de actualización
        const update = {
            tipo: req.body.tipo ?? actividadExistente.tipo,
            fechaRealizacion: req.body.fechaRealizacion ?? actividadExistente.fechaRealizacion,
            fechaAlerta: req.body.fechaAlerta ?? actividadExistente.fechaAlerta,
            productosUtilizados: productosCalculados,
            costoTrabajo: typeof req.body.costoTrabajo !== 'undefined' ? req.body.costoTrabajo : actividadExistente.costoTrabajo,
            costoTotal: typeof req.body.costoTotal !== 'undefined' ? req.body.costoTotal : actividadExistente.costoTotal,
        };

        const actividadActualizada = await Actividad.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(actividadActualizada);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la actividad', error });
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

