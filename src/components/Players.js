import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// Información estática de los jugadores
const playersInfo = {
  Ricardo: {
    name: 'Ricardo',
    image: '/Ricardo.jpg',
    position: 'Revés',
    birthDate: '26/11/1994',
    height: '1.80 m',
    birthPlace: 'Madrid',
    country: 'ESP',
    flag: '/spain_flag.jpg',
  },
  Bort: {
    name: 'Bort',
    image: '/Alberto.jpg',
    position: 'Derecha',
    birthDate: '27/01/1994',
    height: '1.80 m',
    birthPlace: 'Valencia',
    country: 'ESP',
    flag: '/spain_flag.jpg',
  },
  Lucas: {
    name: 'Lucas',
    image: '/Lucas.jpg',
    position: 'Derecha',
    birthDate: '11/12/1992',
    height: '1.90 m',
    birthPlace: 'Valencia',
    country: 'GER',
    flag: '/germany_flag.jpg',
  },
  Martin: {
    name: 'Martin',
    image: '/Martin.jpg',
    position: 'Revés',
    birthDate: '18/02/1994',
    height: '1.84 m',
    birthPlace: 'Valencia',
    country: 'ESP',
    flag: '/spain_flag.jpg',
  },
};

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

// Función para normalizar las parejas
const normalizePairKey = (player1, player2) => {
  return [player1, player2].sort().join('-');
};

const calculateConsecutiveWins = (results, player) => {
  let consecutiveWins = 0;
  let maxConsecutiveWins = 0;
  let lastGameWon = false; // Variable para seguir si el último juego fue una victoria

  // Ordenar los resultados por fecha (de más antiguo a más reciente)
  console.log("Resultados antes de la ordenación:", results);
  const sortedResults = results.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  console.log("Partidos ordenados por fecha:", sortedResults);

  sortedResults.forEach((result, index) => {
    const { pair1, pair2, sets } = result;
    let playerWon = false;

    let pair1Wins = 0;
    let pair2Wins = 0;

    // Contar cuántos sets ha ganado cada pareja
    sets.forEach((set) => {
      if (set.pair1Score > set.pair2Score) {
        pair1Wins += 1;
      } else {
        pair2Wins += 1;
      }
    });

    console.log(`Partido ${index + 1} sets ganados: Pareja 1 = ${pair1Wins}, Pareja 2 = ${pair2Wins}`);

    // Determinar si el jugador ganó el partido
    if (
      (pair1Wins > pair2Wins && (pair1.player1 === player || pair1.player2 === player)) ||
      (pair2Wins > pair1Wins && (pair2.player1 === player || pair2.player2 === player))
    ) {
      playerWon = true;
      console.log(`${player} ha ganado el partido ${index + 1}`);
    } else {
      console.log(`${player} ha perdido el partido ${index + 1}`);
    }

    // Si el jugador ganó el partido
    if (playerWon) {
      if (lastGameWon) {
        consecutiveWins += 1;
        console.log(`Racha actual para ${player}: ${consecutiveWins} victorias consecutivas.`);
      } else {
        consecutiveWins = 1; // Empezar una nueva racha si el último partido no fue victoria
        console.log(`${player} empieza una nueva racha.`);
      }
      lastGameWon = true;
    } else {
      // Si perdió, reiniciar la racha
      consecutiveWins = 0;
      lastGameWon = false;
      console.log(`${player} ha perdido, racha reiniciada.`);
    }

    // Actualizar la máxima racha de victorias consecutivas
    maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
    console.log(`Máxima racha hasta ahora para ${player}: ${maxConsecutiveWins}`);
  });

  console.log(`Racha máxima final de victorias consecutivas para ${player}: ${maxConsecutiveWins}`);
  return consecutiveWins; // Devolver la racha de victorias consecutivas actual
};

