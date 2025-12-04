const CACHE = 'siembras-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // No cachear peticiones que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Estrategia: Network First para la API, Cache First para lo demás.
  // Si la petición es a la API (ej. contiene /manzanas, /api/, /auth, etc.), ir a la red primero.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/manzanas') || url.pathname.startsWith('/cosechas') || url.pathname.startsWith('/actividades') || url.pathname.startsWith('/status')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Opcional: se podría cachear la respuesta de la API aquí si se quisiera,
          // pero para asegurar datos frescos, es mejor no hacerlo.
          return response;
        })
        .catch(() => {
          // Si la red falla, intentar buscar en caché como último recurso
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || Response.error();
          });
        })
    );
  } else {
    // Para todos los demás assets (CSS, JS, imágenes, fuentes), usar Cache First.
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cachear el nuevo asset para futuras visitas
          const copy = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        });
      })
    );
  }
});
