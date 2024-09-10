import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Grid, Select, MenuItem, InputLabel, FormControl, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";
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

  const navigate = useNavigate();

  const handleSetChange = (index, pair, value) => {
    const updatedSets = [...sets];
    updatedSets[index][pair] = value;
    setSets(updatedSets);
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "results"), {
        pair1,
        pair2,
        sets,
        date,
        location,
      });
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
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel shrink={true}>Pareja 1 - Jugador 1</InputLabel>
            <Select
              value={pair1.player1}
              onChange={(e) => setPair1({ ...pair1, player1: e.target.value })}
              fullWidth
            >
              {players.map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel shrink={true}>Pareja 1 - Jugador 2</InputLabel>
            <Select
              value={pair1.player2}
              onChange={(e) => setPair1({ ...pair1, player2: e.target.value })}
              fullWidth
            >
              {players.map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Pareja 2 */}
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel shrink={true}>Pareja 2 - Jugador 1</InputLabel>
            <Select
              value={pair2.player1}
              onChange={(e) => setPair2({ ...pair2, player1: e.target.value })}
              fullWidth
            >
              {players.map((player) => (
                <MenuItem key={player} value={player}>{player}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel shrink={true}>Pareja 2 - Jugador 2</InputLabel>
            <Select
              value={pair2.player2}
              onChange={(e) => setPair2({ ...pair2, player2: e.target.value })}
              fullWidth
            >
              {players.map((player) => (
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
            <InputLabel shrink={true}>Lugar</InputLabel>
            <Select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
            >
              {locations.map((place) => (
                <MenuItem key={place} value={place}>{place}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

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
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={`Set ${index + 1} - Pareja 2`}
                value={set.pair2Score}
                onChange={(e) => handleSetChange(index, 'pair2Score', e.target.value)}
                fullWidth
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
            sx={{ backgroundColor: '#800080', color: '#FFFFFF', marginTop: '20px' }}
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