// src/components/Players.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  useTheme,
  Paper,
  Slider,
  Alert,
  Skeleton,
  Avatar,
  Divider
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  ArrowDropDown as ArrowDropDownIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
  SportsTennis as SportsTennisIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Cropper from 'react-easy-crop';

// Importamos el Hook para datos centralizados
import { usePadelResults } from '../hooks/usePadelResults';

// --- DATOS ESTÁTICOS ---
const playersInfo = {
  Ricardo: { name: 'Ricardo', image: '/Ricardo.jpg', position: 'Revés', birthDate: '26/11/1994', height: '1.80 m', birthPlace: 'Madrid', country: 'ESP', flag: '/spain_flag.jpg' },
  Bort: { name: 'Bort', image: '/Alberto.jpg', position: 'Derecha', birthDate: '27/01/1994', height: '1.80 m', birthPlace: 'Valencia', country: 'ESP', flag: '/spain_flag.jpg' },
  Lucas: { name: 'Lucas', image: '/Lucas.jpg', position: 'Derecha', birthDate: '11/12/1992', height: '1.90 m', birthPlace: 'Valencia', country: 'GER', flag: '/germany_flag.jpg' },
  Martin: { name: 'Martin', image: '/Martin.jpg', position: 'Revés', birthDate: '18/02/1994', height: '1.84 m', birthPlace: 'Valencia', country: 'ESP', flag: '/spain_flag.jpg' },
};

// --- FUNCIONES DE AYUDA ---
const normalizePairKey = (player1, player2) => [player1, player2].sort().join(' & ');

const calculateConsecutiveWins = (results, player) => {
  const sortedResults = [...results].sort((a, b) => a.date - b.date);
  let consecutiveWins = 0;
  let lastGameWon = false;

  sortedResults.forEach((result) => {
    const { pair1, pair2, sets } = result;
    if (!sets) return;

    let pair1Wins = 0;
    let pair2Wins = 0;
    sets.forEach(s => {
       if(parseInt(s.pair1Score) > parseInt(s.pair2Score)) pair1Wins++;
       else if(parseInt(s.pair2Score) > parseInt(s.pair1Score)) pair2Wins++;
    });

    let playerWonCurrentGame = false;
    const isP1 = pair1.player1 === player || pair1.player2 === player;
    const isP2 = pair2.player1 === player || pair2.player2 === player;

    if (isP1 && pair1Wins > pair2Wins) playerWonCurrentGame = true;
    if (isP2 && pair2Wins > pair1Wins) playerWonCurrentGame = true;

    if (playerWonCurrentGame) {
      consecutiveWins = lastGameWon ? consecutiveWins + 1 : 1;
      lastGameWon = true;
    } else if (isP1 || isP2) {
      consecutiveWins = 0;
      lastGameWon = false;
    }
  });
  return consecutiveWins;
};

// --- FUNCIONES DE IMAGEN ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        resolve(reader.result);
      };
    }, 'image/jpeg');
  });
};

