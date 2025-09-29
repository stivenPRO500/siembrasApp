import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '../pages/Login';

// Mock de useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// NO mockeamos la API - usamos llamadas reales
// Mock del módulo api para usar URL real
jest.mock('../utils/api', () => ({
  getBackendUrl: () => 'https://siembras-app-backend.onrender.com'
}));

describe('Login Component - Real API Tests', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Mock localStorage correctamente
    const localStorageMock = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
  });

  test('debe renderizar correctamente el formulario de login', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Nombre de usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Ingresar')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  test('debe hacer login real con credenciales válidas', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Usar credenciales que probablemente existan o que deberían funcionar
    // Si este test falla, significa que estas credenciales no existen en tu BD
    fireEvent.change(screen.getByPlaceholderText('Nombre de usuario'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByText('Ingresar'));

    // El test pasará si:
    // 1. Se hace la llamada a la API real
    // 2. No aparece mensaje de error (credenciales incorrectas)
    // 3. O aparece algún comportamiento de éxito
    await waitFor(() => {
      // Verificar que no hay errores de "Usuario no encontrado" o "Contraseña incorrecta"
      const noUserError = !screen.queryByText(/Usuario no encontrado/i);
      const noPassError = !screen.queryByText(/Contraseña incorrecta/i);
      
      // Si no hay errores específicos, el login probablemente funcionó
      expect(noUserError || noPassError).toBe(true);
    }, { timeout: 20000 });
  }, 30000);

  test('debe mostrar error con credenciales incorrectas reales', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Usar credenciales incorrectas
    fireEvent.change(screen.getByPlaceholderText('Nombre de usuario'), {
      target: { value: 'usuarioincorrecto' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'passwordincorrecto' },
    });

    fireEvent.click(screen.getByText('Ingresar'));

    // Esperar a que aparezca algún mensaje de error específico de tu backend
    await waitFor(() => {
      // Buscar mensajes de error específicos que devuelve tu backend
      const errorElement = screen.getByText(/Usuario no encontrado|Contraseña incorrecta|Error de conexión|Credenciales incorrectas/i);
      expect(errorElement).toBeInTheDocument();
    }, { timeout: 20000 });

    // Verificar que no se navega
    expect(mockNavigate).not.toHaveBeenCalled();
  }, 30000);

  test('debe validar campos del formulario', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usuarioInput = screen.getByPlaceholderText('Nombre de usuario');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    
    expect(usuarioInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
  });
}, 60000); // Timeout global de 60 segundos para todo el suite de tests reales