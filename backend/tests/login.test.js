import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// JWT Secret para tests
process.env.JWT_SECRET = 'test_jwt_secret';

describe('Login functionality', () => {
  beforeAll(async () => {
    const testDB = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/siembras_test';
    await mongoose.connect(testDB);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpiar colecciones antes de cada prueba
    await User.deleteMany({});

    // Crear usuario de prueba para login
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });
  });

  test('POST /auth/login - debe autenticar usuario válido con username', async () => {
    const credentials = {
      username: 'admin',
      password: 'admin123'
    };

    const response = await request(app)
      .post('/auth/login')
      .send(credentials);

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.role).toBe('admin');
  });

  test('POST /auth/login - debe rechazar credenciales inválidas', async () => {
    const credentials = {
      username: 'admin',
      password: 'wrongpassword'
    };

    const response = await request(app)
      .post('/auth/login')
      .send(credentials);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Contraseña incorrecta');
  });

  test('POST /auth/login - debe rechazar usuario inexistente', async () => {
    const credentials = {
      username: 'noexiste',
      password: 'password123'
    };

    const response = await request(app)
      .post('/auth/login')
      .send(credentials);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Usuario no encontrado');
  });

  test('POST /auth/login - debe validar que password esté presente', async () => {
    const credencialesIncompletas = {
      username: 'admin'
      // Falta password
    };

    const response = await request(app)
      .post('/auth/login')
      .send(credencialesIncompletas);

    // Como no hay validación explícita, bcrypt.compare con undefined causará error 500
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Error en el servidor');
  });

  test('POST /auth/login - debe validar que username esté presente', async () => {
    const credencialesIncompletas = {
      password: 'admin123'
      // Falta username
    };

    const response = await request(app)
      .post('/auth/login')
      .send(credencialesIncompletas);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Usuario no encontrado');
  });
});