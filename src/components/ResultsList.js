import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Typography, Container, Grid, Card, CardContent, Box, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material'; // Importa el ícono
import { useNavigate } from 'react-router-dom';

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const fetchResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "results"));
      const resultsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(resultsData);
    } catch (error) {
      console.error("Error al obtener los resultados:", error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const isWinner = (pair, sets) => {
    let pair1Wins = 0;
    let pair2Wins = 0;
    sets.forEach((set) => {
      if (set.pair1Score > set.pair2Score) {
        pair1Wins++;
      } else if (set.pair2Score > set.pair1Score) {
        pair2Wins++;
      }
    });
    return pair === 'pair1' ? pair1Wins > pair2Wins : pair2Wins > pair1Wins;
  };

  return (
    <Container>
      {/* Encabezado del listado de partidos */}
      <Box
        sx={{
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginTop: '20px',
        }}
      >
        <Typography variant="h5">Últimos Partidos</Typography>
      </Box>

      {/* Lista de partidos */}
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {results.length > 0 ? (
          results.map((result) => (
            <Grid item xs={12} key={result.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '10px',
                  boxShadow: 2,
                  backgroundColor: '#f9f9f9',
                  padding: '10px',
                }}
              >
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    {result.date || 'N/A'} - {result.location || 'N/A'}
                  </Typography>

                  <Grid container>
                    <Grid item xs={8}>
                      <Typography
                        variant="body1"
                        sx={{
                          color: isWinner('pair1', result.sets) ? 'green' : 'black',
                          fontWeight: isWinner('pair1', result.sets) ? 'bold' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <strong>Pareja 1:</strong> {result.pair1?.player1 || 'N/A'} y {result.pair1?.player2 || 'N/A'}{' '}
                        {isWinner('pair1', result.sets) && <CheckCircle sx={{ color: 'green', ml: 1 }} />}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: isWinner('pair2', result.sets) ? 'green' : 'black',
                          fontWeight: isWinner('pair2', result.sets) ? 'bold' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <strong>Pareja 2:</strong> {result.pair2?.player1 || 'N/A'} y {result.pair2?.player2 || 'N/A'}{' '}
                        {isWinner('pair2', result.sets) && <CheckCircle sx={{ color: 'green', ml: 1 }} />}
                      </Typography>
                    </Grid>

                    <Grid item xs={4}>
                      {result.sets && result.sets.length > 0 ? (
                        result.sets.map((set, index) => (
                          <Typography
                            key={index}
                            variant="h6"
                            align="center"
                            sx={{ borderBottom: index !== result.sets.length - 1 ? '1px solid #ddd' : 'none' }}
                          >
                            {set.pair1Score || 0} - {set.pair2Score || 0}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2">Sin sets disponibles</Typography>
                      )}
                    </Grid>
                  </Grid>
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

      {/* Botón para añadir resultado */}
      <Box sx={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '30px',
            padding: '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#333',
            },
          }}
          onClick={() => navigate('/add-result')}
        >
          + Añadir Resultado
        </Button>
      </Box>
    </Container>
  );
};

export default ResultsList;