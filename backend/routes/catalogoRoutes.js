import express from 'express';
import Catalogo from '../models/Catalogo.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración condicional de Cloudinary (persistente) vs almacenamiento local (efímero)
const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;
// Usar Cloudinary si se define CLOUDINARY_URL o las 3 credenciales separadas
const useCloudinary = !!(CLOUDINARY_URL || (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET));
if (useCloudinary) {
  // Si se provee CLOUDINARY_URL, la SDK lee la config del env; sólo forzamos secure
  if (CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true
    });
  }
  console.log('[Catalogo] Cloudinary habilitado para imágenes.');
} else {
  console.warn('[Catalogo] Cloudinary no configurado. Usando almacenamiento local (se perderá al reiniciar).');
}

// Elegir el storage de multer según el modo
let storage;
if (useCloudinary) {
  storage = multer.memoryStorage();
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    }
  });
}
const upload = multer({ storage });

// Helper para subir a Cloudinary si corresponde
const subirACloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      folder: 'catalogo',
      resource_type: 'image',
      filename_override: originalname,
      use_filename: true,
      unique_filename: true
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
};

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
    let imagenUrl;
    if (req.file) {
      if (useCloudinary) {
        try {
          const result = await subirACloudinary(req.file.buffer, req.file.originalname);
          imagenUrl = result.secure_url;
        } catch (e) {
          console.error('Error subiendo a Cloudinary:', e.message);
          return res.status(500).json({ message: 'Error al subir imagen a Cloudinary', error: e.message });
        }
      } else {
        imagenUrl = `/uploads/${req.file.filename}`;
      }
    }
    const doc = await Catalogo.create({
      nombre,
      tipo,
      precio: Number(precio) || 0,
      presentacion: tipo === 'veneno' ? presentacion : undefined,
      copasPorUnidad: tipo === 'veneno' ? (Number(copasPorUnidad) || 0) : undefined,
      imagen: imagenUrl
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
    const update = { nombre, tipo };
    if (precio !== undefined) update.precio = Number(precio) || 0;
    if (tipo === 'veneno') {
      if (presentacion !== undefined) update.presentacion = presentacion;
      if (copasPorUnidad !== undefined) update.copasPorUnidad = Number(copasPorUnidad) || 0;
    }
    if (req.file) {
      if (useCloudinary) {
        try {
          const result = await subirACloudinary(req.file.buffer, req.file.originalname);
          update.imagen = result.secure_url;
        } catch (e) {
          console.error('Error subiendo a Cloudinary (update):', e.message);
          return res.status(500).json({ message: 'Error al subir imagen a Cloudinary', error: e.message });
        }
      } else {
        update.imagen = `/uploads/${req.file.filename}`;
      }
    }
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