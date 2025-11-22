import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import manzanaRoutes from './routes/manzanaRoutes.js';
import actividadRoutes from './routes/actividadRoutes.js';
import catalogoRoutes from './routes/catalogoRoutes.js';
import cosechaRoutes from './routes/cosechaRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();
const app = express();

// Middleware para procesar JSON
app.use(express.json());

// Configuración de CORS dinámica
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  'https://siembrasapp.onrender.com', // Origen de producción
];

if (!isProduction) {
  allowedOrigins.push('http://localhost:5173'); // Origen de desarrollo
}

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como Postman o apps móviles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'La política de CORS para este sitio no permite acceso desde el origen especificado.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Definir las rutas
app.use('/auth', authRoutes); // 🔹 Aquí estamos registrando las rutas de autenticación
app.use('/manzanas', manzanaRoutes);
app.use('/actividades', actividadRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/cosechas', cosechaRoutes);
// Servir archivos subidos (asegurar carpeta uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Carpeta uploads creada');
    } catch (e) {
        console.warn('No se pudo crear la carpeta uploads:', e.message);
    }
}
app.use('/uploads', express.static(uploadsDir));


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
