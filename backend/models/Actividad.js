import mongoose from 'mongoose';

const ActividadSchema = new mongoose.Schema({
    tipo: { type: String, required: true }, // Ejemplo: "Fumigada", "Abonada"
    fechaRealizacion: { type: Date, required: true },
    fechaAlerta: { type: Date, required: false },
    estado: { type: String, enum: ["pendiente", "completada"], default: "pendiente" },
    manzana: { type: mongoose.Schema.Types.ObjectId, ref: 'Manzana' }
}, { timestamps: true });

export default mongoose.model('Actividad', ActividadSchema);
