// ResultsList.js

import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Typography, Container, Grid, Card, CardContent, Box, Button, FormControl, Select, MenuItem, InputLabel, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [availableYears, setAvailableYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  const fetchResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "results"));
      const resultsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calcular los años disponibles dinámicamente
      const years = [...new Set(resultsData.map(result => dayjs(result.date).year()))].sort();
      setAvailableYears(years);

      setResults(resultsData);
      filterResults(resultsData, dayjs().month(), dayjs().year());
    } catch (error) {
      console.error("Error al obtener los resultados:", error);
    }
  };

  const filterResults = (results, month, year) => {
    const filtered = results
      .filter(result => {
        const resultDate = dayjs(result.date);

        // Si se selecciona "Año completo" (índice 12)
        if (month === 12) {
          return resultDate.year() === year;
        }

        // Filtrar por mes y año
        return resultDate.month() === month && resultDate.year() === year;
      })
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date))); // Ordenar por fecha (más reciente primero)

    setFilteredResults(filtered);
    setCurrentPage(1);
  };

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    setCurrentMonth(newMonth);
    filterResults(results, newMonth, currentYear);
  };

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    setCurrentYear(newYear);
    filterResults(results, currentMonth, newYear);
  };

  const handleDeleteResult = async (resultId, resultData) => {
    try {
      await deleteDoc(doc(db, "results", resultId));

      await addDoc(collection(db, "deletions"), {
        resultId,
        dateDeleted: serverTimestamp(),
        deletedBy: localStorage.getItem('addedBy') || 'Anónimo',
        resultData,
      });

      const updatedResults = results.filter(result => result.id !== resultId);
      setResults(updatedResults);
      filterResults(updatedResults, currentMonth, currentYear);
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
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    'Año completo' // Nueva opción
  ];

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

      <Box sx={{ marginTop: '20px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
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
        <FormControl fullWidth>
          <InputLabel id="year-select-label" sx={{ top: '-6px' }}>Selecciona Año</InputLabel>
          <Select
            labelId="year-select-label"
            id="year-select"
            value={currentYear}
            onChange={handleYearChange}
          >
            {availableYears.map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {paginatedResults.length > 0 ? (
          paginatedResults.map((result) => (
            <Grid item xs={12} key={result.id}>
              <Card variant="outlined" sx={{ borderRadius: '10px', boxShadow: 2, backgroundColor: '#f9f9f9', padding: '10px', position: 'relative' }}>
                <IconButton
                  onClick={() => handleDeleteResult(result.id, result)}
                  sx={{ position: 'absolute', top: '10px', right: '10px', color: 'red' }}
                >
                  <DeleteIcon />
                </IconButton>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    <strong>{dayjs(result.date).format('DD-MM-YYYY')}</strong> - <strong>{result.location || 'N/A'}</strong>
                  </Typography>
                  <TableContainer component={Paper} sx={{ marginTop: '20px' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Pareja</strong></TableCell>
                          <TableCell align="center"><strong>Set 1</strong></TableCell>
                          <TableCell align="center"><strong>Set 2</strong></TableCell>
                          {result.sets && result.sets.length === 3 && <TableCell align="center"><strong>Set 3</strong></TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow sx={{ backgroundColor: isWinner('pair1', result.sets) ? '#d4edda' : 'inherit' }}>
                          <TableCell>
                            {isWinner('pair1', result.sets) && <EmojiEvents sx={{ color: '#ffc107', marginRight: '5px' }} />}
                            {result.pair1?.player1 || 'N/A'} y {result.pair1?.player2 || 'N/A'}
                          </TableCell>
                          {result.sets.map((set, index) => (
                            <TableCell key={index} align="center">{set.pair1Score || 0}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow sx={{ backgroundColor: isWinner('pair2', result.sets) ? '#d4edda' : 'inherit' }}>
                          <TableCell>
                            {isWinner('pair2', result.sets) && <EmojiEvents sx={{ color: '#ffc107', marginRight: '5px' }} />}
                            {result.pair2?.player1 || 'N/A'} y {result.pair2?.player2 || 'N/A'}
                          </TableCell>
                          {result.sets.map((set, index) => (
                            <TableCell key={index} align="center">{set.pair2Score || 0}</TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
            <Typography>No hay resultados disponibles</Typography>
          </Box>
        )}
      </Grid>

      {filteredResults.length > 0 && (
        <Box sx={{ textAlign: 'center', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton onClick={handlePreviousPage} disabled={currentPage <= 1}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body1" sx={{ marginLeft: '10px', marginRight: '10px' }}>
            Página {currentPage} de {totalPages}
          </Typography>
          <IconButton onClick={handleNextPage} disabled={currentPage >= totalPages}>
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      )}

      <Box sx={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <Button
          variant="contained"
          sx={{ backgroundColor: 'black', color: 'white', borderRadius: '30px', padding: '10px 20px' }}
          onClick={() => navigate('/add-result')}
        >
          + Añadir Resultado
        </Button>
      </Box>

      <Box
        sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px', borderRadius: '10px' }}
        onClick={() => navigate('/info')}
      >
        <Typography variant="h5">
          Información de las Partidas
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>
      <Box
        sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px', borderRadius: '10px' }}
        onClick={() => navigate('/players')}
      >
        <Typography variant="h5">
          Ranking & Jugadores
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>
      <Box
        sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px', marginBottom: '20px', borderRadius: '10px' }}
        onClick={() => navigate('/insignias')}
      >
        <Typography variant="h5">
          Insignias
          <ArrowForwardIcon sx={{ marginLeft: '8px' }} />
        </Typography>
      </Box>
    </Container>
  );
};

export default ResultsList;