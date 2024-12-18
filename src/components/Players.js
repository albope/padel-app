import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, CardMedia, Button, Modal, Backdrop, Fade, IconButton } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Cropper from 'react-easy-crop';

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

const calculateRanking = (players) => {
  return players.sort((a, b) => {
    const efficiencyDiff = parseFloat(b.efficiency) - parseFloat(a.efficiency);
    if (efficiencyDiff !== 0) {
      return efficiencyDiff;
    }
    return b.gamesWon - a.gamesWon;
  });
};

const calculatePairRanking = (pairs) => {
  return pairs.sort((a, b) => {
    const efficiencyDiff = parseFloat(b.efficiency) - parseFloat(a.efficiency);
    if (efficiencyDiff !== 0) {
      return efficiencyDiff;
    }
    return b.gamesWon - a.gamesWon;
  });
};

const normalizePairKey = (player1, player2) => {
  return [player1, player2].sort().join('-');
};

const calculateConsecutiveWins = (results, player) => {
  let consecutiveWins = 0;
  let maxConsecutiveWins = 0;
  let lastGameWon = false;

  const sortedResults = results.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

  sortedResults.forEach((result) => {
    const { pair1, pair2, sets } = result;
    let playerWon = false;

    let pair1Wins = 0;
    let pair2Wins = 0;

    sets.forEach((set) => {
      if (set.pair1Score > set.pair2Score) {
        pair1Wins += 1;
      } else {
        pair2Wins += 1;
      }
    });

    if (
      (pair1Wins > pair2Wins && (pair1.player1 === player || pair1.player2 === player)) ||
      (pair2Wins > pair1Wins && (pair2.player1 === player || pair2.player2 === player))
    ) {
      playerWon = true;
    }

    if (playerWon) {
      if (lastGameWon) {
        consecutiveWins += 1;
      } else {
        consecutiveWins = 1;
      }
      lastGameWon = true;
    } else {
      consecutiveWins = 0;
      lastGameWon = false;
    }

    maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
  });

  return consecutiveWins;
};

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

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const { x, y, width, height } = cropAreaPixels;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    x * scaleX,
    y * scaleY,
    width * scaleX,
    height * scaleY,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        resolve(fileReader.result);
      };
      fileReader.readAsDataURL(blob);
    }, 'image/jpeg', 1.0);
  });
}

async function scaleImage(dataURL, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const scaledDataURL = canvas.toDataURL('image/jpeg', 1.0);
      resolve(scaledDataURL);
    };
    img.src = dataURL;
  });
}

