// Script para asignar owner al admin en documentos existentes sin owner
// Uso: node backend/scripts/backfillOwners.js (con MONGO_URI y JWT_SECRET en .env)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manzana from '../models/Manzana.js';
import Catalogo from '../models/Catalogo.js';
import Actividad from '../models/Actividad.js';
import Cosecha from '../models/Cosecha.js';
import User from '../models/user.js';

dotenv.config();

(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('Falta MONGO_URI en variables de entorno');
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No se encontró usuario admin');
      process.exit(1);
    }
    console.log('Admin:', admin.username, admin._id.toString());

    const backfill = async (Model, nombre) => {
      const docs = await Model.find({ $or: [ { owner: { $exists: false } }, { owner: null } ] });
      if (!docs.length) {
        console.log(`Sin registros sin owner en ${nombre}`);
        return;
      }
      let asignados = 0;
      for (const d of docs) {
        d.owner = admin._id;
        // Reparar datos mínimos faltantes para pasar validación en Catalogo
        if (nombre === 'Catalogo') {
          if ((d.tipo === 'veneno' || d.tipo === 'semillas') && !d.presentacion) {
            d.presentacion = d.tipo === 'veneno' ? 'litro' : 'bolsa';
          }
          if (d.tipo === 'veneno' && (d.copasPorUnidad == null || d.copasPorUnidad === '')) {
            d.copasPorUnidad = 40; // default razonable
          }
          if (d.tipo === 'semillas' && (d.librasPorBolsa == null || d.librasPorBolsa === '')) {
            d.librasPorBolsa = 1; // evitar división por cero
          }
        }
        try {
          await d.save();
          asignados++;
        } catch (err) {
          console.warn(`No se pudo asignar en ${nombre} id=${d._id}: ${err.message}`);
        }
      }
      console.log(`Asignados ${asignados}/${docs.length} registros a admin en ${nombre}`);
    };

    await backfill(Manzana, 'Manzana');
    await backfill(Catalogo, 'Catalogo');
    await backfill(Actividad, 'Actividad');
    await backfill(Cosecha, 'Cosecha');

    console.log('Backfill completado');
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error en backfill:', e.message);
    process.exit(1);
  }
})();
