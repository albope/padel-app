# Padel App

**Padel App** es una aplicación web progresiva (PWA) diseñada para gestionar y visualizar partidas de pádel. Los jugadores pueden ver el historial de partidos, rankings y estadísticas. La aplicación está optimizada para dispositivos móviles y se puede instalar como una app nativa en el dispositivo del usuario.

## Características

- **Historial de Partidos**: Visualización de partidas anteriores, filtradas por mes y ordenadas por fecha.
- **Ranking de Jugadores**: Muestra el ranking de los jugadores en base a los partidos ganados y su eficiencia.
- **Partidas por Parejas**: Gestiona y muestra estadísticas de las partidas jugadas en parejas.
- **PWA**: La app está diseñada como una aplicación web progresiva (PWA), lo que permite que los usuarios la instalen en sus dispositivos móviles.
- **Firebase Integration**: Utiliza Firebase para gestionar la base de datos de resultados y el despliegue del proyecto.

## Tecnologías utilizadas

- **React**: Framework de JavaScript para construir la interfaz de usuario.
- **Material UI**: Biblioteca de componentes de React para un diseño moderno y responsivo.
- **Firebase**: 
  - **Firestore**: Para almacenar y gestionar los resultados de los partidos.
  - **Firebase Hosting**: Despliegue y alojamiento de la aplicación.
  - **Firebase Authentication**: Para manejar la autenticación de usuarios (opcional).
- **Day.js**: Biblioteca para el manejo de fechas.

## Instalación y Ejecución

Sigue estos pasos para instalar y ejecutar el proyecto en tu entorno local.

### Clonar el repositorio

```bash
git clone https://github.com/albope/padel-app.git
cd padel-app
```

## Instalar dependencias
Asegúrate de tener Node.js instalado en tu sistema, y luego ejecuta:

```bash
npm install
```
## Ejecutar en modo desarrollo

Para iniciar la aplicación en modo desarrollo, ejecuta:

```bash
npm start
```
La app estará disponible en http://localhost:3000.

## Despliegue

La aplicación está desplegada utilizando Firebase Hosting. Sigue estos pasos para desplegar tu propia versión de la aplicación.



## Construir la aplicación para producción

Ejecuta el siguiente comando para generar una versión optimizada en la carpeta build:

```bash
npm run build
```
## Desplegar en Firebase

Asegúrate de tener Firebase CLI instalado y configurado con tu proyecto. Luego, puedes desplegar la aplicación con:

```bash
firebase deploy
```

## Scripts Disponibles

En el proyecto, puedes ejecutar los siguientes comandos:

npm start: Inicia el servidor de desarrollo.
npm run build: Construye la aplicación para producción en la carpeta build.
npm run test: Ejecuta las pruebas unitarias.
firebase deploy: Despliega la aplicación en Firebase Hosting.

## Contribuir

Las contribuciones son bienvenidas. Si encuentras algún problema o tienes sugerencias para mejorar el proyecto, abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la licencia MIT. Puedes ver más detalles en el archivo LICENSE.
