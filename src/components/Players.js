import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'; // Icono de flecha
import { useNavigate } from 'react-router-dom';

const players = [
  {
    name: 'Ricardo',
    image: '/Ricardo.jpg',
    position: 'Right',
    birthDate: '15/07/1990',
    height: '1.80 m',
    birthPlace: 'Sevilla',
    country: 'ESP',
    flag: '/spain_flag.jpg',
    gamesPlayed: 50,
    gamesWon: 35,
    gamesLost: 15,
    consecutiveWins: 5,
    efficiency: '70%',
  },
  {
    name: 'Alberto',
    image: '/Alberto.jpg',
    position: 'Left',
    birthDate: '22/11/1992',
    height: '1.78 m',
    birthPlace: 'Valencia',
    country: 'ESP',
    flag: '/spain_flag.jpg',
    gamesPlayed: 45,
    gamesWon: 30,
    gamesLost: 15,
    consecutiveWins: 4,
    efficiency: '66.6%',
  },
  {
    name: 'Lucas',
    image: '/Lucas.jpg',
    position: 'Right',
    birthDate: '10/02/1989',
    height: '1.85 m',
    birthPlace: 'Madrid',
    country: 'ESP',
    flag: '/spain_flag.jpg',
    gamesPlayed: 48,
    gamesWon: 34,
    gamesLost: 14,
    consecutiveWins: 3,
    efficiency: '70.83%',
  },
  {
    name: 'Martin',
    image: '/Martin.jpg',
    position: 'Left',
    birthDate: '05/05/1991',
    height: '1.81 m',
    birthPlace: 'Barcelona',
    country: 'ESP',
    flag: '/spain_flag.jpg',
    gamesPlayed: 52,
    gamesWon: 38,
    gamesLost: 14,
    consecutiveWins: 6,
    efficiency: '73%',
  },
];

const Players = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player === selectedPlayer ? null : player); // Toggle entre mostrar y ocultar detalles
  };

  return (
    <Container>
      {/* Encabezado de la página */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Jugadores</Typography>
      </Box>

      {/* Lista de jugadores */}
      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {players.map((player) => (
          <Grid item xs={12} sm={6} md={3} key={player.name}>
            <Card
              onClick={() => handlePlayerClick(player)}
              sx={{
                position: 'relative',
                '&:hover': { boxShadow: 6, cursor: 'pointer' },
              }}
            >
              {/* Imagen del jugador */}
              <CardMedia component="img" height="200" image={player.image} alt={player.name} />

              {/* Nombre, bandera e ícono de flecha */}
              <CardContent
                sx={{
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ '&:hover': { color: 'blue' } }} // Efecto hover para destacar el nombre
                >
                  {player.name}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #ddd',
                    borderRadius: '15px',
                    padding: '0 8px',
                    marginLeft: '10px',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <img
                    src={player.flag}
                    alt={`${player.country} flag`}
                    style={{ height: '20px', borderRadius: '50%', marginRight: '5px' }}
                  />
                  <Typography variant="body2">{player.country}</Typography>
                </Box>
                <ArrowDropDownIcon sx={{ marginLeft: '5px' }} /> {/* Ícono de flecha */}
              </CardContent>

              {/* Mostrar detalles al hacer clic */}
              {selectedPlayer === player && (
                <CardContent>
                  <Typography variant="body2">
                    Posición: {player.position} <br />
                    Fecha de nacimiento: {player.birthDate} <br />
                    Altura: {player.height} <br />
                    Lugar de nacimiento: {player.birthPlace} <br />
                  </Typography>
                  {/* Estadísticas visuales */}
                  <Grid container spacing={2} sx={{ marginTop: '10px', textAlign: 'center' }}>
                    <Grid item xs={6}>
                      <Typography variant="h6">{player.gamesPlayed}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Partidos jugados
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{player.gamesWon}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Partidos ganados
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{player.gamesLost}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Partidos perdidos
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{player.consecutiveWins}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Victorias consecutivas
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ fontSize: '24px' }}>
                        {player.efficiency}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Eficacia
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Botón para volver a la página principal */}
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

export default Players;