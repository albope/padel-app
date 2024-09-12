// Este archivo se encarga de registrar el Service Worker

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] es la dirección IPv6 localhost.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 son considerados localhost para IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // Esto es para localhost: comprueba si hay un service worker que sirva los archivos.
        checkValidServiceWorker(swUrl, config);

        // Agrega más detalles en localhost para usar el service worker
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Esta aplicación web está usando un Service Worker local.'
          );
        });
      } else {
        // No es localhost. Registra el service worker en producción.
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nueva actualización está lista
              console.log(
                'Nueva actualización disponible. Por favor, recarga la página.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Contenido está cacheado para uso offline.
              console.log('Contenido cacheado para uso offline.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error durante la instalación del Service Worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Comprueba si el service worker puede servir los archivos en producción
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Asegúrate de que el service worker existe, y que realmente estamos sirviendo archivos.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Si no existe, recarga la página.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Si el service worker es válido, regístralo.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'Sin conexión a Internet. La aplicación se está ejecutando en modo offline.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Error al desinstalar el Service Worker:', error);
      });
  }
}
