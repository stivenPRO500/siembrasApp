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

dotenv.config();
const app = express();

// Middleware para procesar JSON
app.use(express.json());
app.use(cors({
    origin: 'https://siembrasapp.onrender.com', // Permitir solo el frontend
    credentials: true
}));

// Definir las rutas
app.use('/auth', authRoutes); // 🔹 Aquí estamos registrando las rutas de autenticación
app.use('/manzanas', manzanaRoutes);
app.use('/actividades', actividadRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/cosechas', cosechaRoutes);
// Servir archivos subidos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

app.listen(4000, () => console.log('Servidor corriendo en puerto 4000'));
