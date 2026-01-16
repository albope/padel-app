/* eslint-disable no-restricted-globals */
// Service Worker personalizado con Workbox para Padel Mas Camarena

// Importar Workbox desde CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

// Precargar los archivos del build
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache para navegación (App Shell)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      }),
    ],
  })
);

// Cache para assets estáticos (imágenes)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// Cache para CSS y JavaScript
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// Cache para fuentes
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
      }),
    ],
  })
);

// Network First para APIs de Firebase/Firestore
// Intenta red primero, luego cache si falla
registerRoute(
  ({ url }) =>
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase.googleapis.com'),
  new NetworkFirst({
    cacheName: 'firebase-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 10 * 60, // 10 minutos
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Cache para Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
      }),
    ],
  })
);

// Listener para mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log de instalación
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando nueva versión...');
  self.skipWaiting();
});

// Log de activación
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado y listo');
  event.waitUntil(self.clients.claim());
});
