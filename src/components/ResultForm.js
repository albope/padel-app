import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Grid, Select, MenuItem, InputLabel, FormControl, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Importa serverTimestamp para guardar la fecha de creación
import DeleteIcon from '@mui/icons-material/Delete'; // Importa el icono de eliminar

const players = ["Lucas", "Ricardo", "Martin", "Bort", "Invitado"];
const locations = ["Passing Padel", "Elite Padel 22", "Flow Padel", "Aspresso k7", "Otro"];

const ResultForm = () => {
  const [pair1, setPair1] = useState({ player1: '', player2: '' });
  const [pair2, setPair2] = useState({ player1: '', player2: '' });
  const [sets, setSets] = useState([{ pair1Score: '', pair2Score: '' }, { pair1Score: '', pair2Score: '' }]);
  const [showThirdSet, setShowThirdSet] = useState(false);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [addedBy, setAddedBy] = useState(localStorage.getItem('addedBy') || ''); // Obtener el nombre de localStorage

  const navigate = useNavigate();

  const handleSetChange = (index, pair, value) => {
    const updatedSets = [...sets];
    updatedSets[index][pair] = value;
    setSets(updatedSets);
  };

  const handleSubmit = async () => {
    if (!addedBy) {
      alert("Por favor ingrese su nombre.");
      return;
    }

    try {
      await addDoc(collection(db, "results"), {
        pair1,
        pair2,
        sets,
        date,
        location,
        addedBy, // Guardar el nombre del usuario
        createdAt: serverTimestamp(), // Guardar la fecha de creación automáticamente
      });
      localStorage.setItem('addedBy', addedBy); // Guardar el nombre en localStorage para futuras visitas
      navigate('/');
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
    }
  };

  // Función para añadir un tercer set
  const addThirdSet = () => {
    if (!showThirdSet) {
      setShowThirdSet(true);
      setSets([...sets, { pair1Score: '', pair2Score: '' }]);
    }
  };

  // Función para eliminar el tercer set
  const removeThirdSet = () => {
    if (showThirdSet) {
      setShowThirdSet(false);
      setSets(sets.slice(0, 2)); // Elimina el tercer set
    }
  };

  // Función para manejar el cambio de selección de jugadores
  const handlePlayerChange = (pair, playerKey, value) => {
    if (pair === 'pair1') {
      setPair1({ ...pair1, [playerKey]: value });
    } else {
      setPair2({ ...pair2, [playerKey]: value });
    }
  };

  // Filtrar jugadores disponibles para evitar la selección del mismo jugador en la misma pareja y entre ambas parejas
  const filterAvailablePlayers = (selectedPlayer, currentPlayer, otherPairPlayers) => {
    return players.filter((player) =>
      player !== selectedPlayer &&
      !otherPairPlayers.includes(player) ||
      player === currentPlayer
    );
  };

  return (
    <Container>
      {/* Encabezado */}
      <Box
        sx={{
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginTop: '20px',
        }}
      >
        <Typography variant="h5">Agregar Resultado</Typography>
      </Box>

      {/* Formulario de las parejas */}
      <Grid container spacing={2} style={{ marginTop: '20px' }}>
        {/* Pareja 1 - Jugador 1 */}
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel
              id="pair1-player1-label"
              sx={{ fontSize: '0.800rem' }} // Reducir tamaño de fuente
            >
              Pareja 1 - Jugador 1
            </InputLabel>
            <Select
              labelId="pair1-player1-label"
              value={pair1.player1}
              onChange={(e) => handlePlayerChange('pair1', 'player1', e.target.value)}
              fullWidth
              label="Pareja 1 - Jugador 1"
            >
              {filterAvailablePlayers(pair1.player2, pair1.player1, [pair2.player1, pair2.player2]).map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Pareja 1 - Jugador 2 */}
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel
              id="pair1-player2-label"
              sx={{ fontSize: '0.800rem' }} // Reducir tamaño de fuente
            >
              Pareja 1 - Jugador 2
            </InputLabel>
            <Select
              labelId="pair1-player2-label"
              value={pair1.player2}
              onChange={(e) => handlePlayerChange('pair1', 'player2', e.target.value)}
              fullWidth
              label="Pareja 1 - Jugador 2"
            >
              {filterAvailablePlayers(pair1.player1, pair1.player2, [pair2.player1, pair2.player2]).map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Pareja 2 - Jugador 1 */}
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel
              id="pair2-player1-label"
              sx={{ fontSize: '0.800rem' }} // Reducir tamaño de fuente
            >
              Pareja 2 - Jugador 1
            </InputLabel>
            <Select
              labelId="pair2-player1-label"
              value={pair2.player1}
              onChange={(e) => handlePlayerChange('pair2', 'player1', e.target.value)}
              fullWidth
              label="Pareja 2 - Jugador 1"
            >
              {filterAvailablePlayers(pair2.player2, pair2.player1, [pair1.player1, pair1.player2]).map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Pareja 2 - Jugador 2 */}
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel
              id="pair2-player2-label"
              sx={{ fontSize: '0.800rem' }} // Reducir tamaño de fuente
            >
              Pareja 2 - Jugador 2
            </InputLabel>
            <Select
              labelId="pair2-player2-label"
              value={pair2.player2}
              onChange={(e) => handlePlayerChange('pair2', 'player2', e.target.value)}
              fullWidth
              label="Pareja 2 - Jugador 2"
            >
              {filterAvailablePlayers(pair2.player1, pair2.player2, [pair1.player1, pair1.player2]).map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Fecha y lugar */}
      <Grid container spacing={2} style={{ marginTop: '20px' }}>
        <Grid item xs={6}>
          <TextField
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            style={{ marginTop: '16px' }}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginTop: '16px' }}>
            <InputLabel
              id="location-label"
              sx={{ fontSize: '0.875rem' }} // Reducir tamaño de fuente
            >
              Lugar
            </InputLabel>
            <Select
              labelId="location-label"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              label="Lugar"
            >
              {locations.map((place) => (
                <MenuItem key={place} value={place}>{place}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Nombre de quien añade el resultado */}
      <TextField
        label="Nombre de quien añade el resultado"
        value={addedBy}
        onChange={(e) => setAddedBy(e.target.value)} // Actualizar el nombre
        fullWidth
        sx={{ marginTop: '20px' }}
      />

      {/* Resultados de sets */}
      <Typography variant="h6" sx={{ marginTop: '30px', fontWeight: 'bold', color: 'black', textAlign: 'center' }}>
        Resultados de Sets
      </Typography>
      <Grid container spacing={2} style={{ marginBottom: '10px' }}>
        {sets.map((set, index) => (
          <React.Fragment key={index}>
            <Grid item xs={6}>
              <TextField
                label={`Set ${index + 1} - Pareja 1`}
                value={set.pair1Score}
                onChange={(e) => handleSetChange(index, 'pair1Score', e.target.value)}
                fullWidth
                inputProps={{ min: 0, max: 7, type: 'number' }} // Restringir entre 0 y 7
                autoComplete="off" // Desactivar autocompletado
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={`Set ${index + 1} - Pareja 2`}
                value={set.pair2Score}
                onChange={(e) => handleSetChange(index, 'pair2Score', e.target.value)}
                fullWidth
                inputProps={{ min: 0, max: 7, type: 'number' }} // Restringir entre 0 y 7
                autoComplete="off" // Desactivar autocompletado
              />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>

      {/* Botón para añadir tercer set */}
      {!showThirdSet && (
        <Box textAlign="center">
          <Button
            variant="contained"
            onClick={addThirdSet}
            sx={{ backgroundColor: 'black', color: '#FFFFFF', marginTop: '20px' }}
          >
            Añadir Tercer Set
          </Button>
        </Box>
      )}

      {/* Botón para eliminar el tercer set */}
      {showThirdSet && (
        <Box textAlign="center" display="flex" justifyContent="center" alignItems="center" sx={{ marginTop: '20px' }}>
          <Typography variant="body1" sx={{ marginRight: 1 }}>Tercer Set Añadido</Typography>
          <IconButton onClick={removeThirdSet} sx={{ color: 'red' }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}

      {/* Botones de acción */}
      <Grid container spacing={2} style={{ marginTop: '20px' }}>
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Guardar Resultado
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Volver a la página principal
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ResultForm;