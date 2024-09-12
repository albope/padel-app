import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Typography, Container, Grid, Card, CardContent, Box, Button, FormControl, Select, MenuItem, InputLabel, IconButton } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs'; // Para manejar fechas
import { useNavigate } from 'react-router-dom';

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().month()); // Mes actual
  const [currentPage, setCurrentPage] = useState(1); // Para paginación
  const itemsPerPage = 4; // Máximo de partidas por página
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
    const filtered = results
      .filter(result => {
        const resultDate = dayjs(result.date);
        return resultDate.month() === month;
      })
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date))); // Ordenar por fecha (más reciente primero)

    setFilteredResults(filtered);
    setCurrentPage(1); // Reiniciar la página al filtrar por mes
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setCurrentMonth(newMonth);
    filterByMonth(results, newMonth);
  };

  const handleDeleteResult = async (resultId) => {
    try {
      await deleteDoc(doc(db, "results", resultId));
      setResults(prevResults => prevResults.filter(result => result.id !== resultId));
      filterByMonth(results.filter(result => result.id !== resultId), currentMonth);
    } catch (error) {
      console.error("Error al eliminar el resultado:", error);
    }
  };

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

  // Paginación
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

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
        {paginatedResults.length > 0 ? (
          paginatedResults.map((result) => (
            <Grid item xs={12} key={result.id}>
              <Card variant="outlined" sx={{ borderRadius: '10px', boxShadow: 2, backgroundColor: '#f9f9f9', padding: '10px', position: 'relative' }}>
                
                {/* Icono de eliminar */}
                <IconButton
                  onClick={() => handleDeleteResult(result.id)}
                  sx={{ position: 'absolute', top: '10px', right: '10px', color: 'red' }}
                >
                  <DeleteIcon />
                </IconButton>

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

      {/* Paginación */}
      {filteredResults.length > 0 && (
        <Box sx={{ textAlign: 'center', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="body1" sx={{ marginLeft: '10px', marginRight: '10px' }}>
            Página {currentPage} de {totalPages}
          </Typography>

          <IconButton
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      )}

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