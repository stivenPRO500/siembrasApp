// Helper para obtener la URL del backend
export const getBackendUrl = () => {
  // Vite expone las variables de entorno en import.meta.env.
  // Esto usará automáticamente el valor de .env.development o .env.production.
  return import.meta.env.VITE_BACKEND_URL || 'https://siembrasappback.onrender.com';
};