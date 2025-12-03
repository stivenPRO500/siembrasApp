import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import Suscripcion from '../models/Suscripcion.js';
import User from '../models/user.js';
import authMiddleware from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config Cloudinary similar to catalogo
const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;
const useCloudinary = !!(CLOUDINARY_URL || (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET));
if (useCloudinary) {
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
}

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

const subirACloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      folder: 'comprobantes',
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

// Crear una solicitud de suscripción con comprobante
router.post('/crear', authMiddleware, upload.single('comprobante'), async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['1m','3m','1y'].includes(plan)) {
      return res.status(400).json({ message: 'Plan inválido' });
    }
    // Evitar duplicados: si ya hay una solicitud pendiente o una suscripción vigente
    const ahora = new Date();
    const pendiente = await Suscripcion.findOne({ usuario: req.user._id, estado: 'pendiente' });
    if (pendiente) {
      return res.status(409).json({ message: 'Ya tienes una solicitud de suscripción pendiente' });
    }
    const vigente = await Suscripcion.findOne({ usuario: req.user._id, estado: 'aprobado', fechaFin: { $gt: ahora } });
    if (vigente) {
      return res.status(409).json({ message: `Ya tienes una suscripción activa hasta ${vigente.fechaFin.toLocaleDateString()}` });
    }
    const monto = plan === '1m' ? 50 : plan === '3m' ? 140 : 500;
    let comprobanteUrl;
    if (req.file) {
      if (useCloudinary) {
        try {
          const result = await subirACloudinary(req.file.buffer, req.file.originalname);
          comprobanteUrl = result.secure_url;
        } catch (e) {
          return res.status(500).json({ message: 'Error subiendo comprobante', error: e.message });
        }
      } else {
        comprobanteUrl = `/uploads/${req.file.filename}`;
      }
    }
    const doc = await Suscripcion.create({
      usuario: req.user._id,
      plan,
      monto,
      comprobanteUrl,
      estado: 'pendiente'
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: 'Error creando suscripción', error: e.message });
  }
});

// Listar solicitudes pendientes (admin)
router.get('/pendientes', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
    const docs = await Suscripcion.find({ estado: 'pendiente' }).populate('usuario', 'username email role');
    res.json(docs);
  } catch (e) {
    res.status(500).json({ message: 'Error listando suscripciones', error: e.message });
  }
});

// Aprobar o rechazar
router.put('/:id/aprobar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
    const doc = await Suscripcion.findById(req.params.id).populate('usuario');
    if (!doc) return res.status(404).json({ message: 'No encontrada' });
    if (doc.estado !== 'pendiente') return res.status(400).json({ message: 'Ya procesada' });
    const now = new Date();
    let dias = doc.plan === '1m' ? 30 : doc.plan === '3m' ? 90 : 365;
    const fin = new Date(now.getTime() + dias*24*60*60*1000);
    doc.estado = 'aprobado';
    doc.fechaInicio = now;
    doc.fechaFin = fin;
    await doc.save();
    // Marcar usuario como aprobado y actualizar expiración. Limpiar suspensión y periodo de gracia.
    await User.findByIdAndUpdate(doc.usuario._id, { 
      aprobado: true,
      estado: 'aprobado',
      suscripcionExpira: fin,
      suscripcionSuspendido: false,
      suscripcionGraceInicio: null
    });
    res.json({ message: 'Aprobada', suscripcion: doc });
  } catch (e) {
    res.status(500).json({ message: 'Error aprobando', error: e.message });
  }
});
// --------- NUEVAS RUTAS DE ADMIN PARA ESTADOS DE USUARIOS ---------
router.get('/admin-usuarios', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
    const usuarios = await User.find({ role: { $ne: 'admin' } }).select('-password');
    const ahora = new Date();
    const resultado = [];
    for (const u of usuarios) {
      let ultimaAprobada = await Suscripcion.findOne({ usuario: u._id, estado: 'aprobado' }).sort({ fechaFin: -1 });
      let pendiente = await Suscripcion.findOne({ usuario: u._id, estado: 'pendiente' }).sort({ createdAt: -1 });
      let estadoComputado;
      let diasRestantes = null;
      let diasGraciaRestantes = null;
      if (ultimaAprobada) {
        if (ahora <= ultimaAprobada.fechaFin) {
          estadoComputado = 'vigente';
          diasRestantes = Math.ceil((ultimaAprobada.fechaFin.getTime() - ahora.getTime()) / (1000*60*60*24));
        } else {
          // Expirada
          if (u.suscripcionSuspendido) {
            estadoComputado = 'suspendido';
          } else {
            // gracia
            let graceInicio = u.suscripcionGraceInicio;
            if (!graceInicio) {
              graceInicio = ahora;
              u.suscripcionGraceInicio = graceInicio;
              await u.save();
            }
            const diasDesdeGrace = Math.ceil((ahora.getTime() - graceInicio.getTime()) / (1000*60*60*24));
            if (diasDesdeGrace <= 5) {
              estadoComputado = 'expirada-gracia';
              diasGraciaRestantes = 5 - diasDesdeGrace;
            } else {
              // Suspender automáticamente
              u.suscripcionSuspendido = true;
              await u.save();
              estadoComputado = 'suspendido';
            }
          }
        }
      } else {
        if (pendiente) estadoComputado = 'pendiente-verificacion';
        else estadoComputado = 'sin-suscripcion';
      }
      if (pendiente && estadoComputado === 'suspendido') {
        // Si está suspendido pero tiene una nueva pendiente, mostrar como pendiente-verificacion
        estadoComputado = 'pendiente-verificacion';
      }
      resultado.push({
        usuario: u,
        ultimaAprobada,
        pendiente,
        estadoComputado,
        diasRestantes,
        diasGraciaRestantes
      });
    }
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ message: 'Error obteniendo usuarios suscripciones', error: e.message });
  }
});

router.put('/usuarios/:id/suspender', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    u.suscripcionSuspendido = true;
    await u.save();
    res.json({ message: 'Usuario suspendido' });
  } catch (e) {
    res.status(500).json({ message: 'Error suspendiendo usuario', error: e.message });
  }
});

router.put('/usuarios/:id/rehabilitar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
    u.suscripcionSuspendido = false;
    u.suscripcionGraceInicio = null;
    await u.save();
    res.json({ message: 'Usuario rehabilitado' });
  } catch (e) {
    res.status(500).json({ message: 'Error rehabilitando usuario', error: e.message });
  }
});

router.put('/:id/rechazar', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Solo admin' });
    const doc = await Suscripcion.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'No encontrada' });
    if (doc.estado !== 'pendiente') return res.status(400).json({ message: 'Ya procesada' });
    doc.estado = 'rechazado';
    await doc.save();
    res.json({ message: 'Rechazada' });
  } catch (e) {
    res.status(500).json({ message: 'Error rechazando', error: e.message });
  }
});

// Obtener mi última suscripción
router.get('/mi-ultima', authMiddleware, async (req, res) => {
  try {
    const doc = await Suscripcion.findOne({ usuario: req.user._id, estado: 'aprobado' }).sort({ fechaFin: -1 });
    res.json(doc || null);
  } catch (e) {
    res.status(500).json({ message: 'Error obteniendo suscripción', error: e.message });
  }
});

export default router;

// Nuevas rutas de administración para usuarios