// --- COMPONENTE PRINCIPAL ---
const Players = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedPlayerKey, setSelectedPlayerKey] = useState(null);
  
  const { results, loading, error } = usePadelResults();

  const [playerImages, setPlayerImages] = useState(() => {
    const stored = localStorage.getItem('playerImages');
    const parsed = stored ? JSON.parse(stored) : {};
    Object.keys(playersInfo).forEach(k => { if (!parsed[k]) parsed[k] = playersInfo[k].image; });
    return parsed;
  });
  
  const [openModal, setOpenModal] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    localStorage.setItem('playerImages', JSON.stringify(playerImages));
  }, [playerImages]);

  // --- CÁLCULO DE ESTADÍSTICAS ---
  const { calculatedStats, calculatedPairStats } = useMemo(() => {
    if (loading || !results.length) return { calculatedStats: {}, calculatedPairStats: {} };

    const pStats = {};
    const pairStats = {};

    Object.keys(playersInfo).forEach(key => {
        pStats[key] = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, consecutiveWins: 0, efficiency: 0 };
    });

    results.forEach(result => {
        const { pair1, pair2, sets } = result;
        if (!sets) return;

        let p1Wins = 0, p2Wins = 0;
        sets.forEach(s => {
            if(parseInt(s.pair1Score) > parseInt(s.pair2Score)) p1Wins++;
            else if(parseInt(s.pair2Score) > parseInt(s.pair1Score)) p2Wins++;
        });

        const winnerPair = p1Wins > p2Wins ? 1 : (p2Wins > p1Wins ? 2 : 0);
        if(winnerPair === 0) return;

        const playersP1 = [pair1.player1, pair1.player2].filter(Boolean);
        const playersP2 = [pair2.player1, pair2.player2].filter(Boolean);

        playersP1.forEach(p => {
            if(pStats[p]) {
                pStats[p].gamesPlayed++;
                if(winnerPair === 1) pStats[p].gamesWon++; else pStats[p].gamesLost++;
            }
        });
        playersP2.forEach(p => {
            if(pStats[p]) {
                pStats[p].gamesPlayed++;
                if(winnerPair === 2) pStats[p].gamesWon++; else pStats[p].gamesLost++;
            }
        });

        if (pair1.player1 && pair1.player2) {
            const k = normalizePairKey(pair1.player1, pair1.player2);
            if (!pairStats[k]) pairStats[k] = { gamesPlayed: 0, gamesWon: 0 };
            pairStats[k].gamesPlayed++;
            if (winnerPair === 1) pairStats[k].gamesWon++;
        }
        if (pair2.player1 && pair2.player2) {
            const k = normalizePairKey(pair2.player1, pair2.player2);
            if (!pairStats[k]) pairStats[k] = { gamesPlayed: 0, gamesWon: 0 };
            pairStats[k].gamesPlayed++;
            if (winnerPair === 2) pairStats[k].gamesWon++;
        }
    });

    Object.keys(pStats).forEach(p => {
        const s = pStats[p];
        s.efficiency = s.gamesPlayed > 0 ? ((s.gamesWon / s.gamesPlayed) * 100).toFixed(1) : 0;
        s.consecutiveWins = calculateConsecutiveWins(results, p);
    });

    Object.keys(pairStats).forEach(k => {
        const s = pairStats[k];
        s.efficiency = s.gamesPlayed > 0 ? ((s.gamesWon / s.gamesPlayed) * 100).toFixed(1) : 0;
    });

    return { calculatedStats: pStats, calculatedPairStats: pairStats };
  }, [results, loading]);

  const rankedPlayers = useMemo(() => {
    return Object.keys(calculatedStats)
        .map(key => ({ ...playersInfo[key], ...calculatedStats[key], id: key }))
        .sort((a, b) => {
            const effDiff = parseFloat(b.efficiency) - parseFloat(a.efficiency);
            if (effDiff !== 0) return effDiff;
            return b.gamesWon - a.gamesWon;
        });
  }, [calculatedStats]);

  const rankedPairs = useMemo(() => {
    return Object.keys(calculatedPairStats)
        .map(key => ({ names: key, ...calculatedPairStats[key] }))
        .filter(p => p.gamesPlayed > 0)
        .sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency) || b.gamesWon - a.gamesWon);
  }, [calculatedPairStats]);


  // --- MANEJADORES DE IMAGEN ---
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result));
          reader.readAsDataURL(file);
      });
      setImgSrc(imageDataUrl);
    }
  };
  
  const showCropper = (playerKey, e) => {
      e.stopPropagation();
      setEditingPlayer(playerKey);
      setImgSrc(null);
      setOpenModal(true);
  };

  const closeCropper = () => {
      setOpenModal(false);
      setImgSrc(null);
      setEditingPlayer(null);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
      try {
          const croppedImage = await getCroppedImg(imgSrc, croppedAreaPixels);
          setPlayerImages(prev => ({ ...prev, [editingPlayer]: croppedImage }));
          closeCropper();
      } catch (e) {
          console.error(e);
      }
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: theme.palette.common.white,
    padding: theme.spacing(3),
    borderRadius: 3,
    marginBottom: theme.spacing(4),
    textAlign: 'center',
    boxShadow: '0px 8px 20px rgba(0,0,0,0.15)',
    position: 'relative'
  };

  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container sx={{ py: 3, pb: 8 }}>
        {/* HEADER */}
        <Paper elevation={0} sx={headerStyle}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Fichas de Jugadores
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Perfiles y Rankings
            </Typography>
        </Paper>

        {/* CARDS DE JUGADORES */}
        {loading ? (
            <Grid container spacing={3}>
                {[1,2,3,4].map(i => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        ) : (
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {Object.keys(playersInfo).map(key => {
                    const info = playersInfo[key];
                    const stats = calculatedStats[key] || {};
                    const isSelected = selectedPlayerKey === key;
                    
                    return (
                        <Grid item xs={12} sm={6} md={3} key={key}>
                            <Card 
                                onClick={() => setSelectedPlayerKey(isSelected ? null : key)}
                                elevation={isSelected ? 8 : 2}
                                sx={{ 
                                    height: '100%', borderRadius: 3, position: 'relative',
                                    transition: 'all 0.3s ease', cursor: 'pointer',
                                    transform: isSelected ? 'translateY(-8px)' : 'none',
                                    border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none'
                                }}
                            >
                                <Box sx={{ position: 'relative', pt: '100%' }}>
                                    <CardMedia 
                                        image={playerImages[key] || info.image} 
                                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                    />
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => showCropper(key, e)}
                                        sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover':{bgcolor:'black'} }}
                                    >
                                        <PhotoCameraIcon fontSize="small"/>
                                    </IconButton>
                                </Box>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={0.5}>
                                        <Typography variant="h6" fontWeight="bold">{info.name}</Typography>
                                        <img src={info.flag} alt="flag" style={{ width: 20, borderRadius: 2 }} />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={1}>{info.position}</Typography>
                                    
                                    {isSelected ? (
                                        <Fade in={true}>
                                            <Box sx={{ mt: 2, textAlign: 'left', bgcolor: theme.palette.action.hover, p: 1.5, borderRadius: 2 }}>
                                                <Typography variant="caption" display="block">🎂 {info.birthDate}</Typography>
                                                <Typography variant="caption" display="block">📏 {info.height}</Typography>
                                                <Typography variant="caption" display="block">📍 {info.birthPlace}</Typography>
                                                <Divider sx={{ my: 1 }} />
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" fontWeight="bold">Efic.:</Typography>
                                                    <Typography variant="caption" fontWeight="bold" color="primary">{stats.efficiency}%</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption">G / P:</Typography>
                                                    <Typography variant="caption">{stats.gamesWon} / {stats.gamesLost}</Typography>
                                                </Box>
                                            </Box>
                                        </Fade>
                                    ) : (
                                        <ArrowDropDownIcon color="action" />
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        )}

        {/* RANKINGS */}
        {!loading && (
            <Grid container spacing={4}>
                {/* Ranking Individual */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 3, height: '100%' }} elevation={3}>
                        <Typography variant="h6" fontWeight="bold" mb={2} display="flex" alignItems="center">
                            <EmojiEventsIcon sx={{ color: '#FFD700', mr: 1 }} /> Ranking Individual
                        </Typography>
                        {rankedPlayers.map((p, idx) => (
                            <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, p: 1, borderRadius: 2, bgcolor: idx === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent' }}>
                                <Typography fontWeight="bold" sx={{ width: 24, color: 'text.secondary' }}>{idx + 1}</Typography>
                                <Avatar src={playerImages[p.id] || p.image} sx={{ width: 32, height: 32, mr: 1.5 }} />
                                <Box flexGrow={1}>
                                    <Typography variant="body2" fontWeight="bold">{p.name}</Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="body2" fontWeight="bold" color="primary">{p.efficiency}%</Typography>
                                    <Typography variant="caption" color="text.secondary">{p.gamesWon}W - {p.gamesLost}L</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                {/* Ranking Parejas */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 3, height: '100%' }} elevation={3}>
                        <Typography variant="h6" fontWeight="bold" mb={2} display="flex" alignItems="center">
                            <SportsTennisIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} /> Ranking Parejas
                        </Typography>
                        {rankedPairs.length > 0 ? rankedPairs.slice(0, 5).map((p, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, p: 1, borderBottom: '1px solid #eee' }}>
                                <Typography fontWeight="bold" sx={{ width: 24, color: 'text.secondary' }}>{idx + 1}</Typography>
                                <Box flexGrow={1}>
                                    <Typography variant="body2" fontWeight="bold">{p.names}</Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="body2" fontWeight="bold" color="secondary">{p.efficiency}%</Typography>
                                    {/* CAMBIO AQUÍ: MOSTRAR G / J */}
                                    <Typography variant="caption" color="text.secondary">
                                        {p.gamesWon} G / {p.gamesPlayed} J
                                    </Typography>
                                </Box>
                            </Box>
                        )) : <Typography variant="body2" color="text.secondary">No hay datos suficientes.</Typography>}
                    </Paper>
                </Grid>
            </Grid>
        )}

        {/* MODAL CROPPER */}
        <Modal open={openModal} onClose={closeCropper}>
            <Box sx={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: { xs: '90%', sm: 400 }, bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 3 
            }}>
                <Typography variant="h6" mb={2}>Editar Foto de {editingPlayer}</Typography>
                
                {!imgSrc ? (
                    <Button variant="contained" component="label" fullWidth>
                        Subir Imagen
                        <input type="file" hidden accept="image/*" onChange={onFileChange} />
                    </Button>
                ) : (
                    <>
                        <Box sx={{ position: 'relative', height: 250, width: '100%', mb: 2, bgcolor: '#333' }}>
                            <Cropper image={imgSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
                        </Box>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Typography variant="caption">Zoom</Typography>
                            <Slider value={zoom} min={1} max={3} step={0.1} onChange={(e, v) => setZoom(v)} />
                        </Box>
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                            <Button onClick={closeCropper} color="inherit">Cancelar</Button>
                            <Button onClick={saveCroppedImage} variant="contained">Guardar</Button>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>

    </Container>
  );
};

export default Players;