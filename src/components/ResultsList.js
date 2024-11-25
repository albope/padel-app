import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Typography, Container, Grid, Card, CardContent, Box, Button, FormControl, Select, MenuItem, InputLabel, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField } from '@mui/material';
import { EmojiEvents, Star, Sports, Flag, Edit, ContentCopy } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ResultsList = () => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [editingId, setEditingId] = useState(null); // Para la edición
  const [editableResult, setEditableResult] = useState(null); // Almacena el resultado en edición
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [availableYears, setAvailableYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  const fetchResults = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "results"));
      const resultsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Resultados obtenidos:", resultsData); // Depuración

      const years = [...new Set(resultsData.map((result) => dayjs(result.date).year()))].sort();
      setAvailableYears(years);

      setResults(resultsData);
      setMatchHistory(resultsData); // Guarda el historial completo
      filterResults(resultsData, currentMonth, currentYear); // Filtra los resultados
    } catch (error) {
      console.error("Error al obtener los resultados:", error);
    }
  };

  const filterResults = (results, month, year) => {
    const filtered = results
      .filter(result => {
        const resultDate = dayjs(result.date);
        if (month === 12) {
          return resultDate.year() === year;
        }
        return resultDate.month() === month && resultDate.year() === year;
      })
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

    setFilteredResults(filtered);
    setCurrentPage(1);
  };

  const categorizeMatch = (pair1, pair2, matchHistory) => {
    const matchCount = matchHistory.filter(
      match =>
        (match.pair1.player1 === pair1.player1 &&
          match.pair1.player2 === pair1.player2 &&
          match.pair2.player1 === pair2.player1 &&
          match.pair2.player2 === pair2.player2) ||
        (match.pair1.player1 === pair2.player1 &&
          match.pair1.player2 === pair2.player2 &&
          match.pair2.player1 === pair1.player1 &&
          match.pair2.player2 === pair1.player2)
    ).length;

    if (matchCount >= 10) return { label: 'Superderbi', icon: <Star sx={{ color: '#ff9800' }} /> };
    if (matchCount >= 5) return { label: 'Clásico', icon: <Sports sx={{ color: '#3f51b5' }} /> };
    if (matchCount >= 3) return { label: 'Revancha', icon: <Flag sx={{ color: '#f44336' }} /> };
    return null;
  };

  const handleMonthChange = event => {
    const newMonth = event.target.value;
    setCurrentMonth(newMonth);
    filterResults(results, newMonth, currentYear);
  };

  const handleYearChange = event => {
    const newYear = event.target.value;
    setCurrentYear(newYear);
    filterResults(results, currentMonth, newYear);
  };

  const handleDeleteResult = async (resultId, resultData) => {
    try {
      await deleteDoc(doc(db, 'results', resultId));
      await addDoc(collection(db, 'deletions'), {
        resultId,
        dateDeleted: serverTimestamp(),
        deletedBy: localStorage.getItem('addedBy') || 'Anónimo',
        resultData,
      });
      const updatedResults = results.filter(result => result.id !== resultId);
      setResults(updatedResults);
      filterResults(updatedResults, currentMonth, currentYear);
    } catch (error) {
      console.error('Error al eliminar el resultado:', error);
    }
  };

  const handleClone = async (result) => {
    try {
      // Copia el resultado y ajusta el campo 'date' al formato 'YYYY-MM-DD'
      const newResult = {
        ...result,
        date: dayjs().format('YYYY-MM-DD') // Establece la nueva fecha en el formato correcto
      };
      delete newResult.id; // Elimina el ID original

      // Agrega el nuevo documento a Firestore
      const docRef = await addDoc(collection(db, "results"), newResult);
      console.log("Documento clonado con ID:", docRef.id); // Verifica el nuevo ID

      fetchResults(); // Actualiza la lista de resultados
    } catch (error) {
      console.error("Error al clonar el resultado:", error);
    }
  };

  const handleEdit = (result) => {
    setEditingId(result.id); // Asegúrate de que se establece el ID correcto
    setEditableResult({ ...result }); // Mantén todos los datos del documento
  };

  const handleSaveEdit = async (id) => {
    try {
      if (!id) {
        throw new Error("El ID del documento es inválido.");
      }
      console.log("Intentando guardar el documento con ID:", id);
      console.log("Datos a guardar:", editableResult);

      await updateDoc(doc(db, "results", id), editableResult); // Actualiza el documento
      fetchResults(); // Recarga la lista de resultados
      setEditingId(null); // Finaliza la edición
      setEditableResult(null); // Limpia los datos editables
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditableResult(null);
  };

  const isWinner = (pair, sets) => {
    let pair1Wins = 0;
    let pair2Wins = 0;
    sets.forEach(set => {
      if (set.pair1Score > set.pair2Score) {
        pair1Wins++;
      } else if (set.pair2Score > set.pair1Score) {
        pair2Wins++;
      }
    });
    return pair === 'pair1' ? pair1Wins > pair2Wins : pair2Wins > pair1Wins;
  };

  const handleShareResult = result => {
    const setsResults = result.sets
      .map((set, index) => `  - *Set ${index + 1}:* ${set.pair1Score}-${set.pair2Score}`)
      .join('\n');

    const winner =
      isWinner('pair1', result.sets)
        ? `*¡Victoria de ${result.pair1?.player1 || 'N/A'} y ${result.pair1?.player2 || 'N/A'}!*`
        : `*¡Victoria de ${result.pair2?.player1 || 'N/A'} y ${result.pair2?.player2 || 'N/A'}!*`;

    const message = `
    Resultado del último clásico jugado:

  *Fecha:* ${dayjs(result.date).format('DD-MM-YYYY')}
  *Ubicación:* ${result.location || 'Desconocido'}
  *Pareja 1:* ${result.pair1?.player1 || 'N/A'} y ${result.pair1?.player2 || 'N/A'}
  *Pareja 2:* ${result.pair2?.player1 || 'N/A'} y ${result.pair2?.player2 || 'N/A'}
  *Detalles:*
  ${setsResults}

  ${winner}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

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
            {[
              'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Año completo',
            ].map((month, index) => (
              <MenuItem key={index} value={index}>{month}</MenuItem>
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
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {paginatedResults.map(result => {
          const category = categorizeMatch(result.pair1, result.pair2, matchHistory);
          return (
            <Grid item xs={12} key={result.id}>
              <Card variant="outlined" sx={{ borderRadius: '10px', boxShadow: 2, backgroundColor: '#f9f9f9', padding: '10px', position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: { xs: 'center', sm: 'flex-end' },
                    marginBottom: { xs: '10px', sm: '0' },
                  }}
                >
                  <IconButton onClick={() => handleShareResult(result)} sx={{ color: 'green' }}>
                    <ShareIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteResult(result.id, result)} sx={{ color: 'red' }}>
                    <DeleteIcon />
                  </IconButton>
                  <IconButton onClick={() => handleClone(result)} sx={{ color: 'blue' }}>
                    <ContentCopy />
                  </IconButton>
                  <IconButton onClick={() => handleEdit(result)} sx={{ color: 'orange' }}>
                    <Edit />
                  </IconButton>
                </Box>

                {category && (
                  <Box sx={{ textAlign: 'center', padding: '5px', backgroundColor: '#eeeeee', borderRadius: '5px', marginBottom: '10px' }}>
                    {category.icon} <Typography variant="subtitle1" sx={{ display: 'inline', marginLeft: '5px' }}>{category.label}</Typography>
                  </Box>
                )}
                <CardContent>
                  {editingId === result.id ? (
                    <>
                      <TextField
                        fullWidth
                        label="Ubicación"
                        value={editableResult.location || ''}
                        onChange={(e) => setEditableResult({ ...editableResult, location: e.target.value })}
                        sx={{ marginBottom: '10px' }}
                      />
                      {editableResult.sets?.map((set, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <TextField
                            label={`Set ${index + 1} - Pareja 1`}
                            type="number"
                            value={set.pair1Score ?? ''} // Usamos ?? para permitir valores '0'
                            onChange={(e) => {
                              const updatedSets = [...editableResult.sets];
                              updatedSets[index].pair1Score = e.target.value === '' ? '' : parseInt(e.target.value, 10); // No reemplazamos '0'
                              setEditableResult({ ...editableResult, sets: updatedSets });
                            }}
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label={`Set ${index + 1} - Pareja 2`}
                            type="number"
                            value={set.pair2Score ?? ''} // Usamos ?? para permitir valores '0'
                            onChange={(e) => {
                              const updatedSets = [...editableResult.sets];
                              updatedSets[index].pair2Score = e.target.value === '' ? '' : parseInt(e.target.value, 10); // No reemplazamos '0'
                              setEditableResult({ ...editableResult, sets: updatedSets });
                            }}
                            sx={{ flex: 1 }}
                          />
                        </Box>

                      ))}
                      <Button variant="contained" color="primary" onClick={() => handleSaveEdit(result.id)}>
                        Guardar
                      </Button>
                      <Button variant="text" onClick={handleCancelEdit} sx={{ marginLeft: '10px' }}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
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
                              {result.sets && result.sets.length === 3 && (
                                <TableCell align="center"><strong>Set 3</strong></TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ backgroundColor: isWinner('pair1', result.sets) ? '#d4edda' : 'inherit' }}>
                              <TableCell>
                                {isWinner('pair1', result.sets) && (
                                  <EmojiEvents sx={{ color: '#ffc107', marginRight: '5px' }} />
                                )}
                                <Typography component="span" fontWeight={isWinner('pair1', result.sets) ? 'bold' : 'normal'}>
                                  {result.pair1?.player1 || 'N/A'} y {result.pair1?.player2 || 'N/A'}
                                </Typography>
                              </TableCell>
                              {result.sets.map((set, index) => (
                                <TableCell key={index} align="center">{set.pair1Score || 0}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow sx={{ backgroundColor: isWinner('pair2', result.sets) ? '#d4edda' : 'inherit' }}>
                              <TableCell>
                                {isWinner('pair2', result.sets) && (
                                  <EmojiEvents sx={{ color: '#ffc107', marginRight: '5px' }} />
                                )}
                                <Typography component="span" fontWeight={isWinner('pair2', result.sets) ? 'bold' : 'normal'}>
                                  {result.pair2?.player1 || 'N/A'} y {result.pair2?.player2 || 'N/A'}
                                </Typography>
                              </TableCell>
                              {result.sets.map((set, index) => (
                                <TableCell key={index} align="center">{set.pair2Score || 0}</TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
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