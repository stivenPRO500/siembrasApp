import express from 'express';
import Cosecha from '../models/Cosecha.js';

const router = express.Router();

// Listar cosechas
router.get('/', async (req, res) => {
  try {
    const cosechas = await Cosecha.find().populate('manzana').sort({ createdAt: -1 });
    res.json(cosechas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener cosechas', error: err.message });
  }
});

export default router;