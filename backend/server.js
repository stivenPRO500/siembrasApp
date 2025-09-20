import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import manzanaRoutes from './routes/manzanaRoutes.js';
import actividadRoutes from './routes/actividadRoutes.js';

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



mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

app.listen(4000, () => console.log('Servidor corriendo en puerto 4000'));
