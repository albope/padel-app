// src/components/HomePage.js
import React, { useState, useCallback } from 'react';
import {
  Container, Typography, Box, Button, SwipeableDrawer,
  List, ListItem, ListItemText, Divider, Skeleton, Alert,
  Paper, useTheme, IconButton, Avatar
} from '@mui/material';
import {
  InfoOutlined as InfoOutlinedIcon,
  Close as CloseIcon,
  CalendarToday as CalendarTodayIcon,
  LocationOn as LocationOnIcon,
  ListAlt as ListAltIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  SportsTennis as SportsTennisIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import dayjs from 'dayjs';
import { usePadelResults } from '../hooks/usePadelResults';
import ResultsList from './ResultsList';

// Componente para las tarjetas de resultados en el drawer
const ResultCard = ({ result, theme }) => (
  <Paper key={result.id} elevation={0} sx={{ p: 2, mb: 1.5, bgcolor: theme.palette.action.hover, borderRadius: 3, display: 'flex', alignItems: 'center' }}>
    <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
      <SportsTennisIcon />
    </Avatar>
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold">
        {dayjs(result.date).format('dddd, D [de] MMMM YYYY')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
        <LocationOnIcon sx={{ fontSize: '1rem', color: 'text.secondary', mr: 0.5 }} />
        <Typography variant="caption" color="text.secondary">
          {result.location || 'Ubicación no registrada'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
        <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary', mr: 0.5 }} />
        <Typography variant="caption" color="text.secondary">
          Añadido por: {result.addedBy || 'Anónimo'}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const HomePage = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { results, stats, loading, error, refetch } = usePadelResults();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  }, []);

  // Estado de carga (Skeleton UI)
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
         <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, alignItems: 'center' }}>
            <Skeleton variant="circular" width={50} height={50} sx={{ mr: 2 }} />
            <Skeleton variant="text" width={250} height={60} />
         </Box>
         <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
         <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
         <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={refetch}>Reintentar</Button>
        }>{error}</Alert>
      </Container>
    );
  }

  // Header moderno con degradado
  const headerStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: theme.palette.common.white,
    padding: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
    borderRadius: '0 0 20px 20px',
    mb: 3,
  };

  return (
    <Box sx={{ 
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5', 
        minHeight: '100vh', 
        pb: 15 // <--- AUMENTADO: De 10 a 15 para dar más espacio de scroll al final
    }}>
      <Container maxWidth="md" disableGutters>
        
        {/* HEADER PEGAJOSO MEJORADO */}
        <Box sx={headerStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/pelota-de-padel.ico`}
              alt="Logo"
              sx={{ height: 50, width: 'auto', mr: 2, filter: 'brightness(0) invert(1)' }} // Icono blanco
            />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  letterSpacing: '-1px',
                }}
              >
                Padel Mas Camarena
              </Typography>
              <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Tu comunidad de pádel</Typography>
            </Box>
          </Box>
          <IconButton onClick={refetch} size="small" sx={{ color: 'inherit', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* LISTA DE RESULTADOS */}
        <Box sx={{ px: { xs: 2, sm: 3 } }}>
           <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.text.primary }}>Resultados Recientes</Typography>
           <ResultsList results={results} />
        </Box>

        {/* BOTÓN FLOTANTE (FAB) - CORREGIDO POSICIÓN */}
        <Box sx={{ 
            position: 'fixed', 
            bottom: { xs: 75, sm: 40 }, // <--- BAJADO: De 90 a 75 para pegarlo más a la barra
            right: 30, 
            zIndex: 11 
        }}>
          <Button
            onClick={toggleDrawer(true)}
            variant="contained"
            color="secondary"
            sx={{
              borderRadius: '50px',
              padding: '12px 24px',
              boxShadow: theme.shadows[6],
              textTransform: 'none',
              fontSize: '1rem',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`
            }}
          >
            <InfoOutlinedIcon />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Estadísticas</Box>
          </Button>
        </Box>

        {/* DRAWER DE ESTADÍSTICAS */}
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '85vh',
            }
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
             <Box sx={{ width: 40, height: 6, bgcolor: 'grey.300', borderRadius: 3 }} />
          </Box>

          <Box sx={{ px: 3, pb: 4, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Resumen de Temporada</Typography>
                <IconButton onClick={toggleDrawer(false)}><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 1, color: theme.palette.primary.main }}>
                <CalendarTodayIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> Partidos por Año
              </Typography>
              {Object.keys(stats.gamesByYear).length > 0 ? (
                 <List dense disablePadding>
                  {Object.entries(stats.gamesByYear).sort((a, b) => b[0] - a[0]).map(([year, count]) => (
                    <ListItem key={year} divider sx={{ px: 0 }}>
                      <ListItemText primary={year} primaryTypographyProps={{fontWeight: 'medium'}} />
                      <Typography fontWeight="bold">{count} partidos</Typography>
                    </ListItem>
                  ))}
                 </List>
              ) : <Typography variant="body2" color="text.secondary">Sin datos.</Typography>}
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 1, color: theme.palette.primary.main }}>
                <LocationOnIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> Ubicaciones
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                 {stats.locations.length > 0 ? stats.locations.slice(0,5).map((loc, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ px: 1.5, py: 0.5, borderRadius: 4, bgcolor: 'background.default' }}>
                        <Typography variant="body2">{loc}</Typography>
                    </Paper>
                 )) : <Typography variant="body2" color="text.secondary">Sin datos.</Typography>}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 2, color: theme.palette.primary.main }}>
                    <ListAltIcon sx={{ mr: 1, fontSize: '1.2rem' }} /> Registro Reciente
                </Typography>
                
                {paginatedResults.map(result => (
                    <ResultCard key={result.id} result={result} theme={theme} />
                ))}
                
                {results.length > itemsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, alignItems: 'center' }}>
                        <Button size="small" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} startIcon={<ArrowBackIcon />}>
                            Ant.
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                            {currentPage} / {totalPages}
                        </Typography>
                        <Button size="small" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} endIcon={<ArrowForwardIcon />}>
                            Sig.
                        </Button>
                    </Box>
                )}
            </Box>

          </Box>
        </SwipeableDrawer>
      </Container>
    </Box>
  );
};

export default HomePage;