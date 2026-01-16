// HomePage.js

import React, { useState, useEffect, useCallback } from 'react'; // useCallback añadido
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Container,
  Typography,
  Box,
  Button,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon, // Añadido para iconos en el drawer
  Divider,
  CircularProgress, // Para estado de carga
  Alert,            // Para estado de error
  Paper,            // Para un mejor fondo del drawer
  useTheme,         // Para acceder a colores del tema (si existe)
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // Icono para año
import LocationOnIcon from '@mui/icons-material/LocationOn';     // Icono para localizaciones
import ListAltIcon from '@mui/icons-material/ListAlt';          // Icono para resultados

import ResultsList from './ResultsList';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

// Estilo para el "handle" del drawer
const pullerSx = {
  width: 30,
  height: 6,
  backgroundColor: (theme) => theme.palette.mode === 'light' ? 'grey.300' : 'grey.900',
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)',
};


const HomePage = () => {
  const theme = useTheme(); // Acceder al tema de MUI
  const [totalGamesByYear, setTotalGamesByYear] = useState({});
  const [locations, setLocations] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Para la paginación dentro del drawer

  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, "results"));
        const gamesByYear = {};
        const uniqueLocations = new Set();
        const fetchedResults = [];

        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          let resultDateObject;
          if (data.date && typeof data.date.toDate === 'function') {
            resultDateObject = data.date.toDate();
          } else if (data.date) {
            resultDateObject = dayjs(data.date).toDate();
          } else {
            resultDateObject = new Date(); // Fallback
          }
          const resultYear = resultDateObject.getFullYear();

          if (!gamesByYear[resultYear]) {
            gamesByYear[resultYear] = 0;
          }
          gamesByYear[resultYear] += 1;

          if (data.location) {
            uniqueLocations.add(data.location);
          }

          let createdAtDateObject = null;
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAtDateObject = data.createdAt.toDate();
          } else if (data.createdAt) {
            createdAtDateObject = dayjs(data.createdAt).toDate();
          }

          fetchedResults.push({
            id: doc.id,
            ...data,
            date: resultDateObject,
            createdAt: createdAtDateObject,
          });
        });

        fetchedResults.sort((a, b) => b.date.getTime() - a.date.getTime());

        setTotalGamesByYear(gamesByYear);
        setLocations([...uniqueLocations]);
        setResults(fetchedResults);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("No se pudieron cargar los datos. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  }, []);

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  }, [currentPage]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', py: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>Cargando Partidas...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error" sx={{ justifyContent: 'center' }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default }}>
      <Container maxWidth="md" disableGutters sx={{ pb: 4 }}>
        {/* ResultsList con padding horizontal */}
        <Box sx={{ px: { xs: 1, sm: 2 }, pt: 2 }}>
          <ResultsList results={results} />
        </Box>

        {/* Botón flotante para drawer de resumen */}
        <Box sx={{ position: 'fixed', bottom: 140, right: 16, zIndex: 1000 }}>
          <Button
            onClick={toggleDrawer(true)}
            aria-label="Ver información de la temporada"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              borderRadius: '50%',
              padding: '14px',
              minWidth: 'auto',
              boxShadow: theme.shadows[6],
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            <InfoOutlinedIcon fontSize="large" />
          </Button>
        </Box>

        {/* Bottom Sheet con estilo moderno */}
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20, // Esquinas redondeadas
              borderTopRightRadius: 20,
              boxShadow: theme.shadows[5],
              pb: 2, // Padding bottom
              maxHeight: '85vh', // Limitar altura máxima
            }
          }}
        >
          <Box sx={pullerSx} /> {/* Handle visual */}
          <Box
            sx={{
              pt: 4, // Padding top para dejar espacio al "puller"
              px: { xs: 2, sm: 3 }, // Padding horizontal responsivo
              fontFamily: '"Roboto", sans-serif',
              color: theme.palette.text.primary,
            }}
            role="presentation"
          >
            <Button
              aria-label="Cerrar"
              onClick={toggleDrawer(false)}
              sx={{
                position: 'absolute',
                top: '16px', // Ajustar posición
                right: '16px',
                color: theme.palette.grey[500]
              }}
            >
              <CloseIcon />
            </Button>

            <Typography
              variant="h5" // Más prominente
              component="h2"
              gutterBottom
              sx={{ fontWeight: '600', textAlign: 'center', mb: 3 }}
            >
              Resumen de la Temporada
            </Typography>

            {/* Partidos jugados por año */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Partidos por Año
              </Typography>
              {Object.keys(totalGamesByYear).length > 0 ? (
                <List dense>
                  {Object.keys(totalGamesByYear).sort((a, b) => Number(b) - Number(a)).map((year) => (
                    <ListItem key={year} sx={{ py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <ListItemText
                        primary={year}
                        secondary={`${totalGamesByYear[year]} partidos`}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">No hay datos.</Typography>}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Localizaciones */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOnIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Localizaciones Frecuentes
              </Typography>
              {locations.length > 0 ? (
                <List dense>
                  {locations.slice(0, 5).map((location, index) => ( // Mostrar solo algunas
                    <ListItem key={index} sx={{ py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <ListItemText primary={location} />
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">No hay datos.</Typography>}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Resultados Añadidos */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', mb: 1 }}>
                <ListAltIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Últimos Resultados Registrados
              </Typography>
              {paginatedResults.length > 0 ? (
                <List>
                  {paginatedResults.map((result) => (
                    <Paper key={result.id} elevation={1} sx={{ mb: 1.5, p: 1.5, borderRadius: 2 }}>
                      <ListItemText
                        primary={`${dayjs(result.date).format('dddd, D [de] MMMM YYYY')}`} // Formato más completo
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Lugar: {result.location || 'Desconocido'}
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption" color="text.secondary">
                              Añadido por: {result.addedBy || 'N/A'}
                              {result.createdAt && ` el ${dayjs(result.createdAt).format('D/MM/YY HH:mm')}`}
                            </Typography>
                          </>
                        }
                        primaryTypographyProps={{ fontWeight: 'medium', mb: 0.5 }}
                      />
                    </Paper>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">No hay resultados en esta página.</Typography>}
            </Box>

            {/* Paginación */}
            {results.length > itemsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, p: 1, backgroundColor: theme.palette.grey[100], borderRadius: 2 }}>
                <Button onClick={handlePreviousPage} disabled={currentPage === 1} startIcon={<ArrowBackIcon />}>
                  Anterior
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Pág. {currentPage} de {totalPages}
                </Typography>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages} endIcon={<ArrowForwardIcon />}>
                  Siguiente
                </Button>
              </Box>
            )}
          </Box>
        </SwipeableDrawer>
      </Container>
    </Box>
  );
};

export default HomePage;