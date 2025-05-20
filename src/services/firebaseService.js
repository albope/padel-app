// src/services/firebaseService.js
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate que la ruta a tu archivo firebase.js sea correcta

const CYCLES_COLLECTION = 'cycles';
const NO_MATCH_DAYS_COLLECTION = 'noMatchDays';
const RESULTS_COLLECTION = 'results';

// Funciones para Ciclos (Cycles)
export const getCycles = async () => {
  const cyclesSnap = await getDocs(collection(db, CYCLES_COLLECTION));
  const cyclesList = cyclesSnap.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  }));
  return cyclesList;
};

export const addCycle = async (cycleData) => {
  return await addDoc(collection(db, CYCLES_COLLECTION), cycleData);
};

export const updateCycle = async (cycleId, cycleData) => {
  const cycleRef = doc(db, CYCLES_COLLECTION, cycleId);
  return await updateDoc(cycleRef, cycleData);
};

export const deleteCycle = async (cycleId) => {
  const cycleRef = doc(db, CYCLES_COLLECTION, cycleId);
  return await deleteDoc(cycleRef);
};

// Funciones para Días Sin Partido (NoMatchDays)
export const getNoMatchDays = async () => {
  const noMatchDaysSnap = await getDocs(collection(db, NO_MATCH_DAYS_COLLECTION));
  const noMatchDaysList = noMatchDaysSnap.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  }));
  return noMatchDaysList;
};

export const addNoMatchDay = async (noMatchDayData) => {
  return await addDoc(collection(db, NO_MATCH_DAYS_COLLECTION), noMatchDayData);
};

export const deleteNoMatchDay = async (noMatchDayId) => {
  const noMatchDayRef = doc(db, NO_MATCH_DAYS_COLLECTION, noMatchDayId);
  return await deleteDoc(noMatchDayRef);
};

// Funciones para Resultados (Results)
export const getResults = async () => {
  const resultsSnap = await getDocs(collection(db, RESULTS_COLLECTION));
  const resultsList = resultsSnap.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  }));
  return resultsList;
};

// Si necesitas añadir o actualizar resultados individualmente, puedes añadir funciones aquí.
// Por ejemplo, addResult, updateResult.
// Por ahora, la anulación de ciclo borra resultados, así que necesitamos deleteResult.
export const deleteResult = async (resultId) => {
  const resultRef = doc(db, RESULTS_COLLECTION, resultId);
  return await deleteDoc(resultRef);
};

// Podrías añadir una función para obtener todos los datos de una vez si prefieres
export const getAllMatchData = async () => {
  try {
    const [cycles, noMatchDays, results] = await Promise.all([
      getCycles(),
      getNoMatchDays(),
      getResults()
    ]);
    return { cycles, noMatchDays, results };
  } catch (error) {
    console.error("Error fetching all match data:", error);
    throw error; // Re-lanza el error para que el componente lo maneje
  }
};