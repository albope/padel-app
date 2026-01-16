// src/services/firebaseService.js
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { retryFirebaseOperation } from '../utils/retry';

const NO_MATCH_DAYS_COLLECTION = 'noMatchDays';
const RESULTS_COLLECTION = 'results';

// Funciones para Días Sin Partido (NoMatchDays)
export const getNoMatchDays = async () => {
  return retryFirebaseOperation(async () => {
    const noMatchDaysSnap = await getDocs(collection(db, NO_MATCH_DAYS_COLLECTION));
    const noMatchDaysList = noMatchDaysSnap.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));
    return noMatchDaysList;
  });
};

export const addNoMatchDay = async (noMatchDayData) => {
  return retryFirebaseOperation(async () => {
    return await addDoc(collection(db, NO_MATCH_DAYS_COLLECTION), noMatchDayData);
  });
};

export const deleteNoMatchDay = async (noMatchDayId) => {
  return retryFirebaseOperation(async () => {
    const noMatchDayRef = doc(db, NO_MATCH_DAYS_COLLECTION, noMatchDayId);
    return await deleteDoc(noMatchDayRef);
  });
};

// Funciones para Resultados (Results)
export const getResults = async () => {
  return retryFirebaseOperation(async () => {
    const resultsSnap = await getDocs(collection(db, RESULTS_COLLECTION));
    const resultsList = resultsSnap.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));
    return resultsList;
  });
};

export const addResult = async (resultData) => {
  return retryFirebaseOperation(async () => {
    return await addDoc(collection(db, RESULTS_COLLECTION), resultData);
  });
};

export const updateResult = async (resultId, resultData) => {
  return retryFirebaseOperation(async () => {
    const resultRef = doc(db, RESULTS_COLLECTION, resultId);
    return await updateDoc(resultRef, resultData);
  });
};

export const deleteResult = async (resultId) => {
  return retryFirebaseOperation(async () => {
    const resultRef = doc(db, RESULTS_COLLECTION, resultId);
    return await deleteDoc(resultRef);
  });
};

// Función para obtener todos los datos de una vez
// Note: getNoMatchDays() and getResults() already have retry logic,
// so we don't wrap this in retryFirebaseOperation to avoid double retries
export const getAllMatchData = async () => {
  try {
    const [noMatchDays, results] = await Promise.all([
      getNoMatchDays(),
      getResults()
    ]);
    return { noMatchDays, results };
  } catch (error) {
    console.error("Error fetching all match data:", error);
    throw error;
  }
};
