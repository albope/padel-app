import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Grid, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Para la navegación en React Router
import { db } from '../firebase'; // Subimos un nivel para acceder a firebase.js
import { collection, addDoc } from "firebase/firestore"; // Importa las funciones necesarias de Firestore

const players = ["Lucas", "Ricardo", "Martin", "Bort", "Invitado"];
const locations = ["Passing Padel", "Elite Padel 22", "Flow Padel", "Aspresso k7", "Otro"];

const ResultForm = () => {
  const [pair1, setPair1] = useState({ player1: '', player2: '' });
  const [pair2, setPair2] = useState({ player1: '', player2: '' });
  const [sets, setSets] = useState([{ pair1Score: '', pair2Score: '' }, { pair1Score: '', pair2Score: '' }]);
  const [showThirdSet, setShowThirdSet] = useState(false);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const navigate = useNavigate(); // Hook para navegar

  const handleSetChange = (index, pair, value) => {
    const updatedSets = [...sets];
    updatedSets[index][pair] = value;
    setSets(updatedSets);
  };

  // Función para guardar los datos en Firestore
  const handleSubmit = async () => {
    try {
      // Añade el resultado a la colección 'results' en Firestore
      await addDoc(collection(db, "results"), {
        pair1,
        pair2,
        sets,
        date,
        location,
      });
      console.log("Resultado guardado exitosamente");
      navigate('/'); // Navega a la página principal tras guardar el resultado
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
    }
  };

  const addThirdSet = () => {
    setShowThirdSet(true);
    setSets([...sets, { pair1Score: '', pair2Score: '' }]);
  };

  return (
    <Container>
      <Typography variant="h5" gutterBottom style={{ marginBottom: '40px' }}>
        Agregar Resultado
      </Typography>

      {/* Nombres de las parejas */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginBottom: '20px' }}>
            <InputLabel shrink={true} style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
              Pareja 1 - Jugador 1
            </InputLabel>
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
            <InputLabel shrink={true} style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
              Pareja 1 - Jugador 2
            </InputLabel>
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
            <InputLabel shrink={true} style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
              Pareja 2 - Jugador 1
            </InputLabel>
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
            <InputLabel shrink={true} style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
              Pareja 2 - Jugador 2
            </InputLabel>
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
            InputLabelProps={{
              shrink: true,
            }}
            style={{ marginTop: '16px' }}  // Añadimos espacio entre el título y el input
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth style={{ marginTop: '16px' }}>
            <InputLabel shrink={true} style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Lugar</InputLabel>
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

      {/* Sets */}
      <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>Resultados de Sets</Typography>

      {[0, 1].map((setIndex) => (
        <Grid container spacing={2} key={setIndex} style={{ marginBottom: '10px' }}>
          <Grid item xs={6}>
            <TextField
              label={`Set ${setIndex + 1} - Pareja 1`}
              value={sets[setIndex].pair1Score}
              onChange={(e) => handleSetChange(setIndex, 'pair1Score', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={`Set ${setIndex + 1} - Pareja 2`}
              value={sets[setIndex].pair2Score}
              onChange={(e) => handleSetChange(setIndex, 'pair2Score', e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
      ))}

      {/* Mostrar tercer set si es necesario */}
      {showThirdSet && (
        <Grid container spacing={2} key={2} style={{ marginBottom: '10px' }}>
          <Grid item xs={6}>
            <TextField
              label={`Set 3 - Pareja 1`}
              value={sets[2]?.pair1Score}
              onChange={(e) => handleSetChange(2, 'pair1Score', e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={`Set 3 - Pareja 2`}
              value={sets[2]?.pair2Score}
              onChange={(e) => handleSetChange(2, 'pair2Score', e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
      )}

      {/* Botones */}
      <Grid container spacing={2} style={{ marginTop: '20px' }}>
        <Grid item>
          <Button 
            variant="contained" 
            onClick={addThirdSet}
            style={{ backgroundColor: '#800080', color: '#FFFFFF' }}
          >
            Añadir Tercer Set
          </Button>
        </Grid>
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