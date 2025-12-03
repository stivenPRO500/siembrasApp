import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import Manzana from '../models/Manzana.js';
import Cosecha from '../models/Cosecha.js';
import Actividad from '../models/Actividad.js';
import Catalogo from '../models/Catalogo.js';
import User from '../models/user.js';

const router = express.Router();

// Admin-only: resumen de owners en colecciones
router.get('/owners-summary', authMiddleware, async (req, res) => {
	try {
		if (!req.user || req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Solo admin' });
		}
		const admin = await User.findOne({ role: 'admin' });
		const adminId = admin?._id?.toString();

		const summarize = async (Model, nombre) => {
			const agg = await Model.aggregate([
				{ $group: { _id: { $ifNull: ['$owner', 'sin_owner'] }, count: { $sum: 1 } } },
				{ $sort: { count: -1 } }
			]);
			return {
				nombre,
				total: agg.reduce((a,b)=> a+b.count, 0),
				grupos: agg.map(g => ({ owner: g._id === 'sin_owner' ? 'sin_owner' : g._id.toString(), count: g.count, esAdmin: adminId && g._id !== 'sin_owner' ? g._id.toString() === adminId : false }))
			};
		};

		const manzanas = await summarize(Manzana, 'Manzana');
		const cosechas = await summarize(Cosecha, 'Cosecha');
		const actividades = await summarize(Actividad, 'Actividad');
		const catalogos = await summarize(Catalogo, 'Catalogo');

		res.json({ adminId, manzanas, cosechas, actividades, catalogos });
	} catch (e) {
		res.status(500).json({ message: 'Error en owners-summary', error: e.message });
	}
});

export default router;
