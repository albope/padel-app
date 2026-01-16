// PlayerComparison.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Grid,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const StatComparison = ({ label, value1, value2, isPercentage = false, higherIsBetter = true }) => {
  const theme = useTheme();
  const num1 = parseFloat(value1) || 0;
  const num2 = parseFloat(value2) || 0;

  const player1Better = higherIsBetter ? num1 > num2 : num1 < num2;
  const player2Better = higherIsBetter ? num2 > num1 : num2 < num1;

  const formatValue = (val) => (isPercentage ? `${val}%` : val);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: player1Better ? theme.palette.success.main : player2Better ? theme.palette.text.secondary : theme.palette.text.primary,
            }}
          >
            {formatValue(value1)}
          </Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Box sx={{ flex: 1, textAlign: 'left', pl: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: player2Better ? theme.palette.success.main : player1Better ? theme.palette.text.secondary : theme.palette.text.primary,
            }}
          >
            {formatValue(value2)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const PlayerComparison = ({ open, onClose, playersInfo, playerStats, playerImages, allResults = [] }) => {
  const theme = useTheme();
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');

  const availablePlayers = Object.keys(playersInfo).filter(
    (key) => playerStats[key] && playerStats[key].gamesPlayed > 0
  );

  // Calcular head-to-head
  const calculateHeadToHead = () => {
    if (!player1 || !player2) return { player1Wins: 0, player2Wins: 0, draws: 0 };

    let player1Wins = 0;
    let player2Wins = 0;
    let draws = 0;

    allResults.forEach((result) => {
      const { pair1, pair2: pair2Data, sets } = result;
      if (!pair1 || !pair2Data || !sets) return;

      const player1InPair1 = pair1.player1 === player1 || pair1.player2 === player1;
      const player2InPair1 = pair1.player1 === player2 || pair1.player2 === player2;
      const player1InPair2 = pair2Data.player1 === player1 || pair2Data.player2 === player1;
      const player2InPair2 = pair2Data.player1 === player2 || pair2Data.player2 === player2;

      // Verificar si ambos jugadores estuvieron en el partido
      const bothInMatch = (player1InPair1 || player1InPair2) && (player2InPair1 || player2InPair2);
      if (!bothInMatch) return;

      // Calcular ganador
      let pair1SetWins = 0;
      let pair2SetWins = 0;

      if (Array.isArray(sets)) {
        sets.forEach((set) => {
          if (parseInt(set.pair1Score, 10) > parseInt(set.pair2Score, 10)) pair1SetWins++;
          else if (parseInt(set.pair2Score, 10) > parseInt(set.pair1Score, 10)) pair2SetWins++;
        });
      }

      if (pair1SetWins > pair2SetWins) {
        if (player1InPair1) player1Wins++;
        else player2Wins++;
      } else if (pair2SetWins > pair1SetWins) {
        if (player1InPair2) player1Wins++;
        else player2Wins++;
      } else {
        draws++;
      }
    });

    return { player1Wins, player2Wins, draws };
  };

  const headToHead = calculateHeadToHead();
  const stats1 = playerStats[player1] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, efficiency: 0, consecutiveWins: 0 };
  const stats2 = playerStats[player2] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, efficiency: 0, consecutiveWins: 0 };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Comparar Jugadores
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Selectores de jugadores */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Jugador 1
                </Typography>
                <Select
                  value={player1}
                  onChange={(e) => setPlayer1(e.target.value)}
                  displayEmpty
                  size="small"
                >
                  <MenuItem value="" disabled>
                    Seleccionar jugador
                  </MenuItem>
                  {availablePlayers.map((key) => (
                    <MenuItem key={key} value={key} disabled={key === player2}>
                      {playersInfo[key].name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  Jugador 2
                </Typography>
                <Select
                  value={player2}
                  onChange={(e) => setPlayer2(e.target.value)}
                  displayEmpty
                  size="small"
                >
                  <MenuItem value="" disabled>
                    Seleccionar jugador
                  </MenuItem>
                  {availablePlayers.map((key) => (
                    <MenuItem key={key} value={key} disabled={key === player1}>
                      {playersInfo[key].name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {player1 && player2 ? (
          <>
            {/* Cabeceras de jugadores */}
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Avatar
                  src={playerImages[player1] || playersInfo[player1].image}
                  alt={playersInfo[player1].name}
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 1, border: `3px solid ${theme.palette.primary.main}` }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {playersInfo[player1].name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                  <Box component="img" src={playersInfo[player1].flag} alt="flag" sx={{ height: 16, mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {playersInfo[player1].position}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Avatar
                  src={playerImages[player2] || playersInfo[player2].image}
                  alt={playersInfo[player2].name}
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 1, border: `3px solid ${theme.palette.secondary.main}` }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {playersInfo[player2].name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
                  <Box component="img" src={playersInfo[player2].flag} alt="flag" sx={{ height: 16, mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {playersInfo[player2].position}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Head to Head */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.background.dark || 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${theme.palette.success.main}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1.5, color: theme.palette.text.primary }}>
                Enfrentamientos Directos
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    {headToHead.player1Wins}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Victorias
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mx: 2, color: theme.palette.success.main }}>
                  VS
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {headToHead.player2Wins}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Victorias
                  </Typography>
                </Box>
              </Box>
              {headToHead.draws > 0 && (
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: theme.palette.text.secondary }}>
                  Empates: {headToHead.draws}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Comparación de estadísticas */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
              Estadísticas Generales
            </Typography>

            <StatComparison
              label="Eficiencia"
              value1={stats1.efficiency}
              value2={stats2.efficiency}
              isPercentage={true}
              higherIsBetter={true}
            />

            <StatComparison
              label="Partidos Ganados"
              value1={stats1.gamesWon}
              value2={stats2.gamesWon}
              higherIsBetter={true}
            />

            <StatComparison
              label="Partidos Jugados"
              value1={stats1.gamesPlayed}
              value2={stats2.gamesPlayed}
              higherIsBetter={true}
            />

            <StatComparison
              label="Racha Actual"
              value1={stats1.consecutiveWins}
              value2={stats2.consecutiveWins}
              higherIsBetter={true}
            />

            <StatComparison
              label="Derrotas"
              value1={stats1.gamesLost}
              value2={stats2.gamesLost}
              higherIsBetter={false}
            />

            {/* Indicador de mejor jugador overall */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.background.dark || 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${theme.palette.success.main}`,
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, color: theme.palette.text.primary }}>
                Mejor Rendimiento General
              </Typography>
              {stats1.efficiency > stats2.efficiency ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {playersInfo[player1].name}
                  </Typography>
                </Box>
              ) : stats2.efficiency > stats1.efficiency ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {playersInfo[player2].name}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  Empate técnico
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Selecciona dos jugadores para comparar sus estadísticas
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlayerComparison;
