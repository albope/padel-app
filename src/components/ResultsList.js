import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Importa la instancia de Firestore
import { collection, getDocs } from 'firebase/firestore'; // Importa funciones necesarias
import { Button, Typography, Container, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const [hasFetched, setHasFetched] = useState(false); // Para evitar múltiples fetch

  // Función para obtener los datos desde Firestore
  const fetchResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "results"));
      const resultsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Solo actualizar el estado si los datos han cambiado
      if (JSON.stringify(resultsData) !== JSON.stringify(results)) {
        setResults(resultsData);
      }
    } catch (error) {
      console.error("Error al obtener los resultados:", error);
    }
  };

  // useEffect para cargar los resultados al montar el componente
  useEffect(() => {
    if (!hasFetched) {  // Verifica si ya se ha hecho fetch
      fetchResults();
      setHasFetched(true); // Evita múltiples fetch
    }
  }, [hasFetched, results]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Últimos partidos</Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/add-result')}>
        AÑADIR RESULTADO
      </Button>

      <Grid container spacing={2} style={{ marginTop: '20px' }}>
        {results.length > 0 ? (
          results.map((result) => (
            <Grid item xs={12} sm={6} md={4} key={result.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Fecha: {result.date || 'N/A'}</Typography>
                  <Typography variant="subtitle1">Lugar: {result.location || 'N/A'}</Typography>
                  
                  <Typography variant="body1">
                    Pareja 1: {result.pair1?.player1 || 'N/A'} y {result.pair1?.player2 || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    Pareja 2: {result.pair2?.player1 || 'N/A'} y {result.pair2?.player2 || 'N/A'}
                  </Typography>

                  {result.sets && result.sets.length > 0 ? (
                    result.sets.map((set, index) => (
                      <Typography key={index} variant="body2">
                        Set {index + 1}: {set.pair1Score || 0} - {set.pair2Score || 0}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2">Sin sets disponibles</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="body1" style={{ marginTop: '20px' }}>
            No hay resultados disponibles
          </Typography>
        )}
      </Grid>
    </Container>
  );
};

export default ResultsList;