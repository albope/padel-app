import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const MatchInfo = () => {
  return (
    <Container>
      {/* Encabezado */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Información de las Partidas</Typography>
      </Box>

      {/* Información de la partida de los martes */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Partida del Martes</strong></Typography>
        <Typography variant="body1">Fecha: Martes, 20:30 - 22:00</Typography>
        <Typography variant="body1">Lugar: Padel Elite 22</Typography>

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
        <Typography variant="body1">Fecha: Jueves, 19:30 - 21:00</Typography>
        <Typography variant="body1">Lugar: Passing Padel</Typography>

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
    </Container>
  );
};

export default MatchInfo;