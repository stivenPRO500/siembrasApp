/*import mongoose from 'mongoose';

const ActividadSchema = new mongoose.Schema({
    tipo: { type: String, required: true }, // Ejemplo: "Fumigada", "Abonada"
    fechaRealizacion: { type: Date, required: true },
    fechaAlerta: { type: Date, required: false },
    estado: { type: String, enum: ["pendiente", "completada"], default: "pendiente" },
    manzana: { type: mongoose.Schema.Types.ObjectId, ref: 'Manzana' }
}, { timestamps: true });

export default mongoose.model('Actividad', ActividadSchema);

*/
import mongoose from 'mongoose';

const ActividadSchema = new mongoose.Schema({
    tipo: { type: String, required: true }, // Ejemplo: "Fumigada", "Abonada"
    fechaRealizacion: { type: Date, required: true },
    fechaAlerta: { type: Date, required: false },
    estado: { type: String, enum: ["pendiente", "completada"], default: "pendiente" },
    manzana: { type: mongoose.Schema.Types.ObjectId, ref: 'Manzana' },
    productosUtilizados: [
        {
            producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalogo', required: true },
            cantidad: { type: Number, required: true }, // Cantidad utilizada
            unidad: { type: String, enum: ['copas', 'unidades', 'libras', 'unidad'], default: 'unidades' },
            costo: { type: Number, required: true } // Costo calculado por línea
        }
    ],
    costoTrabajo: { type: Number, default: 0 }, // Costo del trabajo asociado a la actividad
    costoTotal: { type: Number, default: 0 }, // Suma de costos de productos + trabajo
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // redundante para consulta rápida
}, { timestamps: true });

export default mongoose.model('Actividad', ActividadSchema);
