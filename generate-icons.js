// Script para generar iconos PWA en múltiples tamaños
// Se puede ejecutar con Node.js si se instala sharp: npm install sharp

const fs = require('fs');
const path = require('path');

// Nota: Este script requiere 'sharp' para funcionar
// Instalación: npm install --save-dev sharp
// Uso: node generate-icons.js

try {
  const sharp = require('sharp');

  const sourceIcon = path.join(__dirname, 'public', 'icon-512x512.png');
  const sizes = [48, 96, 128, 256];

  console.log('Generando iconos PWA...');

  Promise.all(
    sizes.map(size => {
      const outputPath = path.join(__dirname, 'public', `icon-${size}x${size}.png`);
      return sharp(sourceIcon)
        .resize(size, size)
        .toFile(outputPath)
        .then(() => console.log(`✓ Generado icon-${size}x${size}.png`));
    })
  ).then(() => {
    // Generar iconos maskables (con padding para Android)
    return Promise.all([
      sharp(sourceIcon)
        .resize(192, 192)
        .extend({
          top: 19,
          bottom: 19,
          left: 19,
          right: 19,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(path.join(__dirname, 'public', 'icon-maskable-192x192.png'))
        .then(() => console.log('✓ Generado icon-maskable-192x192.png')),

      sharp(sourceIcon)
        .extend({
          top: 51,
          bottom: 51,
          left: 51,
          right: 51,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(path.join(__dirname, 'public', 'icon-maskable-512x512.png'))
        .then(() => console.log('✓ Generado icon-maskable-512x512.png'))
    ]);
  }).then(() => {
    console.log('\n✅ Todos los iconos PWA han sido generados exitosamente');
  }).catch(err => {
    console.error('Error al generar iconos:', err);
  });

} catch (error) {
  console.log('\n⚠️  El paquete "sharp" no está instalado.');
  console.log('\nPara generar los iconos automáticamente, ejecuta:');
  console.log('  npm install --save-dev sharp');
  console.log('  node generate-icons.js');
  console.log('\nAlternativamente, puedes generar los iconos manualmente usando:');
  console.log('  - Una herramienta online como https://realfavicongenerator.net/');
  console.log('  - Un editor de imágenes como Photoshop, GIMP, etc.');
  console.log('\nTamaños necesarios: 48x48, 96x96, 128x128, 256x256');
  console.log('Tamaños maskables: 192x192, 512x512 (con padding del 10%)');
}
