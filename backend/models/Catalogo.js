import mongoose from 'mongoose';

const catalogoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ['veneno', 'abono', 'material'], required: true },
    precio: { type: Number, required: true },
    presentacion: {
      type: String,
      enum: ['litro', 'bolsa', 'galon', 'caneca'],
      required: function () {
        return this.tipo === 'veneno';
      },
    },
    // Para venenos: número de copas contenidas en UNA unidad de la presentación seleccionada
    // Ej: litro -> 40, galon -> 151.4 (3.785*40), caneca -> 800 (20L*40), bolsa -> definir según producto
    copasPorUnidad: {
      type: Number,
      required: function () {
        return this.tipo === 'veneno';
      },
      min: 0,
    },
    imagen: { type: String }, // URL de la imagen del producto
  },
  { timestamps: true }
);

const Catalogo = mongoose.model('Catalogo', catalogoSchema);
export default Catalogo;