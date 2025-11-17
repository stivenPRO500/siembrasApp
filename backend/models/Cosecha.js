import mongoose from 'mongoose';

const CosechaSchema = new mongoose.Schema({
  manzana: { type: mongoose.Schema.Types.ObjectId, ref: 'Manzana', required: true },
  actividades: [{
    tipo: String,
    fechaRealizacion: Date,
    costoTotal: Number,
    productosUtilizados: [
      {
        producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalogo' },
        cantidad: Number,
        costo: Number
      }
    ],
    costoTrabajo: Number
  }],
  totalCosto: { type: Number, default: 0 },
  fechaCosecha: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Cosecha', CosechaSchema);