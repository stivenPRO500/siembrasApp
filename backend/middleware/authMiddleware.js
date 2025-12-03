import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import dotenv from 'dotenv';

dotenv.config();

const authMiddleware = async (req, res, next) => {
  // Extraer el token del encabezado Authorization
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'No autorizado, token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user;
    // ownerId efectivo: colaboradores (role 'usuario' con agricultor asignado) comparten data del agricultor
    if (user && user.role === 'usuario' && user.agricultor) {
      req.ownerId = user.agricultor;
    } else {
      req.ownerId = user?._id;
    }
    next();
  } catch (error) {
    return res.status(401).json({ msg: 'Token no válido' });
  }
};

export default authMiddleware;

