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

    const fetchResults = async () => {
      const querySnapshot = await getDocs(collection(db, "results"));
      const stats = {};

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const winner = getMatchWinner(data.sets);
        const playersInGame = [
          data.pair1.player1,
          data.pair1.player2,
          data.pair2.player1,
          data.pair2.player2
        ];

        playersInGame.forEach(playerName => {
          if (!stats[playerName]) {
            stats[playerName] = {
              gamesPlayed: 0,
              gamesWon: 0,
              partners: new Set(),
              efficiency: 0,
              winStreak: 0,
              longestStreak: 0,
              lastGameWon: false
            };
          }
          stats[playerName].gamesPlayed += 1;

          // Actualizar compañeros
          if (data.pair1.player1 === playerName) {
            stats[playerName].partners.add(data.pair1.player2);
          } else if (data.pair1.player2 === playerName) {
            stats[playerName].partners.add(data.pair1.player1);
          } else if (data.pair2.player1 === playerName) {
            stats[playerName].partners.add(data.pair2.player2);
          } else if (data.pair2.player2 === playerName) {
            stats[playerName].partners.add(data.pair2.player1);
          }

          // Actualizar victorias y rachas
          const playerPair = (data.pair1.player1 === playerName || data.pair1.player2 === playerName) ? 'pair1' : 'pair2';
          if (playerPair === winner) {
            stats[playerName].gamesWon += 1;
            if (stats[playerName].lastGameWon) {
              stats[playerName].winStreak += 1;
            } else {
              stats[playerName].winStreak = 1;
            }
            stats[playerName].longestStreak = Math.max(stats[playerName].longestStreak, stats[playerName].winStreak);
            stats[playerName].lastGameWon = true;
          } else {
            stats[playerName].winStreak = 0;
            stats[playerName].lastGameWon = false;
          }
        });
      });

      Object.keys(stats).forEach(playerName => {
        stats[playerName].partners = [...stats[playerName].partners];
        stats[playerName].efficiency = stats[playerName].gamesPlayed > 0 ? (stats[playerName].gamesWon / stats[playerName].gamesPlayed) * 100 : 0;
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
                  progressText = unlocked < totalLevels
                    ? `${currentLevelName ? `Nivel ${currentLevelName} conseguido. ` : ''}Progreso hacia ${nextLevelName}: ${Math.min(Math.round(value), nextThreshold)}/${nextThreshold}`
                    : `Has alcanzado el nivel máximo (${levelNames[unlocked - 1]}) en esta insignia. ¡Felicidades!`;
                }

                return (
                  <Grid item xs={3} key={achievement}>
                    <Tooltip
                      title={
                        <div>
                          <Typography variant="body2"><strong>{achievementDetails[achievement].name}</strong></Typography>
                          <Typography variant="body2">{achievementDetails[achievement].description}</Typography>
                          <Typography variant="body2">{progressText}</Typography>
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