const Players = () => {
  const [results, setResults] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [pairStats, setPairStats] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      const querySnapshot = await getDocs(collection(db, "results"));
      const fetchedResults = querySnapshot.docs.map(doc => doc.data());

      // Filtrar resultados que tienen una fecha válida
      const validResults = fetchedResults.filter(result => result.date);

      setResults(validResults);
      calculateStats(validResults);
    };

    fetchResults();
  }, []);

  // En la función calculateStats, verifica y corrige la asignación de las victorias:

  const calculateStats = (results) => {
    const stats = {};
    const pairStats = {};
  
    results.forEach(result => {
      const { pair1, pair2, sets } = result;
  
      // Asegúrate de inicializar las estadísticas correctamente para cada jugador
      [pair1.player1, pair1.player2, pair2.player1, pair2.player2].forEach(player => {
        if (!stats[player]) {
          stats[player] = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, consecutiveWins: 0, efficiency: 0 };
        }
        stats[player].gamesPlayed += 1;
      });
  
      // Revisión de los sets ganados por cada pareja
      let pair1Wins = 0;
      let pair2Wins = 0;
  
      sets.forEach(set => {
        if (set.pair1Score > set.pair2Score) {
          pair1Wins += 1;
        } else {
          pair2Wins += 1;
        }
      });
  
      // Determina si la pareja 1 o la pareja 2 ganó
      if (pair1Wins > pair2Wins) {
        stats[pair1.player1].gamesWon += 1;
        stats[pair1.player2].gamesWon += 1;
        stats[pair2.player1].gamesLost += 1;
        stats[pair2.player2].gamesLost += 1;
      } else {
        stats[pair2.player1].gamesWon += 1;
        stats[pair2.player2].gamesWon += 1;
        stats[pair1.player1].gamesLost += 1;
        stats[pair1.player2].gamesLost += 1;
      }
  
      // Calcula las estadísticas de las parejas
      const pairKey1 = normalizePairKey(pair1.player1, pair1.player2);
      const pairKey2 = normalizePairKey(pair2.player1, pair2.player2);
  
      if (!pairStats[pairKey1]) {
        pairStats[pairKey1] = { gamesWon: 0, gamesPlayed: 0 };
      }
      if (!pairStats[pairKey2]) {
        pairStats[pairKey2] = { gamesWon: 0, gamesPlayed: 0 };
      }
  
      pairStats[pairKey1].gamesPlayed += 1;
      pairStats[pairKey2].gamesPlayed += 1;
  
      if (pair1Wins > pair2Wins) {
        pairStats[pairKey1].gamesWon += 1;
      } else {
        pairStats[pairKey2].gamesWon += 1;
      }
    });
  
    // Calcula la eficiencia de cada jugador
    Object.keys(stats).forEach(player => {
      const { gamesWon, gamesPlayed } = stats[player];
      stats[player].efficiency = ((gamesWon / gamesPlayed) * 100).toFixed(2);
  
      // Calcula las victorias consecutivas para cada jugador usando calculateConsecutiveWins
      stats[player].consecutiveWins = calculateConsecutiveWins(results, player); // Añade este paso
    });
  
    // Calcula la eficiencia de cada pareja
    Object.keys(pairStats).forEach(pair => {
      const { gamesWon, gamesPlayed } = pairStats[pair];
      pairStats[pair].efficiency = ((gamesWon / gamesPlayed) * 100).toFixed(2);
    });
  
    setPlayerStats(stats);
    setPairStats(pairStats);
  };
  
  const rankedPlayers = calculateRanking(
    Object.keys(playerStats).map(player => ({
      ...playersInfo[player],
      ...playerStats[player],
    }))
  ).filter(player => player.gamesPlayed > 0); // Solo mostrar jugadores que han jugado al menos un partido

  const rankedPairs = calculatePairRanking(
    Object.keys(pairStats).map(pair => ({
      players: pair.split('-'),
      ...pairStats[pair],
    }))
  );

  return (
    <Container>
      {/* Sección de Jugadores */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Jugadores</Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {Object.keys(playersInfo).map((key) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              onClick={() => {
                console.log('Card clicked:', playersInfo[key].name);
                setSelectedPlayer(selectedPlayer?.name === playersInfo[key].name ? null : playersInfo[key]);
              }}
              sx={{
                position: 'relative',
                '&:hover': { boxShadow: 6, cursor: 'pointer' },
              }}
            >
              <CardMedia component="img" height="200" image={playersInfo[key].image} alt={playersInfo[key].name} />
              <CardContent
                sx={{
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedPlayer?.name === playersInfo[key].name ? '#f5f5f5' : 'transparent',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ '&:hover': { color: 'blue' } }}>
                  {playersInfo[key].name}
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
                    src={playersInfo[key].flag}
                    alt={`${playersInfo[key].country} flag`}
                    style={{ height: '20px', borderRadius: '50%', marginRight: '5px' }}
                  />
                  <Typography variant="body2" sx={{ marginRight: '10px' }}>{playersInfo[key].country}</Typography>
                </Box>

                <ArrowDropDownIcon sx={{ fontSize: 20, color: 'black', marginLeft: '10px' }} />
              </CardContent>

              {selectedPlayer?.name === playersInfo[key].name && (
                <CardContent>
                  {console.log(`Mostrando estadísticas para el jugador: ${key}`)}
                  {console.log(`Victorias consecutivas: ${playerStats[key]?.consecutiveWins || 0}`)}
                  {console.log(`Partidos jugados: ${playerStats[key]?.gamesPlayed || 0}, Partidos ganados: ${playerStats[key]?.gamesWon || 0}`)}
                  <Typography variant="body2">
                    Posición: {playersInfo[key].position} <br />
                    Fecha de nacimiento: {playersInfo[key].birthDate} <br />
                    Altura: {playersInfo[key].height} <br />
                    Lugar de nacimiento: {playersInfo[key].birthPlace} <br />
                  </Typography>
                  <Grid container spacing={2} sx={{ marginTop: '10px', textAlign: 'center' }}>
                    <Grid item xs={6}>
                      <Typography variant="h6">{playerStats[key]?.gamesPlayed || 0}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Partidos jugados
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{playerStats[key]?.gamesWon || 0}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Partidos ganados
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{playerStats[key]?.gamesLost || 0}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Partidos perdidos
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">{playerStats[key]?.consecutiveWins || 0}</Typography>
                      <Typography variant="body2" sx={{ color: 'gray' }}>
                        Victorias consecutivas
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {playerStats[key]?.efficiency || 0}%
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

      {/* Sección Ranking Individual */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Ranking Individual</Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {rankedPlayers.length === 0 ? (
          <Typography sx={{ textAlign: 'center', width: '100%' }}>
            No se han jugado partidos todavía
          </Typography>
        ) : (
          rankedPlayers.map((player, index) => (
            <Grid item xs={12} key={`${player.name}-${index}`}>
              <Card
                sx={{
                  backgroundColor: index === 0 ? 'lightgreen' : 'transparent', // Fondo verde si es el primero
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
                  <Typography variant="h6">
                    {player.name} {index === 0 && <EmojiEventsIcon sx={{ color: 'gold', marginLeft: '5px' }} />}
                  </Typography>
                  <Typography variant="body2">{player.country}</Typography>
                </Box>
                <Box sx={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <Typography variant="body2">
                    {player.gamesWon} partidos ganados | <span style={{ fontWeight: 'bold' }}>{player.efficiency}%</span> eficacia
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Sección Ranking por Pareja */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Ranking por Pareja</Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {rankedPairs.length === 0 ? (
          <Typography sx={{ textAlign: 'center', width: '100%' }}>
            No se han jugado partidos todavía
          </Typography>
        ) : (
          rankedPairs.map((pair, index) => (
            <Grid item xs={12} key={`${pair.players[0]}-${pair.players[1]}-${index}`}>
              <Card
                sx={{
                  backgroundColor: index === 0 ? 'lightgreen' : 'transparent', // Fondo verde si es la primera pareja
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
                    {pair.players[0]} & {pair.players[1]} {index === 0 && <EmojiEventsIcon sx={{ color: 'gold', marginLeft: '5px' }} />}
                  </Typography>
                  <Typography variant="body2">
                    {pair.gamesWon} partidos ganados | <span style={{ fontWeight: 'bold' }}>{pair.efficiency}%</span> eficacia
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))
        )}
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