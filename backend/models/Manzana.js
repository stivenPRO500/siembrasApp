import mongoose from 'mongoose';

const ManzanaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    actividades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actividad' }],
    estado: { type: String, default: "verde" } // Estado inicial en verde
}, { timestamps: true });

export default mongoose.model('Manzana', ManzanaSchema);
