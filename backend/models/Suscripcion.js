import mongoose from 'mongoose';

const SuscripcionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['1m', '3m', '1y'], required: true },
  monto: { type: Number, required: true },
  comprobanteUrl: { type: String },
  estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  fechaInicio: { type: Date },
  fechaFin: { type: Date }
}, { timestamps: true });

export default mongoose.model('Suscripcion', SuscripcionSchema);
