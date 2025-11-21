// src/hooks/usePadelResults.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Ajusta la ruta según donde crees la carpeta
import dayjs from 'dayjs';

export const usePadelResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, "results"));
      
      const fetchedResults = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Normalización robusta de fechas (maneja Timestamps de Firebase y strings)
        let resultDateObject;
        if (data.date && typeof data.date.toDate === 'function') {
            resultDateObject = data.date.toDate();
        } else if (data.date) {
            resultDateObject = dayjs(data.date).toDate();
        } else {
            resultDateObject = new Date();
        }

        let createdAtDateObject = null;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAtDateObject = data.createdAt.toDate();
        } else if (data.createdAt) {
            createdAtDateObject = dayjs(data.createdAt).toDate();
        }

        return {
          id: doc.id,
          ...data,
          date: resultDateObject,
          createdAt: createdAtDateObject,
        };
      });

      // Ordenar: más reciente primero
      fetchedResults.sort((a, b) => b.date - a.date);
      setResults(fetchedResults);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("No se pudieron cargar los datos. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Calcular estadísticas solo cuando cambien los resultados (Optimización)
  const stats = useMemo(() => {
    const gamesByYear = {};
    const uniqueLocations = new Set();

    results.forEach(result => {
      const year = result.date.getFullYear();
      gamesByYear[year] = (gamesByYear[year] || 0) + 1;
      
      if (result.location) {
        uniqueLocations.add(result.location);
      }
    });

    return {
      gamesByYear,
      locations: [...uniqueLocations]
    };
  }, [results]);

  return { 
    results, 
    stats, 
    loading, 
    error, 
    refetch: fetchResults 
  };
};