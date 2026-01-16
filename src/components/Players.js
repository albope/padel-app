// Players.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  Button,
  Modal,
  Backdrop,
  Fade,
  useTheme,
  Slider,
  CircularProgress,
  Alert,
  Fab,
  alpha
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useNavigate } from 'react-router-dom';

// Theme tokens
import { tokens } from '../theme';
import dayjs from 'dayjs';
import Cropper from 'react-easy-crop';

// Context
import { useData } from '../context/DataContext';

// New components
import PlayerCard from './PlayerCard';
import PlayerComparison from './PlayerComparison';
import PlayerCardSkeleton from './skeletons/PlayerCardSkeleton';

const playersInfo = {
  Ricardo: { name: 'Ricardo', image: '/Ricardo.jpg', position: 'Revés', birthDate: '26/11/1994', height: '1.80 m', birthPlace: 'Madrid', country: 'ESP', flag: '/spain_flag.jpg' },
  Bort: { name: 'Bort', image: '/Alberto.jpg', position: 'Derecha', birthDate: '27/01/1994', height: '1.80 m', birthPlace: 'Valencia', country: 'ESP', flag: '/spain_flag.jpg' },
  Lucas: { name: 'Lucas', image: '/Lucas.jpg', position: 'Derecha', birthDate: '11/12/1992', height: '1.90 m', birthPlace: 'Valencia', country: 'GER', flag: '/germany_flag.jpg' },
  Martin: { name: 'Martin', image: '/Martin.jpg', position: 'Revés', birthDate: '18/02/1994', height: '1.84 m', birthPlace: 'Valencia', country: 'ESP', flag: '/spain_flag.jpg' },
};

// --- FUNCIONES DE CÁLCULO (sin cambios en su lógica interna) ---
const calculateRanking = (players) => {
  // Filtra jugadores sin gamesPlayed antes de ordenar para evitar errores con 'efficiency'
  const playablePlayers = players.filter(p => p.gamesPlayed && p.gamesPlayed > 0);
  const nonPlayablePlayers = players.filter(p => !p.gamesPlayed || p.gamesPlayed === 0);

  playablePlayers.sort((a, b) => {
    const efficiencyA = parseFloat(a.efficiency) || 0;
    const efficiencyB = parseFloat(b.efficiency) || 0;
    const gamesWonA = a.gamesWon || 0;
    const gamesWonB = b.gamesWon || 0;

    const efficiencyDiff = efficiencyB - efficiencyA;
    if (efficiencyDiff !== 0) return efficiencyDiff;
    return gamesWonB - gamesWonA;
  });
  return [...playablePlayers, ...nonPlayablePlayers]; // Mantener jugadores sin juegos al final
};

const calculatePairRanking = (pairs) => {
  const playablePairs = pairs.filter(p => p.gamesPlayed && p.gamesPlayed > 0);
  const nonPlayablePairs = pairs.filter(p => !p.gamesPlayed || p.gamesPlayed === 0);

  playablePairs.sort((a, b) => {
    const efficiencyA = parseFloat(a.efficiency) || 0;
    const efficiencyB = parseFloat(b.efficiency) || 0;
    const gamesWonA = a.gamesWon || 0;
    const gamesWonB = b.gamesWon || 0;

    const efficiencyDiff = efficiencyB - efficiencyA;
    if (efficiencyDiff !== 0) return efficiencyDiff;
    return gamesWonB - gamesWonA;
  });
  return [...playablePairs, ...nonPlayablePairs];
};
const normalizePairKey = (player1, player2) => [player1, player2].sort().join('-');

const calculateConsecutiveWins = (results, player) => {
  let consecutiveWins = 0;
  // let maxConsecutiveWins = 0; // No se usa para devolver la racha *actual*
  let lastGameWon = false;
  // Asegurar que 'results' es un array antes de ordenar
  const sortedResults = Array.isArray(results) ? [...results].sort((a, b) => dayjs(a.date).diff(dayjs(b.date))) : [];

  sortedResults.forEach((result) => {
    const { pair1, pair2, sets } = result;
    let playerWonCurrentGame = false;
    let pair1SetWins = 0;
    let pair2SetWins = 0;

    if (Array.isArray(sets)) {
      sets.forEach((set) => {
        if (parseInt(set.pair1Score, 10) > parseInt(set.pair2Score, 10)) pair1SetWins++;
        else if (parseInt(set.pair2Score, 10) > parseInt(set.pair1Score, 10)) pair2SetWins++;
      });
    }

    if ((pair1SetWins > pair2SetWins && (pair1.player1 === player || pair1.player2 === player)) ||
      (pair2SetWins > pair1SetWins && (pair2.player1 === player || pair2.player2 === player))) {
      playerWonCurrentGame = true;
    }

    if (playerWonCurrentGame) {
      consecutiveWins = lastGameWon ? consecutiveWins + 1 : 1;
      lastGameWon = true;
    } else {
      // Solo resetear si el jugador participó y no ganó, o si no participó
      const playersInGame = [pair1.player1, pair1.player2, pair2.player1, pair2.player2];
      if (playersInGame.includes(player)) {
        consecutiveWins = 0;
        lastGameWon = false;
      }
    }
    // maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins); // Si quisieras la racha más larga histórica
  });
  return consecutiveWins;
};
// --- FIN FUNCIONES DE CÁLCULO ---

