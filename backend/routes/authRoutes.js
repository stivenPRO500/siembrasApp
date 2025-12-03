import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import Suscripcion from '../models/Suscripcion.js';
const router = express.Router();

// Configuración de subida (igual que catálogo/suscripciones)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// Registro de usuario (público): crea cuenta en estado 'pendiente'
router.post('/register', async (req, res) => {
    try {
        let { username, email, password, role, agricultor } = req.body;
        if (!role || !['agricultor', 'usuario'].includes(role)) role = 'usuario';
        // No permitir crear admins por esta vía
        if (role === 'admin') return res.status(403).json({ message: 'No se puede crear admin mediante registro' });
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let agricultorRef;
        if (role === 'usuario' && agricultor) {
            const agriUser = await User.findById(agricultor);
            if (!agriUser || agriUser.role !== 'agricultor') {
                return res.status(400).json({ message: 'Referido agricultor no válido' });
            }
            agricultorRef = agriUser._id;
        }
        const newUser = new User({ username, email, password: hashedPassword, role, agricultor: agricultorRef, estado: 'pendiente', aprobado: false });
        await newUser.save();
        res.json({ message: 'Solicitud enviada. Espera aprobación del administrador.' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Registro + selección de suscripción (público)
router.post('/register-con-suscripcion', upload.single('comprobante'), async (req, res) => {
    try {
        let { username, email, password, role, agricultor, plan } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: 'Faltan datos de usuario' });
        if (!plan || !['1m','3m','1y'].includes(plan)) return res.status(400).json({ message: 'Plan inválido' });
        if (!role || !['agricultor','usuario'].includes(role)) role = 'usuario';
        if (role === 'admin') return res.status(403).json({ message: 'No se puede crear admin mediante registro' });
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let agricultorRef;
        if (role === 'usuario' && agricultor) {
            const agriUser = await User.findById(agricultor);
            if (!agriUser || agriUser.role !== 'agricultor') {
                return res.status(400).json({ message: 'Referido agricultor no válido' });
            }
            agricultorRef = agriUser._id;
        }

        const newUser = new User({ username, email, password: hashedPassword, role, agricultor: agricultorRef, estado: 'pendiente', aprobado: false });
        await newUser.save();

        // Subir comprobante y crear suscripción pendiente
        let comprobanteUrl;
        if (req.file) {
            if (useCloudinary) {
                const result = await subirACloudinary(req.file.buffer, req.file.originalname);
                comprobanteUrl = result.secure_url;
            } else {
                comprobanteUrl = `/uploads/${req.file.filename}`;
            }
        }
        const monto = plan === '1m' ? 50 : plan === '3m' ? 140 : 500;
        await Suscripcion.create({ usuario: newUser._id, plan, monto, comprobanteUrl, estado: 'pendiente' });

        res.json({ message: 'Registro creado y solicitud de suscripción enviada. Espera aprobación.' });
    } catch (error) {
        console.error('Error en registro con suscripción:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Login de usuario (solo si estado === 'aprobado')
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

        // Nueva lógica: permitir que el agricultor recién creado (estado 'pendiente', sin suscripción) ingrese para elegir plan.
        // Colaborador y otros estados siguen siendo bloqueados si no aprobados.
        if (user.role !== 'admin') {
            const esAgricultorNuevoSinSuscripcion = (user.role === 'agricultor' && user.estado === 'pendiente' && !user.suscripcionExpira);
            if (!esAgricultorNuevoSinSuscripcion) {
                if (user.estado === 'pendiente') return res.status(403).json({ message: 'Tu cuenta está pendiente de aprobación' });
                if (user.estado === 'rechazado') return res.status(403).json({ message: 'Tu solicitud fue rechazada' });
            }
            // Segundo nivel: flag aprobado falso, permitir solo si es el agricultor nuevo sin suscripción.
            if (!user.aprobado && !esAgricultorNuevoSinSuscripcion) {
                return res.status(403).json({ message: 'Acceso pendiente de aprobación', aprobado: false, estado: user.estado || 'pendiente' });
            }
        }

    // Genera el token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const ahora = new Date();
    let expiraRef = user.suscripcionExpira || null;
    let suspendidoRef = !!user.suscripcionSuspendido;
    // Si es colaborador, hereda suscripción del dueño (agricultor o admin)
    if (user.role === 'usuario' && user.agricultor) {
        const dueno = await User.findById(user.agricultor);
        if (!dueno) return res.status(400).json({ message: 'Dueño asociado no encontrado' });
        if (dueno.role === 'admin') {
            // Colaborador de admin nunca requiere suscripción
            expiraRef = null;
            suspendidoRef = false;
        } else {
            expiraRef = dueno.suscripcionExpira || null;
            suspendidoRef = !!dueno.suscripcionSuspendido;
        }
    }
    const expirada = !expiraRef || new Date(expiraRef) <= ahora;
    let enGracia = false;
    if (expiraRef && expirada && !suspendidoRef) {
        const diffDias = Math.ceil((ahora.getTime() - new Date(expiraRef).getTime()) / (1000*60*60*24));
        if (diffDias > 0 && diffDias <= 5) {
            enGracia = true;
        }
    }
    let requiereSuscripcion = user.role !== 'admin' && (suspendidoRef || (expirada && !enGracia));
        // Agricultor ya no tiene excepción: si no tiene suscripción válida y no está en gracia => requiereSuscripcion true.
    // Colaborador de admin nunca requiere suscripción
    if (user.role === 'usuario' && user.agricultor) {
        const dueno = await User.findById(user.agricultor);
        if (dueno && dueno.role === 'admin') {
            requiereSuscripcion = false;
            enGracia = false;
        }
    }
    // Forzar requiereSuscripcion para agricultor nuevo sin suscripción aunque estado/aprobado aún no definitivos
    if (user.role === 'agricultor' && !user.suscripcionExpira) {
        requiereSuscripcion = true;
    }
    res.json({ token, role: user.role, aprobado: user.aprobado === true, suscripcionExpira: expiraRef, requiereSuscripcion, suscripcionSuspendido: suspendidoRef, enGracia });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

router.get('/perfil', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});

// Crear usuario desde un admin
router.post('/crear', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado: solo administradores pueden crear usuarios' });
        }
        let { username, email, password, role, agricultor } = req.body;
        if (!role || !['admin','agricultor','usuario'].includes(role)) role = 'usuario';
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let agricultorRef = undefined;
        // Para crear colaboradores, permitir dueño agricultor o admin
        if (role === 'usuario') {
            if (!agricultor) {
                return res.status(400).json({ message: 'Debe especificar el dueño (agricultor o admin) para el colaborador' });
            }
            const dueno = await User.findById(agricultor);
            if (!dueno || !['agricultor','admin'].includes(dueno.role)) {
                return res.status(400).json({ message: 'Dueño inválido: debe ser agricultor o admin' });
            }
            agricultorRef = dueno._id;
        }

        const newUser = new User({ username, email, password: hashedPassword, role, agricultor: agricultorRef, estado: 'aprobado', aprobado: true });
        await newUser.save();
        res.status(201).json({ message: 'Usuario creado por el administrador con éxito', role: newUser.role });
    } catch (error) {
        console.error('Error creando usuario por admin:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// Asignar/actualizar agricultor a un usuario colaborador (admin o el propio agricultor puede invitar)
router.put('/usuarios/:id/asignar-agricultor', authMiddleware, async (req, res) => {
    try {
        const { agricultor } = req.body;
        const usuario = await User.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
        if (usuario.role !== 'usuario') return res.status(400).json({ message: 'Solo usuarios colaborador pueden asignarse a un agricultor' });
        const agriUser = await User.findById(agricultor);
        if (!agriUser || agriUser.role !== 'agricultor') return res.status(400).json({ message: 'Agricultor inválido' });
        // Permitir si admin o si el agricultor dueño está haciendo la petición
        if (!(req.user.role === 'admin' || req.user._id.toString() === agriUser._id.toString())) {
            return res.status(403).json({ message: 'No autorizado para asignar este agricultor' });
        }
        usuario.agricultor = agriUser._id;
        await usuario.save();
        res.json({ message: 'Agricultor asignado', usuarioId: usuario._id, agricultor: agriUser._id });
    } catch (e) {
        console.error('Error asignando agricultor:', e);
        res.status(500).json({ message: 'Error asignando agricultor' });
    }
});
// Eliminar usuario (solo admin)
router.delete("/usuarios/:id", authMiddleware, async (req, res) => {
    try {
        // Validar si es admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Acceso denegado" });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});

router.get("/usuarios", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Acceso denegado" });
        }

        const usuarios = await User.find().select("-password");
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});

// Listar solicitudes pendientes (admin)
router.get('/solicitudes', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
        const pendientes = await User.find({ estado: 'pendiente' }).select('-password');
        res.json(pendientes);
    } catch (e) {
        res.status(500).json({ message: 'Error al obtener solicitudes' });
    }
});

// Aprobar usuario
router.put('/usuarios/:id/aprobar', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
        const upd = await User.findByIdAndUpdate(req.params.id, { estado: 'aprobado', aprobado: true }, { new: true }).select('-password');
        if (!upd) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(upd);
    } catch (e) {
        res.status(500).json({ message: 'Error al aprobar usuario' });
    }
});

// Rechazar usuario
router.put('/usuarios/:id/rechazar', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
        const upd = await User.findByIdAndUpdate(req.params.id, { estado: 'rechazado', aprobado: false }, { new: true }).select('-password');
        if (!upd) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(upd);
    } catch (e) {
        res.status(500).json({ message: 'Error al rechazar usuario' });
    }
});


// export moved to end of file
// ---- Gestión de colaboradores ----
router.get('/mis-colaboradores', authMiddleware, async (req, res) => {
    try {
        if (!['agricultor','admin'].includes(req.user.role)) return res.status(403).json({ message: 'Solo agricultores o admin' });
        const colaboradores = await User.find({ role: 'usuario', agricultor: req.user._id }).select('-password');
        res.json(colaboradores);
    } catch (e) {
        res.status(500).json({ message: 'Error obteniendo colaboradores' });
    }
});

router.post('/colaboradores', authMiddleware, async (req, res) => {
    try {
        if (!['agricultor','admin'].includes(req.user.role)) return res.status(403).json({ message: 'Solo agricultores o admin pueden crear colaboradores' });
        const limite = req.user.role === 'admin' ? 5 : 2;
        const existentes = await User.countDocuments({ role: 'usuario', agricultor: req.user._id });
        if (existentes >= limite) return res.status(400).json({ message: `Límite de ${limite} colaboradores alcanzado` });
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: 'Faltan datos' });
        const ya = await User.findOne({ username });
        if (ya) return res.status(400).json({ message: 'Usuario ya existe' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Asignar "agricultor" igual al creador (admin o agricultor) para compartir ownerId
        const nuevo = await User.create({ username, email, password: hashedPassword, role: 'usuario', agricultor: req.user._id, estado: 'aprobado', aprobado: true });
        res.status(201).json({ message: 'Colaborador creado', colaborador: { _id: nuevo._id, username: nuevo.username, email: nuevo.email } });
    } catch (e) {
        res.status(500).json({ message: 'Error creando colaborador', error: e.message });
    }
});

// Actualizar colaborador (username, email y opcional password)
router.put('/colaboradores/:id', authMiddleware, async (req, res) => {
    try {
        if (!['agricultor','admin'].includes(req.user.role)) return res.status(403).json({ message: 'Solo agricultores o admin' });
        const col = await User.findById(req.params.id);
        if (!col || col.role !== 'usuario' || col.agricultor?.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Colaborador no encontrado' });
        }
        const { username, email, password } = req.body;
        if (username) {
            const existeUsername = await User.findOne({ username, _id: { $ne: col._id } });
            if (existeUsername) return res.status(400).json({ message: 'Username ya en uso' });
            col.username = username;
        }
        if (email) {
            const existeEmail = await User.findOne({ email, _id: { $ne: col._id } });
            if (existeEmail) return res.status(400).json({ message: 'Email ya en uso' });
            col.email = email;
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            col.password = await bcrypt.hash(password, salt);
        }
        await col.save();
        res.json({ message: 'Colaborador actualizado', colaborador: { _id: col._id, username: col.username, email: col.email } });
    } catch (e) {
        res.status(500).json({ message: 'Error actualizando colaborador', error: e.message });
    }
});

router.delete('/colaboradores/:id', authMiddleware, async (req, res) => {
    try {
        if (!['agricultor','admin'].includes(req.user.role)) return res.status(403).json({ message: 'Solo agricultores o admin' });
        const col = await User.findById(req.params.id);
        if (!col || col.role !== 'usuario' || col.agricultor?.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Colaborador no encontrado' });
        }
        await col.deleteOne();
        res.json({ message: 'Colaborador eliminado' });
    } catch (e) {
        res.status(500).json({ message: 'Error eliminando colaborador', error: e.message });
    }
});

// Asegurar cierre correcto antes de exportar

export default router;
