import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Importa el service worker registration
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Elimina React.StrictMode temporalmente si lo habías añadido
  <App />
);

// Activa el service worker para convertir la app en una PWA
serviceWorkerRegistration.register();

// Si quieres empezar a medir el rendimiento en tu aplicación, pasa una función
// para registrar resultados (por ejemplo: reportWebVitals(console.log))
// o envíalos a un endpoint de analítica. Aprende más: https://bit.ly/CRA-vitals
reportWebVitals();