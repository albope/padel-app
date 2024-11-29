// Insignias.js

import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Tooltip, Button, Box } from '@mui/material';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Insignias = () => {
  const [playerStats, setPlayerStats] = useState({});
  const players = ['Lucas', 'Bort', 'Martin', 'Ricardo'];
  const navigate = useNavigate();

  useEffect(() => {
    const getMatchWinner = (sets) => {
      let pair1Wins = 0;
      let pair2Wins = 0;
      sets.forEach(set => {
        if (set.pair1Score > set.pair2Score) {
          pair1Wins += 1;
        } else if (set.pair2Score > set.pair1Score) {
          pair2Wins += 1;
        }
      });
      return pair1Wins > pair2Wins ? 'pair1' : 'pair2';
    };

    const calculateConsecutiveWins = (matches, playerName) => {
      let consecutiveWins = 0;
      let maxConsecutiveWins = 0;
      let lastGameWon = null;

      // Ordenar los partidos por fecha
      const sortedMatches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));

      sortedMatches.forEach(match => {
        const winner = getMatchWinner(match.sets);

        // Determinar si el jugador ganó
        const playerPair = (match.pair1.player1 === playerName || match.pair1.player2 === playerName) ? 'pair1' : 'pair2';
        const playerWon = playerPair === winner;

        if (playerWon) {
          if (lastGameWon === true || lastGameWon === null) {
            consecutiveWins += 1;
          } else {
            consecutiveWins = 1;
          }
        } else {
          consecutiveWins = 0;
        }

        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
        lastGameWon = playerWon;
      });

      return { consecutiveWins, maxConsecutiveWins };
    };

    const fetchResults = async () => {
      const querySnapshot = await getDocs(collection(db, "results"));
      const stats = {};
      const matches = [];

      // Recopilar todas las partidas en un array
      querySnapshot.forEach(doc => {
        const data = doc.data();
        matches.push(data);
      });

      // Ordenar las partidas por fecha, del más antiguo al más reciente
      matches.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Inicializar estadísticas para cada jugador
      players.forEach(playerName => {
        stats[playerName] = {
          gamesPlayed: 0,
          gamesWon: 0,
          partners: new Set(),
          efficiency: 0,
          winStreak: 0,
          longestStreak: 0
        };
      });

      // Procesar cada partida
      matches.forEach(match => {
        const winner = getMatchWinner(match.sets);

        const playersInGame = [
          match.pair1.player1,
          match.pair1.player2,
          match.pair2.player1,
          match.pair2.player2
        ];

        // Actualizar estadísticas generales
        playersInGame.forEach(playerName => {
          stats[playerName].gamesPlayed += 1;

          // Actualizar compañeros
          if (match.pair1.player1 === playerName) {
            stats[playerName].partners.add(match.pair1.player2);
          } else if (match.pair1.player2 === playerName) {
            stats[playerName].partners.add(match.pair1.player1);
          } else if (match.pair2.player1 === playerName) {
            stats[playerName].partners.add(match.pair2.player2);
          } else if (match.pair2.player2 === playerName) {
            stats[playerName].partners.add(match.pair2.player1);
          }
        });

        // Actualizar victorias
        [match.pair1.player1, match.pair1.player2].forEach(playerName => {
          if (winner === 'pair1') {
            stats[playerName].gamesWon += 1;
          }
        });

        [match.pair2.player1, match.pair2.player2].forEach(playerName => {
          if (winner === 'pair2') {
            stats[playerName].gamesWon += 1;
          }
        });
      });

      // Calcular rachas de victorias para cada jugador
      players.forEach(playerName => {
        const playerMatches = matches.filter(match => {
          const playersInGame = [
            match.pair1.player1,
            match.pair1.player2,
            match.pair2.player1,
            match.pair2.player2
          ];
          return playersInGame.includes(playerName);
        });

        const { consecutiveWins, maxConsecutiveWins } = calculateConsecutiveWins(playerMatches, playerName);
        stats[playerName].winStreak = consecutiveWins;
        stats[playerName].longestStreak = maxConsecutiveWins;

        // Finalizar estadísticas para cada jugador
        stats[playerName].partners = [...stats[playerName].partners];
        stats[playerName].efficiency = stats[playerName].gamesPlayed > 0
          ? (stats[playerName].gamesWon / stats[playerName].gamesPlayed) * 100
          : 0;
      });

      setPlayerStats(stats);
    };

    fetchResults();
  }, []); // No es necesario incluir fetchResults en las dependencias

  const getAchievementStatus = (playerName, statType, thresholds) => {
    let value;
    if (statType === 'efficiency') {
      value = playerStats[playerName]?.efficiency || 0;
    } else if (statType === 'partners') {
      value = playerStats[playerName]?.partners?.length || 0;
    } else {
      value = playerStats[playerName]?.[statType] || 0;
    }
    let unlocked = 0;

    // Para la insignia de eficiencia, verificar si el jugador ha jugado al menos 5 partidos
    if (statType === 'efficiency' && playerStats[playerName]?.gamesPlayed < 5) {
      return { unlocked: 0, value, currentLevelName: null, nextLevelName: null, nextThreshold: null, notEligible: true };
    }

    thresholds.forEach((threshold, index) => {
      if (value >= threshold) unlocked = index + 1;
    });

    const levelNames = ['Bronce', 'Plata', 'Oro'];
    const currentLevelName = unlocked > 0 ? levelNames[unlocked - 1] : null;
    const nextLevelName = unlocked < thresholds.length ? levelNames[unlocked] : null;
    const nextThreshold = thresholds[unlocked] || thresholds[thresholds.length - 1];

    return { unlocked, value, currentLevelName, nextLevelName, nextThreshold, notEligible: false };
  };

  const achievements = {
    gamesPlayed: [10, 25, 50],
    gamesWon: [10, 20, 30],
    partners: [2, 3, 4],
    efficiency: [50, 70, 90],
    longestStreak: [3, 5, 10],
  };

  const achievementDetails = {
    gamesPlayed: {
      name: 'Partidas Jugadas',
      description: 'Se otorgan por el número total de partidas jugadas.',
      icon: <SportsTennisIcon sx={{ fontSize: '40px' }} />,
    },
    gamesWon: {
      name: 'Partidas Ganadas',
      description: 'Se otorgan por el número total de partidas ganadas.',
      icon: <EmojiEventsIcon sx={{ fontSize: '40px' }} />,
    },
    partners: {
      name: 'Versátil',
      description: 'Por haber jugado con diferentes compañeros de pareja.',
      icon: <GroupIcon sx={{ fontSize: '40px' }} />,
    },
    efficiency: {
      name: 'Eficiencia',
      description: 'Porcentaje de victorias sobre el total de partidas jugadas.',
      icon: <ShowChartIcon sx={{ fontSize: '40px' }} />,
    },
    longestStreak: {
      name: 'Racha Ganadora',
      description: 'Por mantener una racha de victorias consecutivas.',
      icon: <WhatshotIcon sx={{ fontSize: '40px' }} />,
    },
  };

  const getBadgeColor = (level) => {
    switch (level) {
      case 1:
        return '#cd7f32'; // Bronce
      case 2:
        return '#c0c0c0'; // Plata
      case 3:
        return '#ffd700'; // Oro
      default:
        return 'grey'; // No desbloqueado
    }
  };

  return (
    <Container>
      {/* Encabezado con fondo negro solo alrededor del título */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px'  }}>
        <Typography variant="h5">Insignias</Typography>
      </Box>

      {/* Texto debajo del título */}
      <Box sx={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
        <Typography variant="body1">¡Consulta tus logros desbloqueados!</Typography>
      </Box>

      <Grid container spacing={2}>
        {players.map(playerName => (
          <Grid item xs={12} key={playerName}>
            <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
              <Typography variant="h6">{playerName}</Typography>
            </Box>

            <Grid container spacing={2} justifyContent="center">
              {Object.keys(achievements).map(achievement => {
                const { unlocked, value, currentLevelName, nextLevelName, nextThreshold, notEligible } = getAchievementStatus(playerName, achievement, achievements[achievement]);
                const totalLevels = achievements[achievement].length;
                const levelNames = ['Bronce', 'Plata', 'Oro'];

                let progressText = '';
                if (notEligible) {
                  progressText = 'Necesitas jugar al menos 5 partidos para desbloquear niveles en esta insignia.';
                } else {
                  // Para la insignia de Racha Ganadora
                  if (achievement === 'longestStreak') {
                    progressText = `Racha actual: ${playerStats[playerName]?.winStreak || 0}\nMayor racha conseguida: ${playerStats[playerName]?.longestStreak || 0}`;

                    if (unlocked === 0) {
                      progressText += `\nProgreso hacia Bronce: ${Math.min(Math.round(value), achievements[achievement][0])}/${achievements[achievement][0]}`;
                    } else if (unlocked < totalLevels) {
                      progressText = `Nivel ${currentLevelName} conseguido.\n` + progressText;
                      progressText += `\nProgreso hacia ${nextLevelName}: ${Math.min(Math.round(value), nextThreshold)}/${nextThreshold}`;
                    } else {
                      progressText = `Has alcanzado el nivel máximo (${levelNames[unlocked - 1]}) en esta insignia. ¡Felicidades!\n` + progressText;
                    }
                  } else {
                    // Para otras insignias
                    if (unlocked === 0) {
                      progressText = `Progreso hacia Bronce: ${Math.min(Math.round(value), achievements[achievement][0])}/${achievements[achievement][0]}`;
                    } else if (unlocked < totalLevels) {
                      progressText = `Nivel ${currentLevelName} conseguido.\nProgreso hacia ${nextLevelName}: ${Math.min(Math.round(value), nextThreshold)}/${nextThreshold}`;
                    } else {
                      progressText = `Has alcanzado el nivel máximo (${levelNames[unlocked - 1]}) en esta insignia. ¡Felicidades!`;
                    }
                  }
                }

                return (
                  <Grid item xs={6} sm={4} md={2} key={achievement}>
                    <Tooltip
                      title={
                        <div>
                          <Typography variant="body2"><strong>{achievementDetails[achievement].name}</strong></Typography>
                          <Typography variant="body2">{achievementDetails[achievement].description}</Typography>
                          <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{progressText}</Typography>
                        </div>
                      }
                      placement="top"
                      enterTouchDelay={50}
                      leaveTouchDelay={3000}
                    >
                      <div style={{ textAlign: 'center', color: getBadgeColor(unlocked), cursor: 'pointer' }}>
                        {React.cloneElement(achievementDetails[achievement].icon, { sx: { fontSize: '40px', color: notEligible ? 'grey' : getBadgeColor(unlocked) } })}
                        <Typography variant="body2" sx={{ marginTop: '5px', color: 'black' }}>
                          {achievementDetails[achievement].name}
                        </Typography>
                      </div>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        ))}
      </Grid>

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
          onClick={() => navigate('/')}
        >
          Volver a la pantalla principal
        </Button>
      </Box>
    </Container>
  );
};

export default Insignias;