/* eslint-disable no-restricted-globals */

// Este service worker utiliza Workbox para implementar estrategias de caché
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';

clientsClaim();

// Precargar todos los assets generados por el build
precacheAndRoute(self.__WB_MANIFEST);

// App Shell - usar cache first para navegación
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Caché para assets estáticos (imágenes, fuentes, etc.)
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

// Caché para CSS y JS
registerRoute(
  ({ request }) =>
    request.destination === 'style' || request.destination === 'script',
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

// Estrategia Network First para llamadas a Firebase/Firestore
// Intenta la red primero, si falla usa caché
registerRoute(
  ({ url }) =>
    url.origin === 'https://firestore.googleapis.com' ||
    url.origin.includes('firebaseio.com') ||
    url.origin.includes('googleapis.com'),
  new NetworkFirst({
    cacheName: 'firebase-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Stale-While-Revalidate para otras peticiones de API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos
      }),
    ],
  })
);

// Mensaje de instalación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificar al cliente cuando hay una actualización disponible
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando nueva versión...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado');
  event.waitUntil(self.clients.claim());
});