const Players = () => {
  const [results, setResults] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [pairStats, setPairStats] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

  const storedImages = typeof window !== 'undefined' ? localStorage.getItem('playerImages') : null;
  const initialPlayerImages = storedImages ? JSON.parse(storedImages) : {};

  Object.keys(playersInfo).forEach(key => {
    if (!initialPlayerImages[key]) {
      initialPlayerImages[key] = playersInfo[key].image;
    }
  });

  const [playerImages, setPlayerImages] = useState(initialPlayerImages);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPlayerForImage, setSelectedPlayerForImage] = useState(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      const querySnapshot = await getDocs(collection(db, "results"));
      const fetchedResults = querySnapshot.docs.map(doc => doc.data());
      const validResults = fetchedResults.filter(result => result.date);

      setResults(validResults);
      calculateStats(validResults);
    };

    fetchResults();
  }, []);

  useEffect(() => {
    localStorage.setItem('playerImages', JSON.stringify(playerImages));
  }, [playerImages]);

  const calculateStats = (results) => {
    const stats = {};
    const pStats = {};
  
    results.forEach(result => {
      const { pair1, pair2, sets } = result;
  
      [pair1.player1, pair1.player2, pair2.player1, pair2.player2].forEach(player => {
        if (!stats[player]) {
          stats[player] = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, consecutiveWins: 0, efficiency: 0 };
        }
        stats[player].gamesPlayed += 1;
      });
  
      let pair1Wins = 0;
      let pair2Wins = 0;
  
      sets.forEach(set => {
        if (set.pair1Score > set.pair2Score) {
          pair1Wins += 1;
        } else {
          pair2Wins += 1;
        }
      });
  
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
  
      const pairKey1 = normalizePairKey(pair1.player1, pair1.player2);
      const pairKey2 = normalizePairKey(pair2.player1, pair2.player2);
  
      if (!pStats[pairKey1]) {
        pStats[pairKey1] = { gamesWon: 0, gamesPlayed: 0 };
      }
      if (!pStats[pairKey2]) {
        pStats[pairKey2] = { gamesWon: 0, gamesPlayed: 0 };
      }
  
      pStats[pairKey1].gamesPlayed += 1;
      pStats[pairKey2].gamesPlayed += 1;
  
      if (pair1Wins > pair2Wins) {
        pStats[pairKey1].gamesWon += 1;
      } else {
        pStats[pairKey2].gamesWon += 1;
      }
    });
  
    Object.keys(stats).forEach(player => {
      const { gamesWon, gamesPlayed } = stats[player];
      stats[player].efficiency = ((gamesWon / gamesPlayed) * 100).toFixed(2);
      stats[player].consecutiveWins = calculateConsecutiveWins(results, player);
    });
  
    Object.keys(pStats).forEach(pair => {
      const { gamesWon, gamesPlayed } = pStats[pair];
      pStats[pair].efficiency = ((gamesWon / gamesPlayed) * 100).toFixed(2);
    });
  
    setPlayerStats(stats);
    setPairStats(pStats);
  };
  
  const rankedPlayers = calculateRanking(
    Object.keys(playerStats).map(player => ({
      ...playersInfo[player],
      ...playerStats[player],
    }))
  ).filter(player => player.gamesPlayed > 0);

  const rankedPlayersWithCustomImages = rankedPlayers.map(p => ({
    ...p,
    image: playerImages[p.name] || p.image,
  }));

  const rankedPairs = calculatePairRanking(
    Object.keys(pairStats).map(pair => ({
      players: pair.split('-'),
      ...pairStats[pair],
    }))
  );

  const isPlayerTiedWithFirst = (player, firstPlayer) => {
    if (!firstPlayer) return false;
    return (
      player.gamesWon === firstPlayer.gamesWon &&
      parseFloat(player.efficiency) === parseFloat(firstPlayer.efficiency)
    );
  };

  const isPairTiedWithFirst = (pair, firstPair) => {
    if (!firstPair) return false;
    return (
      pair.gamesWon === firstPair.gamesWon &&
      parseFloat(pair.efficiency) === parseFloat(firstPair.efficiency)
    );
  };

  const handleImageClick = (e, playerKey) => {
    e.stopPropagation();
    setSelectedPlayerForImage(playerKey);
    setImageSrc(null);
    setOpenModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmImage = async () => {
    if (imageSrc && selectedPlayerForImage && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const scaledImage = await scaleImage(croppedImage, 300, 300);
      setPlayerImages(prev => ({
        ...prev,
        [selectedPlayerForImage]: scaledImage
      }));
    }
    closeModal();
  };

  const handleCancelImage = () => {
    closeModal();
  };

  const handleRestoreDefault = () => {
    if (selectedPlayerForImage) {
      const defaultImage = playersInfo[selectedPlayerForImage].image;
      setPlayerImages(prev => ({
        ...prev,
        [selectedPlayerForImage]: defaultImage
      }));
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setImageSrc(null);
    setSelectedPlayerForImage(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({x:0,y:0});
  };

  return (
    <Container>
      {/* Modal para cambiar la imagen y hacer crop */}
      <Modal
        open={openModal}
        onClose={handleCancelImage}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4, textAlign: 'center', width: 400, height: 550, display: 'flex', flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom>
              Selecciona una nueva imagen
            </Typography>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <Box sx={{ position: 'relative', width: '100%', flexGrow: 1, mt:2, minHeight:'200px' }}>
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} 
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{ containerStyle: { background: '#333', position: 'relative', width: '100%', height: '100%' } }}
                />
              )}
            </Box>
            {imageSrc && (
              <Box sx={{ mt:2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Typography variant="body2">Zoom:</Typography>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ flexGrow:1, marginLeft:10, marginRight:10 }}
                />
              </Box>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexWrap:'wrap' }}>
              <Button variant="contained" color="primary" onClick={handleConfirmImage} disabled={!imageSrc} sx={{ mb:1 }}>
                Confirmar
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleCancelImage} sx={{ mb:1 }}>
                Cancelar
              </Button>
              <Button variant="text" color="error" onClick={handleRestoreDefault} sx={{ mt:1 }}>
                Restaurar imagen por defecto
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Sección de Jugadores */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Jugadores</Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {Object.keys(playersInfo).map((key) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              onClick={() => {
                setSelectedPlayer(selectedPlayer?.name === playersInfo[key].name ? null : playersInfo[key]);
              }}
              sx={{
                position: 'relative',
                '&:hover': { boxShadow: 6, cursor: 'pointer' },
              }}
            >
              <Box sx={{ position:'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={playerImages[key] || playersInfo[key].image}
                  alt={playersInfo[key].name}
                  sx={{ 
                    cursor: 'pointer', 
                    objectFit: 'contain', // Ahora usamos 'contain' en vez de 'cover'
                    width: '100%',
                    height: 'auto'
                  }}
                  onClick={(e) => handleImageClick(e, key)}
                />
                {/* Icono de cámara */}
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                  }}
                  onClick={(e) => handleImageClick(e, key)}
                >
                  <PhotoCameraIcon fontSize="inherit" />
                </IconButton>
              </Box>
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

      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Ranking Individual</Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {rankedPlayersWithCustomImages.length === 0 ? (
          <Typography sx={{ textAlign: 'center', width: '100%' }}>
            No se han jugado partidos todavía
          </Typography>
        ) : (
          rankedPlayersWithCustomImages.map((player, index) => {
            const firstPlayer = rankedPlayersWithCustomImages[0];
            const tiedWithFirst = isPlayerTiedWithFirst(player, firstPlayer);

            return (
              <Grid item xs={12} key={`${player.name}-${index}`}>
                <Card
                  sx={{
                    backgroundColor: tiedWithFirst ? 'lightgreen' : 'transparent',
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
                      {player.name} {tiedWithFirst && <EmojiEventsIcon sx={{ color: 'gold', marginLeft: '5px' }} />}
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
            );
          })
        )}
      </Grid>

      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Ranking por Pareja</Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '20px' }}>
        {rankedPairs.length === 0 ? (
          <Typography sx={{ textAlign: 'center', width: '100%' }}>
            No se han jugado partidos todavía
          </Typography>
        ) : (
          rankedPairs.map((pair, index) => {
            const firstPair = rankedPairs[0];
            const tiedWithFirst = isPairTiedWithFirst(pair, firstPair);

            return (
              <Grid item xs={12} key={`${pair.players[0]}-${pair.players[1]}-${index}`}>
                <Card
                  sx={{
                    backgroundColor: tiedWithFirst ? 'lightgreen' : 'transparent',
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
                      {pair.players[0]} & {pair.players[1]} {tiedWithFirst && <EmojiEventsIcon sx={{ color: 'gold', marginLeft: '5px' }} />}
                    </Typography>
                    <Typography variant="body2">
                      {pair.gamesWon} partidos ganados | <span style={{ fontWeight: 'bold' }}>{pair.efficiency}%</span> eficacia
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
      
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