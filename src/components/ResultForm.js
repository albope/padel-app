// src/components/ResultForm.js
import React from 'react';
import {
  TextField, Button, Container, Typography, Grid, Select, MenuItem,
  InputLabel, FormControl, Box, Paper, FormHelperText, Alert,
  useTheme, IconButton, Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  Event as EventIcon,
  Scoreboard as ScoreboardIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

// Importamos el Hook
import { useResultForm, LOCATIONS_LIST } from '../hooks/useResultForm';

const ResultForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Obtenemos toda la lógica y estado del hook
  const {
    pair1, pair2, sets, showThirdSet, date, location, addedBy,
    errors, isSubmitting,
    setDate, setLocation, setAddedBy,
    handlePlayerChange, handleSetChange, toggleThirdSet, handleSubmit, getAvailablePlayers
  } = useResultForm();

  // Estilo del Header (Consistente con Players y Home)
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

  // Estilo del Botón Principal (Igual al Header)
  const buttonStyle = {
    borderRadius: 3, 
    py: 1.5,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
    '&:hover': { 
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
        transform: 'scale(1.02)'
    }
  };

  const sectionHeader = (icon, title) => (
    <Box display="flex" alignItems="center" gap={1} mb={2} sx={{ color: theme.palette.text.secondary }}>
        {icon}
        <Typography variant="subtitle1" fontWeight="bold" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
            {title}
        </Typography>
    </Box>
  );

  const renderPlayerSelect = (pairName, playerKey, label) => {
    const value = pairName === 'pair1' ? pair1[playerKey] : pair2[playerKey];
    const allPairs = { pair1, pair2 };
    const available = getAvailablePlayers(`${pairName}-${playerKey}`, value, allPairs);

    return (
      <FormControl fullWidth error={!!errors.players} size="small">
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={(e) => handlePlayerChange(pairName, playerKey, e.target.value)}
        >
          <MenuItem value=""><em>--</em></MenuItem>
          {available.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </Select>
      </FormControl>
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 8 }}>
      
      {/* HEADER */}
      <Paper elevation={0} sx={headerStyle}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Nuevo Partido
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
            Registra el resultado
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        
        {/* SECCIÓN: DETALLES */}
        <Box mb={4}>
            {sectionHeader(<EventIcon color="primary"/>, "Detalles")}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <DatePicker
                        label="Fecha"
                        value={date}
                        onChange={(d) => setDate(d)}
                        slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors.date, helperText: errors.date } }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.location} size="small">
                        <InputLabel>Ubicación</InputLabel>
                        <Select value={location} label="Ubicación" onChange={(e) => setLocation(e.target.value)}>
                            {LOCATIONS_LIST.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </Select>
                        {errors.location && <FormHelperText>{errors.location}</FormHelperText>}
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Registrado por"
                        value={addedBy}
                        onChange={(e) => setAddedBy(e.target.value)}
                        fullWidth
                        size="small"
                        error={!!errors.addedBy}
                        helperText={errors.addedBy}
                    />
                </Grid>
            </Grid>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* SECCIÓN: JUGADORES */}
        <Box mb={4}>
            {sectionHeader(<GroupIcon color="primary"/>, "Parejas")}
            <Grid container spacing={2}>
                {/* Pareja 1 */}
                <Grid item xs={12}>
                    <Typography variant="caption" color="primary" fontWeight="bold">PAREJA 1</Typography>
                </Grid>
                <Grid item xs={6}>{renderPlayerSelect('pair1', 'player1', 'Jugador 1')}</Grid>
                <Grid item xs={6}>{renderPlayerSelect('pair1', 'player2', 'Jugador 2')}</Grid>
                
                {/* Pareja 2 */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="secondary" fontWeight="bold">PAREJA 2</Typography>
                </Grid>
                <Grid item xs={6}>{renderPlayerSelect('pair2', 'player1', 'Jugador 1')}</Grid>
                <Grid item xs={6}>{renderPlayerSelect('pair2', 'player2', 'Jugador 2')}</Grid>
            </Grid>
            {errors.players && <Alert severity="error" sx={{ mt: 2 }}>{errors.players}</Alert>}
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* SECCIÓN: MARCADOR */}
        <Box mb={4}>
            {sectionHeader(<ScoreboardIcon color="primary"/>, "Marcador")}
            
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={3} textAlign="center"><Typography variant="caption" fontWeight="bold">SET</Typography></Grid>
                <Grid item xs={4} textAlign="center"><Typography variant="caption" color="primary" fontWeight="bold">PAREJA 1</Typography></Grid>
                <Grid item xs={1} textAlign="center">-</Grid>
                <Grid item xs={4} textAlign="center"><Typography variant="caption" color="secondary" fontWeight="bold">PAREJA 2</Typography></Grid>

                {sets.slice(0, showThirdSet ? 3 : 2).map((set, i) => (
                    <React.Fragment key={i}>
                        <Grid item xs={3} textAlign="center">
                            <Typography fontWeight="bold" color="text.secondary">{i + 1}º</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                value={sets[i].pair1Score}
                                onChange={(e) => handleSetChange(i, 'pair1Score', e.target.value)}
                                type="number" inputProps={{ min: 0, max: 7, style: { textAlign: 'center' } }}
                                size="small" fullWidth error={!!errors[`set${i}`]}
                            />
                        </Grid>
                        <Grid item xs={1} textAlign="center">:</Grid>
                        <Grid item xs={4}>
                            <TextField
                                value={sets[i].pair2Score}
                                onChange={(e) => handleSetChange(i, 'pair2Score', e.target.value)}
                                type="number" inputProps={{ min: 0, max: 7, style: { textAlign: 'center' } }}
                                size="small" fullWidth error={!!errors[`set${i}`]}
                            />
                        </Grid>
                        {errors[`set${i}`] && (
                            <Grid item xs={12}>
                                <FormHelperText error sx={{ textAlign: 'center' }}>{errors[`set${i}`]}</FormHelperText>
                            </Grid>
                        )}
                    </React.Fragment>
                ))}
            </Grid>

            {errors.setsGlobal && <Alert severity="warning" sx={{ mt: 2 }}>{errors.setsGlobal}</Alert>}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                    size="small"
                    variant={showThirdSet ? "outlined" : "text"}
                    color={showThirdSet ? "error" : "primary"}
                    onClick={toggleThirdSet}
                    startIcon={showThirdSet ? <RemoveIcon /> : <AddIcon />}
                >
                    {showThirdSet ? "Quitar 3er Set" : "Añadir 3er Set"}
                </Button>
            </Box>
        </Box>

        {/* ACCIONES */}
        {errors.submit && <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>}
        
        <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={<SaveIcon />}
            sx={buttonStyle} // <--- Aplicamos el nuevo estilo aquí
        >
            {isSubmitting ? 'Guardando...' : 'Guardar Resultado'}
        </Button>

      </Paper>
    </Container>
  );
};

export default ResultForm;