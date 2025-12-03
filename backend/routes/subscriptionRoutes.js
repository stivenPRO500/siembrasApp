import express from 'express';
import AccessRequest from '../models/Subscription.js';
import User from '../models/user.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear solicitud de acceso (pública, sin token) desde el formulario de registro
router.post('/solicitar-publico', async (req, res) => {
	try {
		const { username, email, motivo } = req.body || {};
		if (!username && !email) return res.status(400).json({ message: 'Debe proporcionar username o email' });
		const query = username ? { username } : { email };
		const user = await User.findOne(query);
		if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
		if (user.role === 'admin') return res.status(400).json({ message: 'El administrador no requiere aprobación' });
		if (user.aprobado) return res.status(400).json({ message: 'El usuario ya está aprobado' });
		const existente = await AccessRequest.findOne({ usuario: user._id, estado: 'pendiente' });
		if (existente) return res.status(400).json({ message: 'Ya existe una solicitud pendiente' });
		const reqNueva = await AccessRequest.create({ usuario: user._id, motivo });
		res.status(201).json(reqNueva);
	} catch (e) {
		res.status(500).json({ message: 'Error creando solicitud pública', error: e.message });
	}
});

// Crear solicitud de acceso (usuario logueado no aprobado)
router.post('/solicitar', authMiddleware, async (req, res) => {
	try {
		const user = req.user;
		if (user.aprobado) return res.status(400).json({ message: 'Ya estás aprobado' });
		// Verificar si ya existe una solicitud pendiente
		const existente = await AccessRequest.findOne({ usuario: user._id, estado: 'pendiente' });
		if (existente) return res.status(400).json({ message: 'Ya tienes una solicitud pendiente' });
		const reqNueva = await AccessRequest.create({ usuario: user._id, motivo: req.body.motivo });
		res.status(201).json(reqNueva);
	} catch (e) {
		res.status(500).json({ message: 'Error creando solicitud', error: e.message });
	}
});

// Listar solicitudes pendientes (admin)
router.get('/pendientes', authMiddleware, async (req, res) => {
	try {
		if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
		const pendientes = await AccessRequest.find({ estado: 'pendiente' }).populate('usuario', 'username email role aprobado');
		res.json(pendientes);
	} catch (e) {
		res.status(500).json({ message: 'Error listando solicitudes', error: e.message });
	}
});

// Aprobar solicitud
router.put('/:id/aprobar', authMiddleware, async (req, res) => {
	try {
		if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
		const solicitud = await AccessRequest.findById(req.params.id);
		if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
		if (solicitud.estado !== 'pendiente') return res.status(400).json({ message: 'La solicitud ya fue procesada' });
	solicitud.estado = 'aprobado';
		solicitud.fechaDecision = new Date();
		await solicitud.save();
	// Marcar usuario como aprobado
	await User.findByIdAndUpdate(solicitud.usuario, { aprobado: true, estado: 'aprobado' });
		res.json({ message: 'Solicitud aprobada', solicitudId: solicitud._id });
	} catch (e) {
		res.status(500).json({ message: 'Error aprobando solicitud', error: e.message });
	}
});

// Rechazar solicitud
router.put('/:id/rechazar', authMiddleware, async (req, res) => {
	try {
		if (req.user.role !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
		const solicitud = await AccessRequest.findById(req.params.id);
		if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
		if (solicitud.estado !== 'pendiente') return res.status(400).json({ message: 'La solicitud ya fue procesada' });
	solicitud.estado = 'rechazado';
		solicitud.fechaDecision = new Date();
		await solicitud.save();
	await User.findByIdAndUpdate(solicitud.usuario, { estado: 'rechazado', aprobado: false });
		res.json({ message: 'Solicitud rechazada', solicitudId: solicitud._id });
	} catch (e) {
		res.status(500).json({ message: 'Error rechazando solicitud', error: e.message });
	}
});

export default router;
