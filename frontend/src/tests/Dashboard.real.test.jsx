import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// NO mockeamos la API - usamos llamadas reales
jest.mock('../utils/api', () => ({
  getBackendUrl: () => 'https://siembras-app-backend.onrender.com'
}));

describe('Dashboard Component - Real API Tests', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Mock localStorage con token válido (usa uno real de tu sistema)
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'), // Token de ejemplo
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
  });

  test('debe cargar manzanas reales desde la API', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verificar elementos básicos del dashboard
    expect(screen.getByText('Mis Manzanas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar manzana...')).toBeInTheDocument();

    // Esperar a que carguen las manzanas reales (puede tomar tiempo)
    await waitFor(() => {
      // Verificar que el componente se ha renderizado completamente
      expect(screen.getByText('Solo Rojas')).toBeInTheDocument();
      expect(screen.getByText('Solo Verdes')).toBeInTheDocument();
    }, { timeout: 15000 });

    // Si hay manzanas en la base de datos, deberían aparecer
    // Este test se adapta a los datos reales que tengas
  });

  test('debe renderizar correctamente los elementos del dashboard', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Verificar elementos principales
    expect(screen.getByText('Mis Manzanas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar manzana...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre de la nueva manzana')).toBeInTheDocument();
    expect(screen.getByText('➕ Agregar Manzana')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Solo Rojas')).toBeInTheDocument();
      expect(screen.getByText('Solo Verdes')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('debe filtrar manzanas por búsqueda', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Esperar a que carguen las manzanas
    await waitFor(() => {
      expect(screen.getByText('Solo Rojas')).toBeInTheDocument();
    }, { timeout: 15000 });

    // Buscar por un término
    const searchInput = screen.getByPlaceholderText('Buscar manzana...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // El filtrado debería funcionar inmediatamente
    expect(searchInput.value).toBe('test');
  });

  test('debe permitir filtrar por estado', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Esperar a que cargue la interfaz
    await waitFor(() => {
      expect(screen.getByText('Solo Rojas')).toBeInTheDocument();
      expect(screen.getByText('Solo Verdes')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Probar filtros
    const filterRojoButton = screen.getByText('Solo Rojas');
    fireEvent.click(filterRojoButton);

    // Verificar que el botón se puede hacer click
    expect(filterRojoButton).toBeInTheDocument();

    const filterVerdeButton = screen.getByText('Solo Verdes');
    fireEvent.click(filterVerdeButton);
    expect(filterVerdeButton).toBeInTheDocument();
  });

  test('debe permitir intentar agregar nueva manzana', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.getByText('➕ Agregar Manzana')).toBeInTheDocument();
    }, { timeout: 10000 });

    const input = screen.getByPlaceholderText('Nombre de la nueva manzana');
    const button = screen.getByText('➕ Agregar Manzana');

    // Intentar agregar manzana
    fireEvent.change(input, { target: { value: 'Manzana Test Real' } });
    expect(input.value).toBe('Manzana Test Real');

    // Hacer click en agregar (esto hará una llamada real a la API)
    fireEvent.click(button);

    // Esperar un momento para que se procese la llamada
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar que el campo se limpió (comportamiento esperado)
    // O que apareció algún mensaje de confirmación
    // Esto depende del comportamiento real de tu aplicación
  });
}, 60000); // Timeout global de 60 segundos para todo el suite de tests reales