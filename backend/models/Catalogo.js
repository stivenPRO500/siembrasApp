import mongoose from 'mongoose';

const catalogoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    tipo: { type: String, enum: ['veneno', 'abono', 'material', 'semillas'], required: true },
    precio: { type: Number, required: true },
    presentacion: {
      type: String,
      enum: ['litro', 'bolsa', 'galon', 'caneca', 'cubeta'],
      required: function () {
        return this.tipo === 'veneno' || this.tipo === 'semillas';
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
    // Para semillas: libras que trae la bolsa o cubeta
    librasPorBolsa: {
      type: Number,
      required: function () {
        return this.tipo === 'semillas';
      },
      min: 0,
    },
    // Nota opcional del producto (descripción interna)
    nota: { type: String },
    imagen: { type: String }, // URL de la imagen del producto
  },
  { timestamps: true }
);

const Catalogo = mongoose.model('Catalogo', catalogoSchema);
export default Catalogo;