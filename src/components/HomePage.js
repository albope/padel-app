// HomePage.js

import React, { useState, useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Icono para ir hacia atrás
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // Icono para ir hacia adelante
import { Container, Typography, Box, IconButton, SwipeableDrawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ResultsList from './ResultsList';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs'; // Para formatear fechas

const HomePage = () => {
  const [totalGamesByYear, setTotalGamesByYear] = useState({});
  const [locations, setLocations] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchResults = async () => {
      const querySnapshot = await getDocs(collection(db, "results"));

      const gamesByYear = {};
      const uniqueLocations = new Set();
      const fetchedResults = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const resultDate = new Date(data.date);
        const resultYear = resultDate.getFullYear();

        // Actualizar el conteo de partidos por año
        if (!gamesByYear[resultYear]) {
          gamesByYear[resultYear] = 0;
        }
        gamesByYear[resultYear] += 1;

        // Actualizar localizaciones únicas
        if (data.location) {
          uniqueLocations.add(data.location);
        }

        fetchedResults.push({
          id: doc.id,
          ...data,
        });
      });

      setTotalGamesByYear(gamesByYear);
      setLocations([...uniqueLocations]);
      setResults(fetchedResults);
    };

    fetchResults();
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  return (
    <Container maxWidth="sm" disableGutters>
      <Box
        sx={{
          backgroundColor: 'transparent',
          color: 'black',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Roboto", sans-serif',
          letterSpacing: '2px',
        }}
      >
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/pelota-de-padel.ico`}
          alt="Raqueta"
          sx={{ height: '40px', marginRight: '15px' }}
        />
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontSize: '1.8rem',
            color: '#333',
            borderBottom: 'none',
          }}
        >
          Padel Mas Camarena
        </Typography>
      </Box>

      {/* Eliminamos los botones de "Añadir Resultado" y "Ver Estadísticas Avanzadas" */}

      <ResultsList />

      {/* Botón flotante para Información de las partidas */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, textAlign: 'center' }}>
        <IconButton
          onClick={toggleDrawer(true)}
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '50%',
            padding: '15px',
          }}
        >
          <InfoOutlinedIcon fontSize="large" sx={{ color: 'white' }} />
        </IconButton>
      </Box>

      {/* Bottom Sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
      >
        <Box
          sx={{
            width: '100%',
            padding: '20px',
            fontFamily: '"Roboto", sans-serif',
            color: '#333',
            position: 'relative',
          }}
          role="presentation"
        >
          <IconButton
            onClick={toggleDrawer(false)}
            sx={{
              position: 'absolute',
              top: '10px',
              right: '10px',
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 'bold', textAlign: 'center' }}
          >
            Datos Temporada Actual
          </Typography>

          <Divider sx={{ marginBottom: '10px' }} />

          {/* Partidos jugados por año */}
          <List>
            {Object.keys(totalGamesByYear).sort().map((year) => (
              <ListItem key={year}>
                <ListItemText
                  primary={
                    <span style={{ fontWeight: 'bold' }}>
                      Partidos jugados en {year}: {totalGamesByYear[year]}
                    </span>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ marginBottom: '10px' }} />

          {/* Localizaciones */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            Localizaciones
          </Typography>
          <List>
            {locations.map((location, index) => (
              <ListItem key={index}>
                <ListItemText primary={location} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ marginBottom: '10px' }} />

          {/* Resultados Añadidos */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 'bold',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            Resultados Añadidos
          </Typography>
          <List>
            {paginatedResults.map((result) => (
              <ListItem key={result.id}>
                <ListItemText
                  primary={`Fecha: ${dayjs(result.date).format('DD/MM/YYYY')} - Lugar: ${result.location || 'Desconocido'}`}
                  secondary={`Añadido por: ${result.addedBy} el ${result.createdAt ? dayjs(result.createdAt.toDate()).format('DD/MM/YYYY') : 'Desconocido'}`}
                />
              </ListItem>
            ))}
          </List>

          {/* Paginación */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
            <IconButton onClick={handlePreviousPage} disabled={currentPage === 1}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="body1" sx={{ marginLeft: '10px', marginRight: '10px' }}>
              Página {currentPage} de {totalPages}
            </Typography>
            <IconButton onClick={handleNextPage} disabled={currentPage === totalPages}>
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Container>
  );
};

export default HomePage;