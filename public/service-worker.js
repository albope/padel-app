// public/service-worker.js
self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
  });
  
  self.addEventListener('fetch', (event) => {
    console.log('Fetching:', event.request.url);
  });  