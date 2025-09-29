// Helper para obtener la URL del backend
export const getBackendUrl = () => {
  // En testing, usar process.env para llamadas reales
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return process.env.VITE_BACKEND || 'https://siembras-app-backend.onrender.com';
  }
  
  // En producción/desarrollo, usar variable global definida por Vite
  if (typeof window !== 'undefined' && window.__VITE_BACKEND__) {
    return window.__VITE_BACKEND__;
  }
  
  // Fallback a tu backend de Render
  return 'https://siembras-app-backend.onrender.com';
};