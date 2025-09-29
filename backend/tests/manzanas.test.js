import request from 'supertest';
import express from 'express';
import manzanaRoutes from '../routes/manzanaRoutes.js';
import mongoose from 'mongoose';
import Manzana from '../models/Manzana.js';

const app = express();
app.use(express.json());
app.use('/manzanas', manzanaRoutes);

describe('Manzanas CRUD', () => {
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
    await Manzana.deleteMany({});
  });

  test('POST /manzanas - debe crear una manzana', async () => {
    const nuevaManzana = {
      nombre: 'Manzana Test'
    };

    const response = await request(app)
      .post('/manzanas')
      .send(nuevaManzana);

    expect(response.status).toBe(201);
    expect(response.body.nombre).toBe('Manzana Test');
    expect(response.body._id).toBeDefined();
  });

  test('GET /manzanas - debe obtener lista de manzanas con actividades pendientes', async () => {
    // Crear algunas manzanas primero
    await Manzana.create({ nombre: 'Manzana 1', actividades: [] });
    await Manzana.create({ nombre: 'Manzana 2', actividades: [] });

    const response = await request(app).get('/manzanas');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0].nombre).toBe('Manzana 1');
    expect(response.body[1].nombre).toBe('Manzana 2');
    // Verificar que incluye las actividades pendientes
    expect(response.body[0].actividadesPendientes).toBeDefined();
    expect(response.body[1].actividadesPendientes).toBeDefined();
  });

  test('PUT /manzanas/:id - debe actualizar una manzana', async () => {
    const manzana = await Manzana.create({ nombre: 'Manzana Original' });

    const datosActualizados = {
      nombre: 'Manzana Actualizada'
    };

    const response = await request(app)
      .put(`/manzanas/${manzana._id}`)
      .send(datosActualizados);

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe('Manzana Actualizada');
  });

  test('DELETE /manzanas/:id - debe eliminar una manzana', async () => {
    const manzana = await Manzana.create({ nombre: 'Manzana a Eliminar' });

    const response = await request(app).delete(`/manzanas/${manzana._id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('eliminada');

    // Verificar que realmente se eliminó
    const manzanaEliminada = await Manzana.findById(manzana._id);
    expect(manzanaEliminada).toBeNull();
  });

  test('GET /manzanas/estado - debe obtener manzanas con sus estados calculados', async () => {
    // Crear manzana
    await Manzana.create({ 
      nombre: 'Manzana con Estado',
      actividades: []
    });

    const response = await request(app).get('/manzanas/estado');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].nombre).toBe('Manzana con Estado');
    expect(response.body[0].estado).toBeDefined();
  });

  test('POST /manzanas - debe manejar error cuando falta nombre', async () => {
    const manzanaSinNombre = {};

    const response = await request(app)
      .post('/manzanas')
      .send(manzanaSinNombre);

    // El modelo Mongoose validará que el nombre es requerido y causará error 500
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Error al crear la manzana');
  });

  test('PUT /manzanas/:id - debe manejar ID inválido', async () => {
    const idInvalido = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .put(`/manzanas/${idInvalido}`)
      .send({ nombre: 'Nombre Nuevo' });

    expect(response.status).toBe(200);
    expect(response.body).toBeNull(); // findByIdAndUpdate retorna null si no encuentra el documento
  });
});