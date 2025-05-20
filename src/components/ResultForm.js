// src/components/ResultForm.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  IconButton,
  Paper,
  FormHelperText,
  Alert // <--- ASEGÚRATE QUE ESTÉ IMPORTADO
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs'; // <--- AÑADE ESTA LÍNEA

// Constantes (podrían estar en un archivo separado si se usan en otros lugares)
const PLAYERS_LIST = ["Lucas", "Ricardo", "Martin", "Bort", "Invitado"];
const LOCATIONS_LIST = ["Passing Padel", "Elite Padel 22", "Flow Padel", "Aspresso k7", "Otro"];

const ResultForm = () => {
  const navigate = useNavigate();
  const [pair1, setPair1] = useState({ player1: '', player2: '' });
  const [pair2, setPair2] = useState({ player1: '', player2: '' });
  const [sets, setSets] = useState([{ pair1Score: '', pair2Score: '' }, { pair1Score: '', pair2Score: '' }]);
  const [showThirdSet, setShowThirdSet] = useState(false);
  const [date, setDate] = useState(null); // Inicializar como null para DatePicker
  const [location, setLocation] = useState('');
  const [addedBy, setAddedBy] = useState(localStorage.getItem('addedBy') || '');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Función para manejar el cambio de selección de jugadores
  const handlePlayerChange = useCallback((pair, playerKey, value) => {
    if (pair === 'pair1') {
      setPair1(prev => ({ ...prev, [playerKey]: value }));
    } else {
      setPair2(prev => ({ ...prev, [playerKey]: value }));
    }
    // Limpiar error de jugadores al cambiar
    if (errors.players) {
        setErrors(prev => ({...prev, players: undefined}));
    }
  }, [errors.players]);


  // Filtrar jugadores disponibles
  const getAvailablePlayers = useCallback((currentPairKey, currentPlayerValue, allPairs) => {
    const selectedPlayersInOtherPairs = [];
    if (currentPairKey.startsWith('pair1')) {
        if(allPairs.pair2.player1) selectedPlayersInOtherPairs.push(allPairs.pair2.player1);
        if(allPairs.pair2.player2) selectedPlayersInOtherPairs.push(allPairs.pair2.player2);
    } else {
        if(allPairs.pair1.player1) selectedPlayersInOtherPairs.push(allPairs.pair1.player1);
        if(allPairs.pair1.player2) selectedPlayersInOtherPairs.push(allPairs.pair1.player2);
    }

    const ownPartner = currentPairKey.endsWith('player1') ? allPairs[currentPairKey.substring(0,5)].player2 : allPairs[currentPairKey.substring(0,5)].player1;

    return PLAYERS_LIST.filter(
      (p) => p === currentPlayerValue || (p !== ownPartner && !selectedPlayersInOtherPairs.includes(p))
    );
  }, []);


  const handleSetChange = (index, scoreField, value) => {
    const updatedSets = sets.map((s, i) =>
      i === index ? { ...s, [scoreField]: value } : s
    );
    setSets(updatedSets);
    if (errors[`set${index}`]) {
        setErrors(prev => ({...prev, [`set${index}`]: undefined}));
    }
  };

  const addThirdSet = () => {
    if (!showThirdSet) {
      setShowThirdSet(true);
      setSets([...sets, { pair1Score: '', pair2Score: '' }]);
    }
  };

  const removeThirdSet = () => {
    if (showThirdSet) {
      setShowThirdSet(false);
      setSets(sets.slice(0, 2));
       // Limpiar errores del tercer set si existían
      if (errors.set2) {
        setErrors(prev => ({...prev, set2: undefined}));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const allSelectedPlayers = [pair1.player1, pair1.player2, pair2.player1, pair2.player2].filter(p => p && p !== '');

    if (!pair1.player1 || !pair1.player2 || !pair2.player1 || !pair2.player2) {
      newErrors.players = "Debes seleccionar 4 jugadores.";
    } else if (new Set(allSelectedPlayers).size !== 4) {
      newErrors.players = "Los jugadores no pueden repetirse en el partido.";
    }

    if (!date) {
      newErrors.date = "La fecha es requerida.";
    } else if (!dayjs(date).isValid()) {
      newErrors.date = "Formato de fecha inválido.";
    }


    if (!location) newErrors.location = "La localización es requerida.";
    if (!addedBy.trim()) newErrors.addedBy = "Tu nombre es requerido para añadir el resultado.";

    const finalSets = showThirdSet ? sets : sets.slice(0, 2);
    let pair1SetWins = 0;
    let pair2SetWins = 0;

    finalSets.forEach((set, index) => {
      const score1Str = set.pair1Score;
      const score2Str = set.pair2Score;

      if (score1Str === '' || score2Str === '') {
        newErrors[`set${index}`] = `Set ${index + 1}: Ambas puntuaciones son requeridas.`;
        return; // Saltar más validaciones para este set
      }
      
      const score1 = parseInt(score1Str, 10);
      const score2 = parseInt(score2Str, 10);

      if (isNaN(score1) || isNaN(score2)) {
        newErrors[`set${index}`] = `Set ${index + 1}: Las puntuaciones deben ser números.`;
      } else if (score1 < 0 || score1 > 7 || score2 < 0 || score2 > 7) {
        newErrors[`set${index}`] = `Set ${index + 1}: Puntuaciones deben estar entre 0 y 7.`;
      } else if (score1 === score2) {
        newErrors[`set${index}`] = `Set ${index + 1}: No puede haber empate.`;
      } else if (Math.max(score1, score2) < 6 && Math.max(score1,score2) !==0 ) { // Alguien debe llegar al menos a 6 para ganar un set (a menos que sea 0)
        newErrors[`set${index}`] = `Set ${index + 1}: Un jugador debe alcanzar al menos 6 juegos.`;
      } else if (Math.max(score1, score2) === 6 && Math.abs(score1 - score2) < 2) {
         newErrors[`set${index}`] = `Set ${index + 1}: Se debe ganar por diferencia de 2 juegos si se llega a 6.`;
      } else if (Math.max(score1, score2) === 7 && (Math.min(score1, score2) < 5 || Math.min(score1, score2) > 6) ) {
         newErrors[`set${index}`] = `Set ${index + 1}: Si se llega a 7, el oponente debe tener 5 o 6.`;
      }

      if (!newErrors[`set${index}`]) { // Si el set es válido hasta ahora, contar quién lo ganó
          if (score1 > score2) pair1SetWins++;
          else if (score2 > score1) pair2SetWins++;
      }
    });
    
    if(finalSets.length >= 2 && !Object.keys(newErrors).some(k => k.startsWith('set'))){ // Solo validar ganador del partido si los sets son válidos
        if(pair1SetWins + pair2SetWins < finalSets.length && finalSets.some(s=> s.pair1Score !== '' && s.pair2Score !== '')){
             // Esto podría pasar si un set es inválido pero no generó error antes (ej. vacío)
        } else if (pair1SetWins === pair2SetWins && finalSets.length === 2 && finalSets.every(s => s.pair1Score !== '' && s.pair2Score !== '')) {
             if (!showThirdSet) newErrors.setsGlobal = "Se requiere un tercer set para desempatar o marcar 2-0.";
        } else if (showThirdSet && pair1SetWins + pair2SetWins < 3 && finalSets.every(s => s.pair1Score !== '' && s.pair2Score !== '')) {
             newErrors.setsGlobal = "Si se juega un tercer set, deben completarse los 3.";
        } else if (pair1SetWins === 0 && pair2SetWins === 0 && finalSets.some(s=> s.pair1Score !== '' || s.pair2Score !== '') ){
             // Ok, puede que solo se haya rellenado un set y no se haya definido ganador
        }
         else if ( (pair1SetWins < 2 && pair2SetWins < 2) && (showThirdSet && finalSets.length === 3) ){
            newErrors.setsGlobal = "Un equipo debe ganar al menos 2 sets.";
        }
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Opcional: scroll al primer error
      const firstErrorKey = Object.keys(errors).find(key => errors[key]);
      if(firstErrorKey){
          const errorElement = document.getElementById(`${firstErrorKey}-label`) || document.getElementById(firstErrorKey);
          errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const finalSets = showThirdSet ? sets : sets.slice(0, 2);
      await addDoc(collection(db, "results"), {
        pair1,
        pair2,
        sets: finalSets,
        date: dayjs(date).format('YYYY-MM-DD'), // Guardar en formato estándar
        location,
        addedBy,
        createdAt: serverTimestamp(),
      });
      localStorage.setItem('addedBy', addedBy);
      // Podríamos añadir un Snackbar de éxito aquí
      navigate('/');
    } catch (error) {
      console.error("Error al guardar el resultado:", error);
      setErrors({ submit: "Error al guardar el resultado. Inténtalo de nuevo." });
      // Podríamos añadir un Snackbar de error aquí
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPlayerSelect = (pairName, playerKey, label) => {
    const value = pairName === 'pair1' ? pair1[playerKey] : pair2[playerKey];
    const allCurrentPairs = {pair1, pair2};
    const available = getAvailablePlayers(`${pairName}-${playerKey}`, value, allCurrentPairs);

    return (
      <FormControl fullWidth error={!!errors.players}>
        <InputLabel id={`${pairName}-${playerKey}-label`}>{label}</InputLabel>
        <Select
          labelId={`${pairName}-${playerKey}-label`}
          id={`${pairName}-${playerKey}`}
          value={value}
          label={label}
          onChange={(e) => handlePlayerChange(pairName, playerKey, e.target.value)}
        >
          <MenuItem value="">
            <em>Seleccionar</em>
          </MenuItem>
          {available.map((player) => (
            <MenuItem key={player} value={player}>{player}</MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };
  
  const commonTextFieldProps = (index, scoreKey) => ({
    label: `Set ${index + 1} - ${scoreKey.includes('pair1') ? 'Pareja 1' : 'Pareja 2'}`,
    value: sets[index][scoreKey] || '', // Controlar valor para que no sea undefined
    onChange: (e) => handleSetChange(index, scoreKey, e.target.value),
    fullWidth: true,
    type: 'number',
    inputProps: { min: 0, max: 7 }, // HTML5 validation
    autoComplete: "off",
    error: !!errors[`set${index}`],
    helperText: errors[`set${index}`], // Mostrar error específico del set
  });


  return (
    <Container maxWidth="sm" sx={{ py: 4 }}> {/* py para padding vertical */}
      <Paper elevation={3} sx={{ p: {xs: 2, sm: 4} }}> {/* Paper para agrupar y dar elevación */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3, fontWeight: 'bold' }}>
          Añadir Resultado
        </Typography>

        {/* Sección Parejas */}
        <Box component="fieldset" sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 3 }}>
          <Typography component="legend" variant="h6" sx={{ px: 1, mb:2 }}>Parejas</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>{renderPlayerSelect('pair1', 'player1', 'P1 - J1')}</Grid>
            <Grid item xs={6} sm={3}>{renderPlayerSelect('pair1', 'player2', 'P1 - J2')}</Grid>
            <Grid item xs={6} sm={3}>{renderPlayerSelect('pair2', 'player1', 'P2 - J1')}</Grid>
            <Grid item xs={6} sm={3}>{renderPlayerSelect('pair2', 'player2', 'P2 - J2')}</Grid>
          </Grid>
          {errors.players && <FormHelperText error sx={{mt:1, textAlign:'center'}}>{errors.players}</FormHelperText>}
        </Box>


        {/* Sección Información del Partido */}
        <Box component="fieldset" sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 3 }}>
          <Typography component="legend" variant="h6" sx={{ px: 1, mb:2 }}>Detalles del Partido</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Fecha del Partido"
                value={date}
                onChange={(newDate) => {
                    setDate(newDate);
                    if(errors.date) setErrors(prev => ({...prev, date: undefined}));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.date}
                    helperText={errors.date}
                    id="date-picker"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.location}>
                <InputLabel id="location-label">Lugar</InputLabel>
                <Select
                  labelId="location-label"
                  id="location"
                  value={location}
                  label="Lugar"
                  onChange={(e) => {
                      setLocation(e.target.value);
                      if(errors.location) setErrors(prev => ({...prev, location: undefined}));
                  }}
                >
                  <MenuItem value=""><em>Seleccionar</em></MenuItem>
                  {LOCATIONS_LIST.map((place) => (
                    <MenuItem key={place} value={place}>{place}</MenuItem>
                  ))}
                </Select>
                {errors.location && <FormHelperText>{errors.location}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Añadido por"
                value={addedBy}
                onChange={(e) => {
                    setAddedBy(e.target.value);
                     if(errors.addedBy) setErrors(prev => ({...prev, addedBy: undefined}));
                }}
                fullWidth
                error={!!errors.addedBy}
                helperText={errors.addedBy}
                id="addedBy"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Sección Resultados de Sets */}
         <Box component="fieldset" sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mb: 3 }}>
            <Typography component="legend" variant="h6" sx={{ px: 1, mb:2 }}>Resultados Sets</Typography>
            <Grid container spacing={2}>
                {sets.slice(0, showThirdSet ? 3 : 2).map((set, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={6}><TextField {...commonTextFieldProps(index, 'pair1Score')} /></Grid>
                    <Grid item xs={6}><TextField {...commonTextFieldProps(index, 'pair2Score')} /></Grid>
                </React.Fragment>
                ))}
            </Grid>
            {errors.setsGlobal && <FormHelperText error sx={{mt:1, textAlign:'center'}}>{errors.setsGlobal}</FormHelperText>}

            <Box sx={{ textAlign: 'center', mt: 2 }}>
                {!showThirdSet ? (
                <Button
                    variant="outlined"
                    onClick={addThirdSet}
                    startIcon={<AddCircleOutlineIcon />}
                >
                    Añadir Tercer Set
                </Button>
                ) : (
                <Button
                    variant="outlined"
                    color="error"
                    onClick={removeThirdSet}
                    startIcon={<DeleteIcon />}
                >
                    Quitar Tercer Set
                </Button>
                )}
            </Box>
        </Box>

        {/* Botones de Acción */}
        {errors.submit && <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>}
        <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          <Grid item xs={12} sm="auto">
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              onClick={() => navigate('/')}
              startIcon={<ArrowBackIcon />}
              sx={{mb: {xs: 1, sm: 0}}}
            >
              Volver
            </Button>
          </Grid>
          <Grid item xs={12} sm="auto">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={<SaveIcon />}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Resultado'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ResultForm;