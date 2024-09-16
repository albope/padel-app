// ResultsList.js

import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Typography, Container, Grid, Card, CardContent, Box, Button, FormControl, Select, MenuItem, InputLabel, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material'; // Importamos el ícono de trofeo
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs'; // Para manejar fechas
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Icono para ir hacia atrás

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

  const handleDeleteResult = async (resultId, resultData) => {
    try {
      // Eliminar el documento de la colección "results"
      await deleteDoc(doc(db, "results", resultId));

      // Registrar la eliminación en la colección "deletions"
      await addDoc(collection(db, "deletions"), {
        resultId, // ID del resultado eliminado
        dateDeleted: serverTimestamp(), // Timestamp de la eliminación
        deletedBy: localStorage.getItem('addedBy') || 'Anónimo', // Quién eliminó el resultado
        resultData // Información del resultado eliminado
      });

      // Actualizar la lista de resultados eliminando el resultado localmente
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
          paginatedResults.map((result) => {
            // Determinar si hay un tercer set
            const hasThirdSet = result.sets && result.sets.length === 3;

            return (
              <Grid item xs={12} key={result.id}>
                <Card variant="outlined" sx={{ borderRadius: '10px', boxShadow: 2, backgroundColor: '#f9f9f9', padding: '10px', position: 'relative' }}>

                  {/* Icono de eliminar */}
                  <IconButton
                    onClick={() => handleDeleteResult(result.id, result)}
                    sx={{ position: 'absolute', top: '10px', right: '10px', color: 'red' }}
                  >
                    <DeleteIcon />
                  </IconButton>

                  <CardContent>
                    {/* Fecha y ubicación */}
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      <strong>{dayjs(result.date).format('DD-MM-YYYY')}</strong> - <strong>{result.location || 'N/A'}</strong>
                    </Typography>

                    {/* Tabla de resultados */}
                    <TableContainer component={Paper} sx={{ marginTop: '20px' }}>
                      <Table aria-label="resultados de partidos">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Pareja</strong></TableCell>
                            <TableCell align="center"><strong>Set 1</strong></TableCell>
                            <TableCell align="center"><strong>Set 2</strong></TableCell>
                            {hasThirdSet && <TableCell align="center"><strong>Set 3</strong></TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {/* Fila de Pareja 1 */}
                          <TableRow
                            sx={{
                              backgroundColor: isWinner('pair1', result.sets) ? '#d4edda' : 'inherit',
                            }}
                          >
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{
                                fontWeight: isWinner('pair1', result.sets) ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {isWinner('pair1', result.sets) && (
                                <EmojiEvents sx={{ color: '#ffc107', marginRight: '5px' }} />
                              )}
                              {result.pair1?.player1 || 'N/A'} y {result.pair1?.player2 || 'N/A'}
                            </TableCell>
                            {result.sets.map((set, index) => (
                              <TableCell
                                key={index}
                                align="center"
                                sx={{
                                  fontWeight: isWinner('pair1', result.sets) ? 'bold' : 'normal',
                                }}
                              >
                                {set.pair1Score || 0}
                              </TableCell>
                            ))}
                            {/* Celdas vacías si no hay tercer set */}
                            {!hasThirdSet && <TableCell align="center">{' '}</TableCell>}
                          </TableRow>
                          {/* Fila de Pareja 2 */}
                          <TableRow
                            sx={{
                              backgroundColor: isWinner('pair2', result.sets) ? '#d4edda' : 'inherit',
                            }}
                          >
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{
                                fontWeight: isWinner('pair2', result.sets) ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              {isWinner('pair2', result.sets) && (
                                <EmojiEvents sx={{ color: '#ffc107', marginRight: '5px' }} />
                              )}
                              {result.pair2?.player1 || 'N/A'} y {result.pair2?.player2 || 'N/A'}
                            </TableCell>
                            {result.sets.map((set, index) => (
                              <TableCell
                                key={index}
                                align="center"
                                sx={{
                                  fontWeight: isWinner('pair2', result.sets) ? 'bold' : 'normal',
                                }}
                              >
                                {set.pair2Score || 0}
                              </TableCell>
                            ))}
                            {/* Celdas vacías si no hay tercer set */}
                            {!hasThirdSet && <TableCell align="center">{' '}</TableCell>}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                  </CardContent>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginTop: '20px'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center'
              }}
            >
              No hay resultados disponibles
            </Typography>
          </Box>
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

      {/* Sección "Información de las Partidas" */}
      <Box
        sx={{
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginTop: '20px',
          borderRadius: '10px',
          '&:hover': { cursor: 'pointer', backgroundColor: '#333' },
        }}
        onClick={() => navigate('/info')}
      >
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Información de las Partidas
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>

      {/* Sección "Ranking & Jugadores" */}
      <Box
        sx={{
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginTop: '20px',
          borderRadius: '10px',
          '&:hover': { cursor: 'pointer', backgroundColor: '#333' },
        }}
        onClick={() => navigate('/players')}
      >
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Ranking & Jugadores
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>

      {/* Sección "Insignias" */}
      <Box
        sx={{
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginTop: '20px',
          marginBottom: '20px',
          borderRadius: '10px',
          '&:hover': { cursor: 'pointer', backgroundColor: '#333' },
        }}
        onClick={() => navigate('/insignias')}
      >
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Insignias
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>
    </Container>
  );
};

export default ResultsList;