import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MatchInfo = () => {
  const navigate = useNavigate(); // Hook para la navegación

  return (
    <Container>
      {/* Encabezado */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Información de las Partidas</Typography>
      </Box>

      {/* Información de la partida de los martes */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Partida del Martes</strong></Typography>
        <Typography variant="body1">Fecha: Martes, <strong>20:30 - 22:00</strong></Typography>
        <Typography variant="body1">Lugar: <strong>Elite Padel 22</strong></Typography>
        <Typography variant="body1">Teléfono: <strong>699 34 90 79</strong></Typography>

        {/* Google Maps embebido */}
        <Box sx={{ marginTop: '10px' }}>
          <iframe
            src="https://maps.google.com/maps?q=Padel%20Elite%2022&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </Box>
      </Box>

      {/* Información de la partida de los jueves */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Partida del Jueves</strong></Typography>
        <Typography variant="body1">Fecha: Jueves, <strong>19:30 - 21:00</strong></Typography>
        <Typography variant="body1">Lugar: <strong>Passing Padel</strong></Typography>
        <Typography variant="body1">Teléfono: <strong>722 18 91 91</strong></Typography>

        {/* Google Maps embebido */}
        <Box sx={{ marginTop: '10px' }}>
          <iframe
            src="https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </Box>
      </Box>

      {/* Botón para volver a la pantalla principal */}
      <Box sx={{ textAlign: 'center', marginTop: '30px' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '30px',
            padding: '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#333',
            },
          }}
          onClick={() => navigate('/')} // Navega de vuelta a la pantalla principal
        >
          Volver a la pantalla principal
        </Button>
      </Box>
    </Container>
  );
};

export default MatchInfo;