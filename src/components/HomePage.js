import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, IconButton, SwipeableDrawer, List, ListItem, ListItemText, Divider } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // Icono "i"
import CloseIcon from '@mui/icons-material/Close'; // Ícono de cerrar
import ResultsList from './ResultsList';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const HomePage = () => {
  const [totalGames, setTotalGames] = useState(0); // Estado para los partidos totales
  const [locations, setLocations] = useState([]); // Estado para las localizaciones únicas
  const [drawerOpen, setDrawerOpen] = useState(false); // Estado para abrir/cerrar el Bottom Sheet

  // Obtener los resultados y calcular los partidos jugados en el año y las localizaciones
  useEffect(() => {
    const fetchResults = async () => {
      const querySnapshot = await getDocs(collection(db, "results"));
      const currentYear = new Date().getFullYear();

      let gamesThisYear = 0;
      const uniqueLocations = new Set();

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const resultDate = new Date(data.date);
        
        // Verificar si el partido es del año en curso
        if (resultDate.getFullYear() === currentYear) {
          gamesThisYear += 1;
        }

        // Agregar localización única al conjunto
        if (data.location) {
          uniqueLocations.add(data.location);
        }
      });

      setTotalGames(gamesThisYear);
      setLocations([...uniqueLocations]); // Convertir el Set en un array
    };

    fetchResults();
  }, []);

  // Funciones para abrir/cerrar el Bottom Sheet
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <Container maxWidth="sm" disableGutters>
      {/* Encabezado de la App */}
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
          sx={{ fontWeight: 'bold', letterSpacing: '1px', fontSize: '1.8rem', color: '#333' }}
        >
          Padel Mas Camarena
        </Typography>
      </Box>

      {/* Lista de Resultados */}
      <ResultsList />

      {/* Botón flotante con icono de información alineado a la derecha */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, textAlign: 'center' }}>
        <IconButton
          onClick={toggleDrawer(true)}
          sx={{
            backgroundColor: 'black', // Relleno negro
            color: 'white', // Color del icono blanco
            borderRadius: '50%', // Mantener borde redondeado
            padding: '10px',
          }}
        >
          <InfoOutlinedIcon fontSize="large" sx={{ color: 'white' }} /> {/* Icono "i" en blanco */}
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
          {/* Botón para cerrar */}
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

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            Datos Temporada Actual
          </Typography>
          
          <Divider sx={{ marginBottom: '10px' }} />
          
          {/* Partidos jugados en negrita */}
          <List>
            <ListItem>
              <ListItemText
                primary={<span style={{ fontWeight: 'bold' }}>Partidos jugados en {new Date().getFullYear()}: {totalGames}</span>}
              />
            </ListItem>
          </List>

          <Divider sx={{ marginBottom: '10px' }} />

          {/* Localizaciones */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
            Localizaciones
          </Typography>
          <List>
            {locations.map((location, index) => (
              <ListItem key={index}>
                <ListItemText primary={location} />
              </ListItem>
            ))}
          </List>
        </Box>
      </SwipeableDrawer>
    </Container>
  );
};

export default HomePage;