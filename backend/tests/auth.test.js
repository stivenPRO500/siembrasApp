import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// JWT Secret para tests
process.env.JWT_SECRET = 'test_jwt_secret';

describe('Auth Routes', () => {
  let adminToken;

  beforeAll(async () => {
    // Conectar a una BD de test
    const testDB = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/siembras_test';
    await mongoose.connect(testDB);
  });

  afterAll(async () => {
    // Limpiar y cerrar conexión después de las pruebas
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpiar colecciones antes de cada prueba
    await User.deleteMany({});

    // Crear usuario admin para las pruebas que requieren autenticación
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Generar token de admin
    adminToken = jwt.sign({ id: adminUser._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });

  test('POST /auth/register - debe registrar un usuario exitosamente', async () => {
    const nuevoUsuario = {
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'usuario'
    };

    const response = await request(app)
      .post('/auth/register')
      .send(nuevoUsuario);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Usuario registrado con éxito');
  });

  test('POST /auth/register - debe rechazar usuario con username duplicado', async () => {
    const usuario = {
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'usuario'
    };

    // Crear primer usuario
    await request(app).post('/auth/register').send(usuario);

    // Intentar crear usuario con mismo username
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser', // mismo username
        email: 'test2@test.com',
        password: 'password456',
        role: 'usuario'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('El usuario ya existe');
  });

  test('POST /auth/crear - debe crear un usuario como admin', async () => {
    const nuevoUsuario = {
      username: 'testuser2',
      email: 'test2@test.com',
      password: 'password123',
      role: 'usuario'
    };

    const response = await request(app)
      .post('/auth/crear')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(nuevoUsuario);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Usuario creado por el administrador con éxito');
  });

  test('POST /auth/crear - debe rechazar creación sin token de admin', async () => {
    const nuevoUsuario = {
      username: 'testuser3',
      email: 'test3@test.com',
      password: 'password123',
      role: 'usuario'
    };

    const response = await request(app)
      .post('/auth/crear')
      .send(nuevoUsuario);

    expect(response.status).toBe(401);
  });

  test('GET /auth/usuarios - debe obtener lista de usuarios como admin', async () => {
    const response = await request(app)
      .get('/auth/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});