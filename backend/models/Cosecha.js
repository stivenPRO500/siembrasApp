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
  , owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  , producciones: [{
    nombre: { type: String, trim: true },
    cantidad: { type: Number, default: 0 },
    precio: { type: Number, default: 0 }
  }]
  , gastosExtra: [{
    nombre: { type: String, trim: true },
    monto: { type: Number, default: 0 }
  }]
  , pagado: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Cosecha', CosechaSchema);