// --- FUNCIONES DE IMAGEN (sin cambios en su lógica interna) ---
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
async function getCroppedImg(imageSrc, cropAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || !cropAreaPixels) return null; // Protección adicional
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const { x, y, width, height } = cropAreaPixels;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, x * scaleX, y * scaleY, width * scaleX, height * scaleY, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(null); return; } // Protección
      const fileReader = new FileReader();
      fileReader.onloadend = () => { resolve(fileReader.result); };
      fileReader.onerror = () => { resolve(null); }; // Protección
      fileReader.readAsDataURL(blob);
    }, 'image/jpeg', 1.0);
  });
}
async function scaleImage(dataURL, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width; let height = img.height;
      if (width > height) { if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; } }
      else { if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(null); // Protección
    img.src = dataURL;
  });
}
// --- FIN FUNCIONES DE IMAGEN ---


const Players = () => {
  // Usar datos del contexto global
  const { results: allResults, loading, error } = useData();

  const [playerStats, setPlayerStats] = useState({});
  const [pairStats, setPairStats] = useState({});
  const [openComparison, setOpenComparison] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const initialPlayerImages = useMemo(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('playerImages') : null;
    const parsed = stored ? JSON.parse(stored) : {};
    Object.keys(playersInfo).forEach(key => {
      if (!parsed[key]) {
        parsed[key] = playersInfo[key].image;
      }
    });
    return parsed;
  }, []);
  const [playerImages, setPlayerImages] = useState(initialPlayerImages);

  const [openModal, setOpenModal] = useState(false);
  const [selectedPlayerForImageChange, setSelectedPlayerForImageChange] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [statsCalculated, setStatsCalculated] = useState(false);

  const calculateAllStats = useCallback((currentResults) => {
    if (!currentResults || currentResults.length === 0) {
      setPlayerStats({}); setPairStats({}); setStatsCalculated(true); return;
    }
    const stats = {}; const pStats = {};
    Object.keys(playersInfo).forEach(pKey => {
      stats[pKey] = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, consecutiveWins: 0, efficiency: 0 };
    });
    currentResults.forEach(result => {
      const { pair1, pair2, sets } = result;
      if (!pair1 || !pair2 || !sets) return;
      const matchPlayers = [pair1.player1, pair1.player2, pair2.player1, pair2.player2].filter(Boolean);
      matchPlayers.forEach(player => {
        if (stats[player]) stats[player].gamesPlayed += 1;
      });
      let pair1SetWins = 0; let pair2SetWins = 0;
      if (Array.isArray(sets)) {
        sets.forEach(set => {
          if (parseInt(set.pair1Score, 10) > parseInt(set.pair2Score, 10)) pair1SetWins++;
          else if (parseInt(set.pair2Score, 10) > parseInt(set.pair1Score, 10)) pair2SetWins++;
        });
      }
      const winnerPairObj = pair1SetWins > pair2SetWins ? pair1 : (pair2SetWins > pair1SetWins ? pair2 : null);
      const loserPairObj = winnerPairObj === pair1 ? pair2 : (winnerPairObj === pair2 ? pair1 : null);
      if (winnerPairObj) {
        [winnerPairObj.player1, winnerPairObj.player2].filter(Boolean).forEach(player => {
          if (stats[player]) stats[player].gamesWon += 1;
        });
      }
      if (loserPairObj) {
        [loserPairObj.player1, loserPairObj.player2].filter(Boolean).forEach(player => {
          if (stats[player]) stats[player].gamesLost += 1;
        });
      }
      if (pair1.player1 && pair1.player2) {
        const pairKey1 = normalizePairKey(pair1.player1, pair1.player2);
        if (!pStats[pairKey1]) pStats[pairKey1] = { gamesWon: 0, gamesPlayed: 0 };
        pStats[pairKey1].gamesPlayed += 1;
        if (pair1SetWins > pair2SetWins) pStats[pairKey1].gamesWon += 1;
      }
      if (pair2.player1 && pair2.player2) {
        const pairKey2 = normalizePairKey(pair2.player1, pair2.player2);
        if (!pStats[pairKey2]) pStats[pairKey2] = { gamesWon: 0, gamesPlayed: 0 };
        pStats[pairKey2].gamesPlayed += 1;
        if (pair2SetWins > pair1SetWins) pStats[pairKey2].gamesWon += 1;
      }
    });
    Object.keys(stats).forEach(player => {
      if (stats[player]) {
        const { gamesWon, gamesPlayed } = stats[player];
        stats[player].efficiency = gamesPlayed > 0 ? parseFloat(((gamesWon / gamesPlayed) * 100).toFixed(1)) : 0;
        const playerSpecificResults = currentResults.filter(r =>
          (r.pair1.player1 === player || r.pair1.player2 === player || r.pair2.player1 === player || r.pair2.player2 === player)
        );
        stats[player].consecutiveWins = calculateConsecutiveWins(playerSpecificResults, player);
      }
    });
    Object.keys(pStats).forEach(pairKey => {
      const { gamesWon, gamesPlayed } = pStats[pairKey];
      pStats[pairKey].efficiency = gamesPlayed > 0 ? parseFloat(((gamesWon / gamesPlayed) * 100).toFixed(1)) : 0;
    });
    setPlayerStats(stats); setPairStats(pStats); setStatsCalculated(true);
  }, []);

  // Calcular stats cuando los datos esten disponibles
  useEffect(() => {
    if (!loading && allResults.length > 0 && !statsCalculated) {
      calculateAllStats(allResults);
    } else if (!loading && allResults.length === 0 && !statsCalculated) {
      setPlayerStats({}); setPairStats({}); setStatsCalculated(true);
    }
  }, [allResults, calculateAllStats, loading, statsCalculated]);

  useEffect(() => {
    localStorage.setItem('playerImages', JSON.stringify(playerImages));
  }, [playerImages]);

  const rankedPlayers = useMemo(() => calculateRanking(
    Object.keys(playerStats)
      .filter(key => playersInfo[key] && playerStats[key]) // Asegurar que el jugador y sus stats existen
      .map(playerKey => ({
        ...playersInfo[playerKey],
        ...playerStats[playerKey],
        image: playerImages[playerKey] || playersInfo[playerKey].image,
      }))
  ), [playerStats, playerImages]);

  const rankedPairs = useMemo(() => calculatePairRanking(
    Object.keys(pairStats)
      .filter(key => pairStats[key]) // Asegurar que las stats de la pareja existen
      .map(pairKey => ({
        players: pairKey.split('-'),
        ...pairStats[pairKey],
      }))
  ), [pairStats]);

  const isPlayerTiedWithFirst = (player, firstPlayer) => {
    if (!firstPlayer || !player || !player.gamesPlayed) return false; // No marcar si no ha jugado
    return player.gamesWon === firstPlayer.gamesWon && parseFloat(player.efficiency) === parseFloat(firstPlayer.efficiency);
  };
  const isPairTiedWithFirst = (pair, firstPair) => {
    if (!firstPair || !pair || !pair.gamesPlayed) return false; // No marcar si no ha jugado
    return pair.gamesWon === firstPair.gamesWon && parseFloat(pair.efficiency) === parseFloat(firstPair.efficiency);
  };

  const handleImageEditClick = (playerKey) => {
    setSelectedPlayerForImageChange(playerKey);
    setImageSrc(playerImages[playerKey] || playersInfo[playerKey].image);
    setOpenModal(true);
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setImageSrc(reader.result); };
    reader.readAsDataURL(file);
  };
  const onCropComplete = useCallback((croppedArea, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);
  const handleConfirmImage = async () => {
    if (imageSrc && selectedPlayerForImageChange && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        const scaledImage = await scaleImage(croppedImage, 250, 250);
        if (scaledImage) {
          setPlayerImages(prev => ({ ...prev, [selectedPlayerForImageChange]: scaledImage }));
        } else { console.error("Error al escalar imagen"); }
      } else { console.error("Error al recortar imagen"); }
    }
    closeModal();
  };
  const handleCancelImage = () => closeModal();
  const handleRestoreDefault = () => {
    if (selectedPlayerForImageChange) {
      const defaultImage = playersInfo[selectedPlayerForImageChange].image;
      setPlayerImages(prev => ({ ...prev, [selectedPlayerForImageChange]: defaultImage }));
    }
  };
  const closeModal = () => {
    setOpenModal(false); setImageSrc(null); setSelectedPlayerForImageChange(null);
    setCroppedAreaPixels(null); setZoom(1); setCrop({ x: 0, y: 0 });
  };

  if (loading || !statsCalculated) {
    return (
      <Container sx={{ py: 3 }}>
        <Box
          sx={{
            mb: 4,
            textAlign: 'center',
            position: 'relative',
            py: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: tokens.typography.displayFont,
              letterSpacing: '0.1em',
              color: theme.palette.secondary.main,
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '3px',
                background: `linear-gradient(90deg, transparent 0%, ${theme.palette.secondary.main} 50%, transparent 100%)`,
              },
            }}
          >
            Fichas de Jugadores
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <PlayerCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }
  if (error) {
    return <Container sx={{ py: 4, textAlign: 'center' }}><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container sx={{ py: 3 }}>
      <Modal open={openModal} onClose={handleCancelImage} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={openModal}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: { xs: 2, sm: 3 }, textAlign: 'center', width: { xs: '90%', sm: 450 }, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.common.black, fontWeight: 'bold' }}>Editar Imagen de Perfil</Typography>
            <Box component="label" htmlFor="upload-image-file" sx={{ cursor: 'pointer', my: 1 }}>
              <Button variant="outlined" component="span" size="small" sx={{ color: theme.palette.common.black, borderColor: theme.palette.common.black }}>
                Cargar Nueva Imagen
              </Button>
              <input id="upload-image-file" type="file" accept="image/*" onChange={handleFileChange} hidden />
            </Box>
            <Box sx={{ position: 'relative', width: '100%', height: { xs: 200, sm: 300 }, mt: 1, mb: 1, bgcolor: theme.palette.grey[200], borderRadius: 1 }}>
              {imageSrc && (<Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />)}
              {!imageSrc && <Typography sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'text.secondary' }}>Vista previa</Typography>}
            </Box>
            {imageSrc && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 1.5 }}>
                <Typography variant="body2" sx={{ color: theme.palette.common.black }}>Zoom:</Typography>
                <Slider value={zoom} min={1} max={3} step={0.1} onChange={(e, newValue) => setZoom(newValue)} sx={{ flexGrow: 1, mx: 2, color: theme.palette.common.black }} size="small" />
              </Box>
            )}
            <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              <Grid item xs={6} sm="auto"> <Button fullWidth variant="outlined" onClick={handleRestoreDefault} size="small" sx={{ color: theme.palette.common.black, borderColor: theme.palette.common.black }}>Restaurar</Button></Grid>
              <Grid item xs={6} sm="auto"> <Button fullWidth variant="text" onClick={handleCancelImage} size="small" sx={{ color: theme.palette.grey[700] }}>Cancelar</Button></Grid>
              <Grid item xs={12} sm="auto"> <Button fullWidth variant="contained" sx={{ backgroundColor: theme.palette.common.black, color: theme.palette.common.white, '&:hover': { backgroundColor: theme.palette.grey[800] } }} onClick={handleConfirmImage} disabled={!imageSrc || !croppedAreaPixels} size="small">Aplicar</Button></Grid>
            </Grid>
          </Box>
        </Fade>
      </Modal>

      <Box
        sx={{
          mb: 4,
          textAlign: 'center',
          position: 'relative',
          py: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: tokens.typography.displayFont,
            letterSpacing: '0.1em',
            color: theme.palette.secondary.main,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '3px',
              background: `linear-gradient(90deg, transparent 0%, ${theme.palette.secondary.main} 50%, transparent 100%)`,
            },
          }}
        >
          Fichas de Jugadores
        </Typography>
      </Box>

      {/* Botón flotante para comparar jugadores */}
      <Fab
        color="primary"
        aria-label="comparar jugadores"
        onClick={() => setOpenComparison(true)}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 1000,
          backgroundColor: theme.palette.common.black,
          color: theme.palette.common.white,
          boxShadow: theme.shadows[6],
          '&:hover': {
            backgroundColor: theme.palette.grey[800],
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <CompareArrowsIcon />
      </Fab>

      {/* Modal de comparación */}
      <PlayerComparison
        open={openComparison}
        onClose={() => setOpenComparison(false)}
        playersInfo={playersInfo}
        playerStats={playerStats}
        playerImages={playerImages}
        allResults={allResults}
      />

      <Grid container spacing={3}>
        {Object.keys(playersInfo).map((playerKey, index) => {
          const player = playersInfo[playerKey];
          const stats = playerStats[playerKey] || { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, consecutiveWins: 0, efficiency: 0 };
          const rank = rankedPlayers.findIndex(p => p.name === player.name) + 1;

          return (
            <Grid item xs={12} sm={6} md={3} key={playerKey}>
              <PlayerCard
                player={player}
                playerKey={playerKey}
                stats={stats}
                image={playerImages[playerKey] || player.image}
                rank={rank}
                onImageEdit={handleImageEditClick}
                allResults={allResults}
              />
            </Grid>
          );
        })}
      </Grid>

      <Box
        sx={{
          my: 4,
          textAlign: 'center',
          position: 'relative',
          py: 2,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontFamily: tokens.typography.displayFont,
            letterSpacing: '0.08em',
            color: theme.palette.secondary.main,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '3px',
              background: `linear-gradient(90deg, transparent 0%, ${theme.palette.secondary.main} 50%, transparent 100%)`,
            },
          }}
        >
          Ranking Individual
        </Typography>
      </Box>
      {rankedPlayers.length === 0 ? (
        <Typography sx={{ textAlign: 'center', width: '100%', color: 'text.secondary', mb: 3 }}>No hay suficientes datos para el ranking.</Typography>
      ) : (
        <Grid container spacing={1.5}> {/* Reducir spacing para ranking */}
          {rankedPlayers.map((player, index) => {
            const isFirst = index === 0;
            const tiedWithFirstCurrent = isPlayerTiedWithFirst(player, rankedPlayers[0]);
            return (
              <Grid item xs={12} key={`${player.name}-rank-${index}`}>
                <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, backgroundColor: (isFirst || tiedWithFirstCurrent) && player.gamesPlayed > 0 ? theme.palette.success.light + '30' : theme.palette.background.paper, borderLeft: (isFirst || tiedWithFirstCurrent) && player.gamesPlayed > 0 ? `5px solid ${theme.palette.success.main}` : `5px solid transparent` }}>
                  <Typography variant="h6" component="div" sx={{ width: 40, textAlign: 'center', fontWeight: 'bold', color: theme.palette.text.primary, mr: 1.5 }}>
                    {index + 1}°
                  </Typography>
                  <CardMedia component="img" sx={{ width: 45, height: 45, borderRadius: '50%', mr: 1.5, border: `2px solid ${theme.palette.success.main}` }} image={player.image} alt={player.name} />
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                      {player.name} {(isFirst || tiedWithFirstCurrent) && player.gamesPlayed > 0 && <EmojiEventsIcon sx={{ color: theme.palette.warning.main, verticalAlign: 'middle', ml: 0.5, fontSize: '1.2rem' }} />}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{playersInfo[player.name]?.country}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>{player.efficiency}%</Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{player.gamesWon} G / {player.gamesPlayed} J</Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Box
        sx={{
          my: 4,
          textAlign: 'center',
          position: 'relative',
          py: 2,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontFamily: tokens.typography.displayFont,
            letterSpacing: '0.08em',
            color: theme.palette.secondary.main,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: '3px',
              background: `linear-gradient(90deg, transparent 0%, ${theme.palette.secondary.main} 50%, transparent 100%)`,
            },
          }}
        >
          Ranking por Parejas
        </Typography>
      </Box>
      {rankedPairs.length === 0 ? (
        <Typography sx={{ textAlign: 'center', width: '100%', color: 'text.secondary', mb: 3 }}>No hay suficientes datos para el ranking de parejas.</Typography>
      ) : (
        <Grid container spacing={1.5}>
          {rankedPairs.map((pair, index) => {
            const isFirst = index === 0;
            const tiedWithFirstCurrent = isPairTiedWithFirst(pair, rankedPairs[0]);
            return (
              <Grid item xs={12} key={`pair-rank-${index}`}>
                <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, backgroundColor: (isFirst || tiedWithFirstCurrent) && pair.gamesPlayed > 0 ? theme.palette.success.light + '30' : theme.palette.background.paper, borderLeft: (isFirst || tiedWithFirstCurrent) && pair.gamesPlayed > 0 ? `5px solid ${theme.palette.success.main}` : `5px solid transparent` }}>
                  <Typography variant="h6" component="div" sx={{ width: 40, textAlign: 'center', fontWeight: 'bold', color: theme.palette.text.primary, mr: 1.5 }}>
                    {index + 1}°
                  </Typography>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                      {pair.players[0]} & {pair.players[1]} {(isFirst || tiedWithFirstCurrent) && pair.gamesPlayed > 0 && <EmojiEventsIcon sx={{ color: theme.palette.warning.main, verticalAlign: 'middle', ml: 0.5, fontSize: '1.2rem' }} />}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>{pair.efficiency}%</Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>{pair.gamesWon} G / {pair.gamesPlayed} J</Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default Players;