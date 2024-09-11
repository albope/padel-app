import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Typography, Container, Grid, Card, CardContent, Box, Button, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs'; // Para manejar fechas

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().month()); // Mes actual
  const navigate = useNavigate();

  const fetchResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "results"));
      const resultsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(resultsData);
      filterByMonth(resultsData, dayjs().month()); // Filtrar por el mes actual
    } catch (error) {
      console.error("Error al obtener los resultados:", error);
    }
  };

  const filterByMonth = (results, month) => {
    const filtered = results.filter(result => {
      const resultDate = dayjs(result.date);
      return resultDate.month() === month;
    });
    setFilteredResults(filtered);
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setCurrentMonth(newMonth);
    filterByMonth(results, newMonth);
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

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <Container>
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Últimas Partidas</Typography>
      </Box>

      {/* Filtro de meses */}
      <Box sx={{ marginTop: '20px', marginBottom: '20px' }}>
        <FormControl fullWidth>
          <InputLabel id="month-select-label" sx={{ top: '-6px' }}>Selecciona Mes</InputLabel>
          <Select
            labelId="month-select-label"
            id="month-select"
            value={currentMonth}
            onChange={handleMonthChange}
          >
            {months.map((month, index) => (
              <MenuItem key={index} value={index}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Lista de partidos */}
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <Grid item xs={12} key={result.id}>
              <Card variant="outlined" sx={{ borderRadius: '10px', boxShadow: 2, backgroundColor: '#f9f9f9', padding: '10px' }}>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    <strong>{dayjs(result.date).format('DD-MM-YYYY')}</strong> - <strong>{result.location || 'N/A'}</strong>
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
                          <Typography key={index} variant="h6" align="center" sx={{ borderBottom: index !== result.sets.length - 1 ? '1px solid #ddd' : 'none' }}>
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
          <Typography variant="body1" sx={{ marginTop: '20px', textAlign: 'center' }}> {/* Mensaje centrado */}
            No hay resultados disponibles
          </Typography>
        )}
      </Grid>

      {/* Botón para añadir resultado */}
      <Box sx={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <Button
          variant="contained"
          sx={{ backgroundColor: 'black', color: 'white', borderRadius: '30px', padding: '10px 20px', textTransform: 'none', '&:hover': { backgroundColor: '#333' } }}
          onClick={() => navigate('/add-result')}
        >
          + Añadir Resultado
        </Button>
      </Box>

      {/* Nueva sección "Información de las Partidas" */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px', borderRadius: '10px', '&:hover': { cursor: 'pointer', backgroundColor: '#333' } }} onClick={() => navigate('/info')}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Información de las Partidas
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>

      {/* Nueva sección "Ranking & Jugadores" */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px', borderRadius: '10px', '&:hover': { cursor: 'pointer', backgroundColor: '#333' } }} onClick={() => navigate('/players')}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Ranking & Jugadores
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>
    </Container>
  );
};

export default ResultsList;