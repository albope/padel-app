/* eslint-disable no-restricted-globals */
// Service Worker con Workbox para Padel Mas Camarena PWA

// Importar Workbox desde CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

if (workbox) {
  console.log('[Service Worker] Workbox cargado correctamente');

  const { registerRoute } = workbox.routing;
  const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { precacheAndRoute } = workbox.precaching;

  // Configuración de Workbox
  workbox.core.clientsClaim();
  workbox.core.skipWaiting();

  // Precache de assets críticos del App Shell
  // Estos assets se cachean durante la instalación del SW
  const criticalAssets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
  ];

  // Registrar precache para assets críticos
  precacheAndRoute(
    criticalAssets.map(url => ({
      url,
      revision: self.__WB_MANIFEST_VERSION || '1.0.0'
    }))
  );

  // Cache para navegación (App Shell) - Network First
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        }),
      ],
    })
  );

  // Cache para assets estáticos (imágenes) - Cache First
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  // Cache para CSS y JavaScript - Stale While Revalidate
  registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script',
    new StaleWhileRevalidate({
      cacheName: 'static-resources-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  // Cache para fuentes - Cache First (cambian raramente)
  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        }),
      ],
    })
  );

  // Network First para APIs de Firebase/Firestore
  // Intenta red primero, luego cache si falla (funcionalidad offline)
  registerRoute(
    ({ url }) =>
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firebase.googleapis.com'),
    new NetworkFirst({
      cacheName: 'firebase-api-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 10 * 60, // 10 minutos
        }),
      ],
      networkTimeoutSeconds: 10,
    })
  );

  // Cache para Google Fonts CSS
  registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );

  // Cache para archivos de fuentes de Google Fonts
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
    console.log('[Service Worker] Activado y listo para funcionar offline');
    event.waitUntil(self.clients.claim());
  });

} else {
  console.error('[Service Worker] Workbox no pudo cargarse');
}  