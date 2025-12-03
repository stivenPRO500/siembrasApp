import mongoose from 'mongoose';

const ManzanaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    actividades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actividad' }],
    estado: { type: String, default: "verde" }, // Estado inicial en verde
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Agricultor propietario
}, { timestamps: true });

// Permitir nombres duplicados incluso por mismo propietario (no index único)

export default mongoose.model('Manzana', ManzanaSchema);
