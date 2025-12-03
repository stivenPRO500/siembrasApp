import mongoose from 'mongoose';

// Modelo de solicitud de acceso para aprobación por administrador
// Un usuario solicita ser habilitado (aprobado) para usar plenamente la plataforma.
// Puede incluir un motivo opcional.
const AccessRequestSchema = new mongoose.Schema({
	usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	motivo: { type: String },
	estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
	fechaDecision: { type: Date }
}, { timestamps: true });

export default mongoose.model('AccessRequest', AccessRequestSchema);
