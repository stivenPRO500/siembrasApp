import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Verifica si el usuario ya existe
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: "El usuario ya existe" });

        // Hashea la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crea el usuario
        const newUser = new User({ username, email, password: hashedPassword, role });
        await newUser.save();

        res.json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
    }
});


// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verifica si el usuario existe
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

        // Compara la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

        // Genera el token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor" });
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
        // Solo los admins pueden crear usuarios
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Acceso denegado: solo administradores pueden crear usuarios" });
        }

        const { username, email, password, role } = req.body;

        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: "El usuario ya existe" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: "Usuario creado por el administrador con éxito" });

    } catch (error) {
        console.error("Error creando usuario por admin:", error);
        res.status(500).json({ message: "Error al crear usuario" });
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



export default router;
