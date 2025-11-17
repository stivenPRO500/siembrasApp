import '@testing-library/jest-dom';

// Polyfill para TextEncoder/TextDecoder en Node.js
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configurar entorno de test para llamadas reales
process.env.NODE_ENV = 'test';
// Usar tu backend de Render para tests reales
process.env.VITE_BACKEND = 'https://siembrasappback.onrender.com';

// Mock window para entorno de test
global.window = global.window || {};
window.__VITE_BACKEND__ = 'https://siembrasappback.onrender.com';

// Mock window.alert para evitar errores de jsdom
window.alert = jest.fn();

// Para tests reales, importar fetch polyfill
import 'whatwg-fetch';