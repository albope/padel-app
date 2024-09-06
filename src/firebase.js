// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Importa Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSkascGwzUtbJmJdwPOPd9-U8UvCjD-Bk",
  authDomain: "padel-app-96e21.firebaseapp.com",
  projectId: "padel-app-96e21",
  storageBucket: "padel-app-96e21.appspot.com",
  messagingSenderId: "40156635790",
  appId: "1:40156635790:web:e3e176eb12f504244e1fdf",
  measurementId: "G-K8ZBGBM1WT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Inicializa Firestore

export { db }; // Exporta la instancia de Firestore