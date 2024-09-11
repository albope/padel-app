import React, { useState } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove'; // Línea horizontal para la posición sin cambio
import { useNavigate } from 'react-router-dom';

// Información de los jugadores
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
    previousRank: 3,
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
    previousRank: 2,
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
    previousRank: 1,
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
    previousRank: 4,
  },
];

// Información de las parejas
const pairs = [
  {
    players: ['Ricardo', 'Alberto'],
    gamesWon: 25,
    efficiency: '60%',
  },
  {
    players: ['Lucas', 'Martin'],
    gamesWon: 32,
    efficiency: '66.7%',
  },
  {
    players: ['Ricardo', 'Lucas'],
    gamesWon: 15,
    efficiency: '50%',
  },
  {
    players: ['Martin', 'Alberto'],
    gamesWon: 20,
    efficiency: '55%',
  },
];

// Función para calcular el ranking basado en partidos ganados y eficacia
const calculateRanking = (players) => {
  return players.sort((a, b) => {
    const efficiencyDiff = parseFloat(b.efficiency) - parseFloat(a.efficiency);
    if (efficiencyDiff !== 0) {
      return efficiencyDiff;
    }
    return b.gamesWon - a.gamesWon;
  });
};

// Función para calcular el ranking de las parejas
const calculatePairRanking = (pairs) => {
  return pairs.sort((a, b) => {
    const efficiencyDiff = parseFloat(b.efficiency) - parseFloat(a.efficiency);
    if (efficiencyDiff !== 0) {
      return efficiencyDiff;
    }
    return b.gamesWon - a.gamesWon;
  });
};

const getRankingChangeIcon = (currentRank, previousRank) => {
  if (currentRank < previousRank) {
    return <ArrowDropUpIcon sx={{ color: 'green' }} />;
  } else if (currentRank > previousRank) {
    return <ArrowDropDownIcon sx={{ color: 'red' }} />;
  } else {
    return <RemoveIcon sx={{ color: 'black' }} />;
  }
};

const Players = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player === selectedPlayer ? null : player); // Toggle entre mostrar y ocultar detalles
  };

  const rankedPlayers = calculateRanking(players);
  const rankedPairs = calculatePairRanking(pairs); // Ranking de parejas

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
                      <Typography variant="h6" sx={{ fontSize: '24px', fontWeight: 'bold' }}>
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

      {/* Encabezado de la sección Ranking Individual */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Ranking Individual</Typography>
      </Box>

      {/* Lista de Ranking Individual */}
      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {rankedPlayers.map((player, index) => (
          <Grid item xs={12} key={player.name}>
            <Card
              sx={{
                backgroundColor: '#e0f7fa',
                display: 'flex',
                alignItems: 'center',
                padding: '20px',
              }}
            >
              <Typography variant="h4" sx={{ flex: '0 0 50px', textAlign: 'center', marginRight: '20px' }}>
                {index + 1}
              </Typography>
              <CardMedia
                component="img"
                sx={{ width: '60px', height: '60px', borderRadius: '50%', marginRight: '20px' }}
                image={player.image}
                alt={player.name}
              />
              <Box>
                <Typography variant="h6">{player.name}</Typography>
                <Typography variant="body2">{player.country}</Typography>
              </Box>
              <Box sx={{ marginLeft: 'auto', textAlign: 'right' }}>
                <Typography variant="body2">
                  {player.gamesWon} partidos ganados |
                  <span style={{ fontWeight: 'bold' }}>{player.efficiency}</span> eficacia
                </Typography>
              </Box>
              {/* Icono para el cambio de posición */}
              <Box sx={{ marginLeft: '20px' }}>
                {getRankingChangeIcon(index + 1, player.previousRank)}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Encabezado de la sección Ranking por Pareja */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Ranking por Pareja</Typography>
      </Box>

      {/* Lista de Ranking por Pareja */}
      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {rankedPairs.map((pair, index) => (
          <Grid item xs={12} key={index}>
            <Card
              sx={{
                backgroundColor: '#e0f7fa',
                display: 'flex',
                alignItems: 'center',
                padding: '20px',
              }}
            >
              <Typography variant="h4" sx={{ flex: '0 0 50px', textAlign: 'center', marginRight: '20px' }}>
                {index + 1}
              </Typography>
              <Box>
                <Typography variant="h6">
                  {pair.players[0]} & {pair.players[1]}
                </Typography>
                <Typography variant="body2">
                  {pair.gamesWon} partidos ganados | <span style={{ fontWeight: 'bold' }}>{pair.efficiency}</span>{' '}
                  eficacia
                </Typography>
              </Box>
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