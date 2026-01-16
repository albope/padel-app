// src/context/DataContext.js
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

// Crear el contexto
const DataContext = createContext(null);

// Provider del DataContext
export const DataProvider = ({ children }) => {
  // Estados principales de datos
  const [results, setResults] = useState([]);
  const [noMatchDays, setNoMatchDays] = useState([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Procesar resultados de Firebase a formato consistente
  const processResults = useCallback((docs) => {
    return docs.map(doc => {
      const data = doc.data();
      let dateObj;
      if (data.date && typeof data.date.toDate === 'function') {
        dateObj = data.date.toDate();
      } else if (data.date) {
        dateObj = dayjs(data.date).toDate();
      } else {
        dateObj = new Date();
      }

      let createdAtObj = null;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtObj = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAtObj = dayjs(data.createdAt).toDate();
      }

      return {
        id: doc.id,
        ...data,
        date: dateObj,
        createdAt: createdAtObj,
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []);

  // Procesar dias sin partido
  const processNoMatchDays = useCallback((docs) => {
    return docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }, []);

  // Fetch inicial de todos los datos
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [resultsSnap, noMatchDaysSnap] = await Promise.all([
        getDocs(collection(db, 'results')),
        getDocs(collection(db, 'noMatchDays')),
      ]);

      setResults(processResults(resultsSnap.docs));
      setNoMatchDays(processNoMatchDays(noMatchDaysSnap.docs));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos. Intentalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [processResults, processNoMatchDays]);

  // Refresh manual de datos
  const refreshData = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  // Refresh solo de resultados (para cuando se añade/edita/elimina un partido)
  const refreshResults = useCallback(async () => {
    try {
      const resultsSnap = await getDocs(collection(db, 'results'));
      setResults(processResults(resultsSnap.docs));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing results:', err);
    }
  }, [processResults]);

  // Refresh solo de dias sin partido
  const refreshNoMatchDays = useCallback(async () => {
    try {
      const noMatchDaysSnap = await getDocs(collection(db, 'noMatchDays'));
      setNoMatchDays(processNoMatchDays(noMatchDaysSnap.docs));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing noMatchDays:', err);
    }
  }, [processNoMatchDays]);

  // Datos derivados utiles
  const derivedData = useMemo(() => {
    // Partidos por año
    const gamesByYear = {};
    results.forEach(result => {
      const year = dayjs(result.date).year();
      gamesByYear[year] = (gamesByYear[year] || 0) + 1;
    });

    // Ubicaciones unicas
    const locations = [...new Set(results.map(r => r.location).filter(Boolean))];

    // Total de partidos
    const totalGames = results.length;

    return {
      gamesByYear,
      locations,
      totalGames,
    };
  }, [results]);

  // Fetch inicial al montar
  // Note: fetchAllData is stable because processResults and processNoMatchDays
  // have empty dependency arrays, so this effect only runs once on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const contextValue = {
    // Datos
    results,
    noMatchDays,
    // Datos derivados
    ...derivedData,
    // Estados UI
    loading,
    error,
    lastUpdated,
    // Funciones de refresh
    refreshData,
    refreshResults,
    refreshNoMatchDays,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};

export default DataContext;
