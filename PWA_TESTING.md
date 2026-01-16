# Guía de Testing PWA - Padel Mas Camarena

## Sesión 9 Implementada: PWA Robusta con Service Worker y Offline

### ✅ Cambios Implementados

1. **Manifest.json Expandido**
   - Descripción completa de la app
   - Iconos en múltiples tamaños (48, 96, 128, 192, 256, 512)
   - Iconos maskables para Android
   - Categorías: sports, lifestyle
   - Orientación portrait
   - Theme color actualizado a #1976d2

2. **Service Worker con Workbox**
   - Estrategias de caché implementadas:
     - **Network First**: Navegación y Firebase API
     - **Cache First**: Imágenes y fuentes
     - **Stale While Revalidate**: CSS y JavaScript
   - Caché de Google Fonts
   - Timeout de 10s para requests de Firebase antes de usar caché
   - Expiración automática de cachés antiguos

3. **OfflineBanner Component**
   - Banner persistente cuando está offline
   - Toast notification al perder conexión
   - Toast notification al recuperar conexión
   - Iconos visuales de WiFi on/off

4. **Iconos PWA Generados**
   - Script automático para generar todos los tamaños
   - Iconos maskables con padding para Android

---

## 🧪 Cómo Probar la PWA

### 1. Build de Producción

El Service Worker solo funciona en producción. Para probarlo:

```bash
npm run build
npx serve -s build
```

Esto servirá la app en `http://localhost:3000`

### 2. Probar Instalación de la PWA

#### En Chrome Desktop:
1. Abre `http://localhost:3000`
2. En la barra de direcciones, verás un icono de instalación (+)
3. Click en "Instalar Padel Mas Camarena"
4. La app se abrirá en una ventana standalone

#### En Chrome Android:
1. Abre la app en Chrome
2. Menu → "Agregar a pantalla de inicio"
3. La app aparecerá como una app nativa

#### En Safari iOS:
1. Abre la app en Safari
2. Botón compartir → "Agregar a pantalla de inicio"

### 3. Probar Funcionalidad Offline

#### Método 1: DevTools (Recomendado)
1. Abre la app en Chrome
2. Abre DevTools (F12)
3. Ve a la pestaña "Network"
4. Cambia "No throttling" a "Offline"
5. Recarga la página
6. ✅ La app debe funcionar mostrando datos cacheados
7. ✅ Debe aparecer el banner amarillo "Sin conexión - Mostrando datos guardados"

#### Método 2: Modo Avión
1. Carga la app normalmente
2. Activa el modo avión en tu dispositivo
3. Navega por la app
4. ✅ Debe seguir funcionando con los datos cacheados

### 4. Verificar Service Worker

1. Abre DevTools → Application → Service Workers
2. Debes ver el service worker registrado y activo
3. Verifica que aparezca:
   - Status: activated and is running
   - Source: service-worker.js

### 5. Inspeccionar Cachés

1. DevTools → Application → Cache Storage
2. Deberías ver varios cachés:
   - `pages-cache`: Páginas de navegación
   - `images-cache`: Imágenes
   - `static-resources-cache`: CSS y JS
   - `fonts-cache`: Fuentes
   - `firebase-api-cache`: Datos de Firebase
   - `google-fonts-stylesheets`: CSS de Google Fonts
   - `google-fonts-webfonts`: Archivos de fuentes

### 6. Lighthouse Audit

1. Abre DevTools → Lighthouse
2. Selecciona "Progressive Web App"
3. Click en "Analyze page load"
4. **Objetivo**: PWA score > 90

Checklist esperado:
- ✅ Registra un service worker
- ✅ Responde con 200 cuando está offline
- ✅ Proporciona un manifest válido
- ✅ Tiene iconos en múltiples tamaños
- ✅ Usa HTTPS (en producción)
- ✅ Configurado para splash screen

---

## 🔍 Debugging

### Ver logs del Service Worker

```javascript
// En la consola de Chrome
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))
```

### Forzar actualización del Service Worker

1. DevTools → Application → Service Workers
2. Check "Update on reload"
3. Recarga la página

### Limpiar todos los cachés

```javascript
// En la consola
caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
```

### Desregistrar Service Worker

```javascript
// En la consola
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})
```

---

## 📊 Criterios de Aceptación - Sesión 9

- ✅ **App se puede instalar en Android/iOS**: Manifest completo con iconos
- ✅ **Sin internet muestra datos cacheados**: Network First strategy para Firebase
- ✅ **Banner indica estado offline**: OfflineBanner component implementado
- ✅ **Lighthouse PWA score > 90**: Todas las prácticas implementadas

---

## 🚀 Deploy en Firebase Hosting

Para desplegar con PWA funcional:

```bash
npm run build
firebase deploy --only hosting
```

La app estará disponible en tu dominio de Firebase con:
- HTTPS automático ✅
- Service Worker funcional ✅
- PWA instalable ✅

---

## 📝 Notas Técnicas

### Estrategias de Caché Implementadas

1. **Network First (Firebase API)**
   - Intenta red primero
   - Si falla o timeout (10s), usa caché
   - Expira a los 10 minutos
   - Ideal para datos que cambian frecuentemente pero necesitas offline

2. **Cache First (Imágenes, Fuentes)**
   - Busca en caché primero
   - Si no existe, descarga de red
   - Expira a los 30 días (1 año para fuentes)
   - Ideal para recursos estáticos

3. **Stale While Revalidate (CSS, JS)**
   - Responde con caché inmediatamente
   - Actualiza caché en background
   - Mejor de ambos mundos: velocidad + frescura

### Limitaciones de Caché

- Máximo 100 entradas para Firebase API
- Máximo 60 entradas para imágenes
- Máximo 60 entradas para CSS/JS
- Máximo 30 entradas para fuentes

Cuando se alcanza el máximo, se eliminan las entradas más antiguas (LRU).

---

## 🐛 Problemas Comunes

### Service Worker no se registra
- Verifica que estés en HTTPS o localhost
- Limpia cachés del navegador
- Recarga con Ctrl+Shift+R

### Cambios no se ven después de actualizar
- El Service Worker cachea agresivamente
- Espera 1 hora o fuerza actualización en DevTools
- Implementado: verificación de actualizaciones cada hora

### La app no funciona offline
- Verifica que hayas navegado primero con conexión
- Chequea que los datos estén en `firebase-api-cache`
- Asegúrate de que el Service Worker esté "activated"

---

## ✨ Próximos Pasos

Después de esta sesión, la app ya es una PWA completa. Las siguientes mejoras recomendadas:

- **Sesión 10**: Performance y bundle optimization
- **Sesión 11**: Accesibilidad (A11y)
- **Sesión 12**: Animaciones y microinteracciones

---

**¡PWA lista para usar offline! 🎉**
