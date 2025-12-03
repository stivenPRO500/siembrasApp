import express from 'express';
import Cosecha from '../models/Cosecha.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Listar cosechas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cosechas = await Cosecha.find({ owner: req.ownerId }).populate('manzana').sort({ createdAt: -1 });
    res.json(cosechas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener cosechas', error: err.message });
  }
});

// Agregar una producción a una cosecha
router.post('/:id/producciones', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre = '', cantidad = 0, precio = 0 } = req.body || {};
    const cosecha = await Cosecha.findOne({ _id: id, owner: req.ownerId });
    if (!cosecha) return res.status(404).json({ message: 'Cosecha no encontrada' });
    cosecha.producciones = Array.isArray(cosecha.producciones) ? cosecha.producciones : [];
    cosecha.producciones.push({ nombre, cantidad: Number(cantidad) || 0, precio: Number(precio) || 0 });
    await cosecha.save();
    const doc = await Cosecha.findById(cosecha._id).populate('manzana');
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar producción', error: err.message });
  }
});

// Agregar un gasto extra a una cosecha
router.post('/:id/gastos', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre = '', monto = 0 } = req.body || {};
    const cosecha = await Cosecha.findOne({ _id: id, owner: req.ownerId });
    if (!cosecha) return res.status(404).json({ message: 'Cosecha no encontrada' });
    cosecha.gastosExtra = Array.isArray(cosecha.gastosExtra) ? cosecha.gastosExtra : [];
    cosecha.gastosExtra.push({ nombre, monto: Number(monto) || 0 });
    await cosecha.save();
    const doc = await Cosecha.findById(cosecha._id).populate('manzana');
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar gasto', error: err.message });
  }
});

// Eliminar producción por índice
router.delete('/:id/producciones/:index', authMiddleware, async (req, res) => {
  try {
    const { id, index } = req.params;
    const cosecha = await Cosecha.findOne({ _id: id, owner: req.ownerId });
    if (!cosecha) return res.status(404).json({ message: 'Cosecha no encontrada' });
    const idx = Number(index);
    if (!Array.isArray(cosecha.producciones) || idx < 0 || idx >= cosecha.producciones.length) {
      return res.status(400).json({ message: 'Índice de producción inválido' });
    }
    cosecha.producciones.splice(idx, 1);
    await cosecha.save();
    const doc = await Cosecha.findById(cosecha._id).populate('manzana');
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar producción', error: err.message });
  }
});

// Eliminar gasto extra por índice
router.delete('/:id/gastos/:index', authMiddleware, async (req, res) => {
  try {
    const { id, index } = req.params;
    const cosecha = await Cosecha.findOne({ _id: id, owner: req.ownerId });
    if (!cosecha) return res.status(404).json({ message: 'Cosecha no encontrada' });
    const idx = Number(index);
    if (!Array.isArray(cosecha.gastosExtra) || idx < 0 || idx >= cosecha.gastosExtra.length) {
      return res.status(400).json({ message: 'Índice de gasto inválido' });
    }
    cosecha.gastosExtra.splice(idx, 1);
    await cosecha.save();
    const doc = await Cosecha.findById(cosecha._id).populate('manzana');
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar gasto', error: err.message });
  }
});

// Marcar cosecha como pagada/no pagada y actualizar estado de la manzana
router.post('/:id/pagar', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { pagado = true } = req.body || {};
    const cosecha = await Cosecha.findOne({ _id: id, owner: req.ownerId }).populate('manzana');
    if (!cosecha) return res.status(404).json({ message: 'Cosecha no encontrada' });
    cosecha.pagado = !!pagado;
    await cosecha.save();
    if (cosecha.manzana) {
      const estado = cosecha.pagado ? 'verde' : 'rojo';
      await (await import('../models/Manzana.js')).default.findByIdAndUpdate(cosecha.manzana._id, { estado });
    }
    const doc = await Cosecha.findById(cosecha._id).populate('manzana');
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar pago', error: err.message });
  }
});

export default router;