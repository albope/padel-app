// MatchInfo.js

import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'; // Icono de campana
import { useNavigate } from 'react-router-dom';

const MatchInfo = () => {
  const navigate = useNavigate();

  // Enlaces a Google Calendar con recurrencia
  const calendarLinkTuesday = `https://www.google.com/calendar/render?action=TEMPLATE&text=Partida%20de%20Padel%20-%20Lunes&dates=20240916T180000Z/20240916T193000Z&details=Partida%20de%20padel%20en%20Passing%20Padel&location=Passing%20Padel&recur=RRULE:FREQ=WEEKLY;BYDAY=MO`;
  const calendarLinkThursday = `https://www.google.com/calendar/render?action=TEMPLATE&text=Partida%20de%20Padel%20-%20Jueves&dates=20240919T173000Z/20240919T190000Z&details=Partida%20de%20padel%20en%20Passing%20Padel&location=Passing%20Padel&recur=RRULE:FREQ=WEEKLY;BYDAY=TH`;

  return (
    <Container>
      {/* Encabezado */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Información de las Partidas</Typography>
      </Box>

      {/* Información de la partida del martes */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Partida del Lunes</strong></Typography>
        <Typography variant="body1">Fecha: Lunes, <strong>20:00 - 21:30</strong></Typography>
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
            title="Mapa Passing Padel"
          ></iframe>
        </Box>

        {/* Botón de sincronización con Google Calendar */}
        <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
          <Button
            component="a"
            href={calendarLinkTuesday}
            target="_blank"
            startIcon={<NotificationsActiveIcon sx={{ color: 'red' }} />} // Icono de campana en rojo
            sx={{
              textTransform: 'none',
              backgroundColor: '#f0f0f0',
              color: '#333',
              '&:hover': { backgroundColor: '#ddd' }
            }}
          >
            Añadir la Partida del Lunes a Google Calendar
          </Button>
        </Box>
      </Box>

      {/* Información de la partida del jueves */}
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
            title="Mapa Passing Padel"
          ></iframe>
        </Box>

        {/* Botón de sincronización con Google Calendar */}
        <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
          <Button
            component="a"
            href={calendarLinkThursday}
            target="_blank"
            startIcon={<NotificationsActiveIcon sx={{ color: 'red' }} />} // Icono de campana en rojo
            sx={{
              textTransform: 'none',
              backgroundColor: '#f0f0f0',
              color: '#333',
              '&:hover': { backgroundColor: '#ddd' }
            }}
          >
            Añadir la Partida del Jueves a Google Calendar
          </Button>
        </Box>
      </Box>

      {/* Botón para volver a la pantalla principal */}
      <Box sx={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
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
          onClick={() => navigate('/')}
        >
          Volver a la pantalla principal
        </Button>
      </Box>
    </Container>
  );
};

export default MatchInfo;