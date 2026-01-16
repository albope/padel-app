// HomePage.js

import React, { useState, useCallback, useMemo } from 'react';
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
  Divider,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ListAltIcon from '@mui/icons-material/ListAlt';

import ResultsList from './ResultsList';
import PullToRefresh from './PullToRefresh';
import dayjs from 'dayjs';

// Context
import { useData } from '../context/DataContext';

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
  const theme = useTheme();
  const { results, gamesByYear, locations, loading, error, refreshData } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  }, []);

  // Memoizar cálculos de paginación
  const totalPages = useMemo(() => Math.ceil(results.length / itemsPerPage), [results.length, itemsPerPage]);
  const paginatedResults = useMemo(() =>
    results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [results, currentPage, itemsPerPage]
  );

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
      <PullToRefresh onRefresh={handleRefresh}>
        <Container maxWidth="md" disableGutters sx={{ pb: 4 }}>
          {/* ResultsList con padding horizontal */}
          <Box sx={{ px: { xs: 1, sm: 2 }, pt: 2 }}>
            <ResultsList results={results} />
          </Box>

        {/* Botón flotante para drawer de resumen - Premium Gold */}
        <Box sx={{ position: 'fixed', bottom: 100, left: 16, zIndex: 1000 }}>
          <Button
            onClick={toggleDrawer(true)}
            aria-label="Ver información de la temporada"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              color: theme.palette.secondary.contrastText,
              borderRadius: '50%',
              padding: '14px',
              minWidth: 'auto',
              boxShadow: theme.shadows[16], // Gold glow
              border: `2px solid ${theme.palette.secondary.light}`,
              transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                transform: 'scale(1.1) rotate(15deg)',
                boxShadow: theme.shadows[18], // Championship glow
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            <InfoOutlinedIcon fontSize="large" />
          </Button>
        </Box>

        {/* Bottom Sheet con estilo Premium "Court of Gold" */}
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              boxShadow: theme.shadows[20], // Maximum drama
              pb: 2,
              maxHeight: '85vh',
              backgroundColor: theme.palette.background.paper,
              borderTop: `3px solid ${theme.palette.secondary.main}`,
              backgroundImage: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
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
                top: '16px',
                right: '16px',
                color: theme.palette.secondary.main,
                backgroundColor: 'transparent',
                minWidth: 'auto',
                padding: '8px',
                '&:hover': {
                  backgroundColor: `rgba(212, 175, 55, 0.1)`,
                  transform: 'rotate(90deg)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <CloseIcon />
            </Button>

            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: '700',
                textAlign: 'center',
                mb: 3,
                color: theme.palette.secondary.main,
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Resumen de la Temporada
            </Typography>

            {/* Partidos jugados por año */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                color: theme.palette.text.primary,
                fontSize: '1rem',
              }}>
                <CalendarTodayIcon sx={{ mr: 1, color: theme.palette.secondary.main, fontSize: '1.25rem' }} />
                Partidos por Año
              </Typography>
              {Object.keys(gamesByYear).length > 0 ? (
                <List dense>
                  {Object.keys(gamesByYear).sort((a, b) => Number(b) - Number(a)).map((year) => (
                    <ListItem
                      key={year}
                      sx={{
                        py: 1,
                        px: 2,
                        mb: 0.5,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.default,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: theme.palette.secondary.main,
                          backgroundColor: theme.palette.background.paper,
                        }
                      }}
                    >
                      <ListItemText
                        primary={year}
                        secondary={`${gamesByYear[year]} partidos`}
                        primaryTypographyProps={{
                          fontWeight: '600',
                          color: theme.palette.text.primary,
                        }}
                        secondaryTypographyProps={{
                          color: theme.palette.text.secondary,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">No hay datos.</Typography>}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Localizaciones */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                color: theme.palette.text.primary,
                fontSize: '1rem',
              }}>
                <LocationOnIcon sx={{ mr: 1, color: theme.palette.secondary.main, fontSize: '1.25rem' }} />
                Localizaciones Frecuentes
              </Typography>
              {locations.length > 0 ? (
                <List dense>
                  {locations.slice(0, 5).map((location, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        py: 1,
                        px: 2,
                        mb: 0.5,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.default,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: theme.palette.secondary.main,
                          backgroundColor: theme.palette.background.paper,
                        }
                      }}
                    >
                      <ListItemText
                        primary={location}
                        primaryTypographyProps={{
                          fontWeight: '500',
                          color: theme.palette.text.primary,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">No hay datos.</Typography>}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Resultados Añadidos */}
            <Box>
              <Typography variant="subtitle1" sx={{
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                color: theme.palette.text.primary,
                fontSize: '1rem',
              }}>
                <ListAltIcon sx={{ mr: 1, color: theme.palette.secondary.main, fontSize: '1.25rem' }} />
                Últimos Resultados Registrados
              </Typography>
              {paginatedResults.length > 0 ? (
                <List>
                  {paginatedResults.map((result) => (
                    <Paper
                      key={result.id}
                      elevation={2}
                      sx={{
                        mb: 1.5,
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: theme.palette.secondary.main,
                          transform: 'translateX(4px)',
                          boxShadow: theme.shadows[4],
                        }
                      }}
                    >
                      <ListItemText
                        primary={`${dayjs(result.date).format('dddd, D [de] MMMM YYYY')}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                              📍 {result.location || 'Desconocido'}
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              Añadido por: {result.addedBy || 'N/A'}
                              {result.createdAt && ` el ${dayjs(result.createdAt).format('D/MM/YY HH:mm')}`}
                            </Typography>
                          </>
                        }
                        primaryTypographyProps={{
                          fontWeight: '600',
                          mb: 0.5,
                          color: theme.palette.text.primary,
                        }}
                      />
                    </Paper>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">No hay resultados en esta página.</Typography>}
            </Box>

            {/* Paginación Premium */}
            {results.length > itemsPerPage && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 3,
                p: 2,
                backgroundColor: theme.palette.background.default,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <Button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:disabled': {
                      color: theme.palette.text.disabled,
                    }
                  }}
                >
                  Anterior
                </Button>
                <Typography variant="body2" sx={{
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}>
                  Pág. {currentPage} de {totalPages}
                </Typography>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:disabled': {
                      color: theme.palette.text.disabled,
                    }
                  }}
                >
                  Siguiente
                </Button>
              </Box>
            )}
          </Box>
        </SwipeableDrawer>
      </Container>
      </PullToRefresh>
    </Box>
  );
};

export default HomePage;