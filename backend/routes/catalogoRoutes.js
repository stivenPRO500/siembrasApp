import express from 'express';
import Catalogo from '../models/Catalogo.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

// Obtener todos los productos del catálogo
router.get('/', async (req, res) => {
  try {
    const productos = await Catalogo.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el catálogo', error });
  }
});

// Agregar un nuevo producto al catálogo
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.precio !== undefined) body.precio = Number(body.precio) || 0;
    if (body.tipo === 'veneno' && body.copasPorUnidad !== undefined) {
      body.copasPorUnidad = Number(body.copasPorUnidad) || 0;
    }
    const nuevoProducto = new Catalogo(body);
    const productoGuardado = await nuevoProducto.save();
    res.status(201).json(productoGuardado);
  } catch (error) {
    res.status(400).json({ message: 'Error al agregar el producto', error });
  }
});

// Subida con imagen de archivo
router.post('/upload', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, tipo, precio, presentacion, copasPorUnidad } = req.body;
    const doc = await Catalogo.create({
      nombre,
      tipo,
      precio: Number(precio) || 0,
      presentacion: tipo === 'veneno' ? presentacion : undefined,
      copasPorUnidad: tipo === 'veneno' ? (Number(copasPorUnidad) || 0) : undefined,
      imagen: req.file ? `/uploads/${req.file.filename}` : undefined
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: 'Error al subir producto', error: err.message });
  }
});

// Actualizar un producto del catálogo
router.put('/:id', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.precio !== undefined) body.precio = Number(body.precio) || 0;
    if (body.copasPorUnidad !== undefined) body.copasPorUnidad = Number(body.copasPorUnidad) || 0;
    const productoActualizado = await Catalogo.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto', error });
  }
});

// Actualizar con nueva imagen
router.put('/:id/upload', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, tipo, precio, presentacion, copasPorUnidad } = req.body;
    const update = {
      nombre,
      tipo,
    };
    if (precio !== undefined) update.precio = Number(precio) || 0;
    if (tipo === 'veneno') {
      if (presentacion !== undefined) update.presentacion = presentacion;
      if (copasPorUnidad !== undefined) update.copasPorUnidad = Number(copasPorUnidad) || 0;
    }
    if (req.file) update.imagen = `/uploads/${req.file.filename}`;
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const productoActualizado = await Catalogo.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(productoActualizado);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar producto', error: err.message });
  }
});

// Eliminar un producto del catálogo
router.delete('/:id', async (req, res) => {
  try {
    await Catalogo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto', error });
  }
});

export default router;