// Reasigna owner al admin para documentos existentes
// Uso con PowerShell (Windows):
// $env:MONGO_URI="..."; $env:ADMIN_EMAIL="admin@tuapp.com"; $env:TARGET_USER_EMAILS="user1@a.com,user2@a.com"; $env:DRY_RUN="true"; node backend/scripts/reassignOwnersToAdmin.js
// O para todos: $env:ALL="true"
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

    const admin = process.env.ADMIN_EMAIL
      ? await User.findOne({ email: process.env.ADMIN_EMAIL })
      : await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No se encontró usuario admin');
      process.exit(1);
    }
    console.log('Admin destino:', admin.email || admin.username, admin._id.toString());

    const dryRun = String(process.env.DRY_RUN || 'false').toLowerCase() === 'true';
    const all = String(process.env.ALL || 'false').toLowerCase() === 'true';
    let targetOwners = [];

    if (!all) {
      const emails = (process.env.TARGET_USER_EMAILS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (!emails.length) {
        console.log('Nada que hacer. Define TARGET_USER_EMAILS o ALL=true');
        await mongoose.disconnect();
        process.exit(0);
      }
      const users = await User.find({ email: { $in: emails } });
      targetOwners = users.map(u => u._id);
      console.log(`Usuarios origen: ${users.map(u=>u.email).join(', ')}`);
      if (!targetOwners.length) {
        console.log('No se encontraron usuarios con esos emails');
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    const filter = all ? {} : { owner: { $in: targetOwners } };

    const run = async (Model, nombre) => {
      const count = await Model.countDocuments(filter);
      if (!count) {
        console.log(`[${nombre}] No hay documentos para reasignar`);
        return;
      }
      console.log(`[${nombre}] Documentos a reasignar: ${count}`);
      if (dryRun) return;
      const res = await Model.updateMany(filter, { $set: { owner: admin._id } });
      console.log(`[${nombre}] Modificados: ${res.modifiedCount}`);
    };

    await run(Manzana, 'Manzana');
    await run(Catalogo, 'Catalogo');
    await run(Actividad, 'Actividad');
    await run(Cosecha, 'Cosecha');

    console.log('Reasignación completada');
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error en reasignación:', e.message);
    process.exit(1);
  }
})();
