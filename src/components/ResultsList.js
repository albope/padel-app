// ResultsList.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
// No necesitamos getDocs, collection de firebase aquí si los datos vienen de props
import { deleteDoc, doc, addDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase';

import {
    Typography, Container, Grid, Card, CardContent, CardActions, Box, Button,
    FormControl, Select, MenuItem, InputLabel, IconButton, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
    CircularProgress, Alert, useTheme, Chip, Tooltip // Añadidos
} from '@mui/material';
import { EmojiEvents, Star, Sports, Flag, Edit, ContentCopy } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import BarChartIcon from '@mui/icons-material/BarChart';

import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Props que esperamos: results (array de todos los resultados)
const ResultsList = ({ results: allResults }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // Estados para el filtrado y paginación
    const [filteredResults, setFilteredResults] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(dayjs().month());
    const [currentYear, setCurrentYear] = useState(dayjs().year());
    const [availableYears, setAvailableYears] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Estados para la edición en línea
    const [editingId, setEditingId] = useState(null);
    const [editableResult, setEditableResult] = useState(null);
    
    // --- LÓGICA DE FILTRADO Y DATOS DERIVADOS ---
    useEffect(() => {
        if (allResults && allResults.length > 0) {
            const years = [...new Set(allResults.map(result => {
                const dateObj = result.date?.toDate ? result.date.toDate() : new Date(result.date);
                return dayjs(dateObj).year(); // CORREGIDO: .year()
            }))].sort((a, b) => b - a);
            setAvailableYears(years);

            if (years.length > 0 && !years.includes(currentYear)) {
                setCurrentYear(years[0]);
            }
        } else {
            // Si no hay resultados, limpiar los años disponibles
            setAvailableYears([]);
        }
    }, [allResults]); // Dependencia solo de allResults, currentYear se actualiza si es necesario


    // Efecto para filtrar cuando cambian los resultados, mes o año
    useEffect(() => {
        if (!allResults) {
            setFilteredResults([]);
            return;
        }
        const filtered = allResults
            .filter(result => {
                const dateObj = result.date?.toDate ? result.date.toDate() : new Date(result.date);
                const resultDate = dayjs(dateObj);
                // --- CORREGIDO AQUÍ ---
                if (currentMonth === 12) { // "Año completo"
                    return resultDate.year() === currentYear; 
                }
                return resultDate.month() === currentMonth && resultDate.year() === currentYear;
            })
            .sort((a, b) => { 
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
            });
        
        setFilteredResults(filtered);
        setCurrentPage(1); 
    }, [allResults, currentMonth, currentYear]);

const categorizeMatch = useCallback((pair1, pair2) => {
        // Asegurar que pair1 y pair2 sean objetos válidos con player1 y player2
        if (!pair1?.player1 || !pair1?.player2 || !pair2?.player1 || !pair2?.player2) {
            return null;
        }

        // Normalizar los nombres de los jugadores a un formato consistente (ej. minúsculas y sin espacios extra)
        // para evitar problemas por diferencias sutiles en los datos.
        const normalize = (name) => name.trim().toLowerCase();

        // Definir las dos combinaciones de jugadores que forman el "Superclásico"
        const teamA_Players = [normalize("Ricardo"), normalize("Bort")].sort();
        const teamB_Players = [normalize("Lucas"), normalize("Martin")].sort();

        // Normalizar y ordenar los jugadores de las parejas del partido actual
        const currentMatch_Pair1_Players = [normalize(pair1.player1), normalize(pair1.player2)].sort();
        const currentMatch_Pair2_Players = [normalize(pair2.player1), normalize(pair2.player2)].sort();

        // Convertir los arrays de jugadores a strings para facilitar la comparación
        const teamA_Key = teamA_Players.join('-');
        const teamB_Key = teamB_Players.join('-');

        const currentP1_Key = currentMatch_Pair1_Players.join('-');
        const currentP2_Key = currentMatch_Pair2_Players.join('-');

        // Comprobar si las parejas del partido actual coinciden con las del Superclásico
        const isSuperclasico = 
            (currentP1_Key === teamA_Key && currentP2_Key === teamB_Key) ||
            (currentP1_Key === teamB_Key && currentP2_Key === teamA_Key);

        if (isSuperclasico) {
            return { 
                label: 'Superclásico', 
                icon: <Star sx={{ color: '#ffb300', fontSize: '1.1rem' }} />, 
                color: '#ffb300' 
            };
        }

        return null; // No es un Superclásico, no se aplica ninguna otra etiqueta
    }, [theme]); // allResults ya no es necesario como dependencia si no contamos enfrentamientos previos

    const handleMonthChange = useCallback(event => {
        setCurrentMonth(event.target.value);
    }, []);

    const handleYearChange = useCallback(event => {
        setCurrentYear(event.target.value);
    }, []);

    const handleDeleteResult = useCallback(async (resultId, resultData) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este resultado?")) return;
        try {
            await deleteDoc(doc(db, 'results', resultId));
            await addDoc(collection(db, 'deletions'), { 
                resultId,
                dateDeleted: serverTimestamp(),
                deletedBy: localStorage.getItem('addedBy') || 'Anónimo',
                resultData, 
            });
            alert("Resultado eliminado. La lista se actualizará."); 
            // Idealmente, HomePage que es dueño de 'allResults' debería refrescar.
            // O si ResultsList es independiente (no recomendado ahora), haría su propio fetchResults().
        } catch (error) {
            console.error('Error al eliminar el resultado:', error);
            alert("Error al eliminar el resultado.");
        }
    }, []);

    const handleClone = useCallback(async (resultToClone) => {
        try {
            const newResult = { ...resultToClone };
            delete newResult.id; 
            newResult.date = serverTimestamp(); 
            newResult.createdAt = serverTimestamp();
            newResult.addedBy = localStorage.getItem('addedBy') || 'Clonador Anónimo';

            await addDoc(collection(db, "results"), newResult);
            alert("Resultado clonado y añadido con la fecha actual. La lista se actualizará.");
        } catch (error) {
            console.error("Error al clonar el resultado:", error);
            alert("Error al clonar el resultado.");
        }
    }, []);

    const handleEdit = useCallback((result) => {
        setEditingId(result.id);
        const dateObj = result.date?.toDate ? result.date.toDate() : new Date(result.date);
        setEditableResult({ 
            ...result, 
            date: dayjs(dateObj).format('YYYY-MM-DD') 
        });
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!editableResult || !editingId) return;
        try {
            const dataToUpdate = {
                ...editableResult,
                date: dayjs(editableResult.date).toDate(), 
            };
            delete dataToUpdate.id; 

            await updateDoc(doc(db, "results", editingId), dataToUpdate);
            setEditingId(null);
            setEditableResult(null);
            alert("Resultado actualizado. La lista se actualizará.");
        } catch (error) {
            console.error("Error al guardar los cambios:", error);
            alert("Error al guardar los cambios.");
        }
    }, [editableResult, editingId]);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setEditableResult(null);
    }, []);

    const isWinner = useCallback((pair, sets) => {
        if (!sets || !Array.isArray(sets)) return false;
        let pair1Wins = 0;
        let pair2Wins = 0;
        sets.forEach(set => {
            const p1Score = parseInt(set.pair1Score, 10);
            const p2Score = parseInt(set.pair2Score, 10);
            if (p1Score > p2Score) {
                pair1Wins++;
            } else if (p2Score > p1Score) {
                pair2Wins++;
            }
        });
        return pair === 'pair1' ? pair1Wins > pair2Wins : pair2Wins > pair1Wins;
    }, []);

    const handleShareResult = useCallback(result => {
        const setsResults = result.sets
            .map((set, index) => `  - *Set ${index + 1}:* ${set.pair1Score}-${set.pair2Score}`)
            .join('\n');

        const winnerText = isWinner('pair1', result.sets)
            ? `*¡Victoria de ${result.pair1?.player1 || 'N/A'} y ${result.pair1?.player2 || 'N/A'}!*`
            : `*¡Victoria de ${result.pair2?.player1 || 'N/A'} y ${result.pair2?.player2 || 'N/A'}!*`;
        
        const dateObj = result.date?.toDate ? result.date.toDate() : new Date(result.date);

        const message = `
🏆 Resultado del Partido 🏆

🗓️ *Fecha:* ${dayjs(dateObj).format('DD/MM/YYYY')}
📍 *Lugar:* ${result.location || 'Desconocido'}

🎾 *Pareja 1:* ${result.pair1?.player1 || 'N/A'} & ${result.pair1?.player2 || 'N/A'}
🎾 *Pareja 2:* ${result.pair2?.player1 || 'N/A'} & ${result.pair2?.player2 || 'N/A'}

📊 *Marcador por Sets:*
${setsResults}

${winnerText}`;

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }, [isWinner]);

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const paginatedResults = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredResults.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredResults, currentPage, itemsPerPage]);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    }, [currentPage, totalPages]);

    const handlePreviousPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    }, [currentPage]);

    if (!allResults) { 
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando resultados...</Typography>
            </Box>
        );
    }
    
    const navigationButtons = [
        { label: 'Añadir Resultado', icon: <AddCircleOutlineIcon />, path: '/add-result', color: 'primary' },
        { label: 'Info Partidas', icon: <InfoIcon />, path: '/info', color: 'info' },
        { label: 'Ranking', icon: <LeaderboardIcon />, path: '/players', color: 'success' },
        { label: 'Insignias', icon: <MilitaryTechIcon />, path: '/insignias', color: 'warning' },
        { label: 'Estadísticas', icon: <BarChartIcon />, path: '/stats-charts', color: 'secondary' }
    ];

    return (
        <Box sx={{ width: '100%' }}>
            <Paper elevation={2} sx={{ p: {xs: 1.5, sm:2.5}, mb: 3, borderRadius: 3 }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: theme.palette.primary.main }}>
                    Historial de Partidas
                </Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={6} md={5}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="month-select-label">Mes</InputLabel>
                            <Select
                                labelId="month-select-label"
                                value={currentMonth}
                                onChange={handleMonthChange}
                                label="Mes"
                            >
                                {[
                                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
                                ].map((month, index) => (
                                    <MenuItem key={index} value={index}>{month}</MenuItem>
                                ))}
                                <MenuItem value={12}>Año completo</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={5}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="year-select-label">Año</InputLabel>
                            <Select
                                labelId="year-select-label"
                                value={currentYear}
                                onChange={handleYearChange}
                                label="Año"
                                disabled={availableYears.length === 0}
                            >
                                {availableYears.map(year => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {filteredResults.length === 0 && (
                 <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Typography variant="h6" color="text.secondary">
                        No hay resultados para el filtro seleccionado.
                    </Typography>
                 </Box>
            )}

            <Grid container spacing={2.5}>
                {paginatedResults.map(result => {
                    const category = categorizeMatch(result.pair1, result.pair2);
                    const dateObj = result.date?.toDate ? result.date.toDate() : new Date(result.date);
                    return (
                        <Grid item xs={12} key={result.id}>
                            <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: theme.shadows[2], '&:hover': {boxShadow: theme.shadows[5]}}}>
                                {editingId === result.id ? (
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>Editando Resultado</Typography>
                                        <TextField
                                            fullWidth
                                            label="Ubicación"
                                            variant="outlined"
                                            size="small"
                                            value={editableResult.location || ''}
                                            onChange={(e) => setEditableResult(prev => ({ ...prev, location: e.target.value }))}
                                            sx={{ mb: 1.5 }}
                                        />
                                         <TextField
                                            fullWidth
                                            label="Fecha"
                                            type="date"
                                            variant="outlined"
                                            size="small"
                                            value={editableResult.date}
                                            onChange={(e) => setEditableResult(prev => ({ ...prev, date: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ mb: 1.5 }}
                                        />
                                        {editableResult.sets?.map((set, index) => (
                                            <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        label={`Set ${index + 1} - P1`}
                                                        type="number"
                                                        variant="outlined"
                                                        size="small"
                                                        value={set.pair1Score ?? ''}
                                                        onChange={(e) => {
                                                            const updatedSets = [...editableResult.sets];
                                                            updatedSets[index].pair1Score = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                                            setEditableResult(prev => ({ ...prev, sets: updatedSets }));
                                                        }}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <TextField
                                                        label={`Set ${index + 1} - P2`}
                                                        type="number"
                                                        variant="outlined"
                                                        size="small"
                                                        value={set.pair2Score ?? ''}
                                                        onChange={(e) => {
                                                            const updatedSets = [...editableResult.sets];
                                                            updatedSets[index].pair2Score = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                                            setEditableResult(prev => ({ ...prev, sets: updatedSets }));
                                                        }}
                                                        fullWidth
                                                    />
                                                </Grid>
                                            </Grid>
                                        ))}
                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Button variant="text" onClick={handleCancelEdit}>Cancelar</Button>
                                            <Button variant="contained" color="primary" onClick={handleSaveEdit}>Guardar</Button>
                                        </Box>
                                    </CardContent>
                                ) : (
                                    <>
                                        {category && (
                                            <Chip 
                                                icon={category.icon} 
                                                label={category.label} 
                                                size="small"
                                                sx={{ 
                                                    m: 1.5, 
                                                    mb: 0, 
                                                    backgroundColor: category.color, 
                                                    color: theme.palette.getContrastText(category.color),
                                                    fontWeight: 'medium'
                                                }} 
                                            />
                                        )}
                                        <CardContent sx={{ pt: category ? 1 : 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                                                    {dayjs(dateObj).format('dddd, D MMMM YYYY')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {result.location || 'Lugar Desconocido'}
                                                </Typography>
                                            </Box>
                                            
                                            <TableContainer component={Paper} variant="outlined" sx={{mb:1.5}}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{fontWeight:'bold'}}>Pareja</TableCell>
                                                            {result.sets.map((set, index) => (
                                                                <TableCell key={index} align="center" sx={{fontWeight:'bold'}}>S{index + 1}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        <TableRow sx={{ backgroundColor: isWinner('pair1', result.sets) ? theme.palette.success.light+'60' : 'inherit' }}>
                                                            <TableCell component="th" scope="row">
                                                                {isWinner('pair1', result.sets) && <EmojiEvents sx={{ color: theme.palette.warning.main, verticalAlign: 'middle', mr: 0.5, fontSize: '1.1rem' }} />}
                                                                <Typography component="span" variant="body2" sx={{ fontWeight: isWinner('pair1', result.sets) ? 'bold' : 'normal' }}>
                                                                    {result.pair1?.player1 || 'N/A'} & {result.pair1?.player2 || 'N/A'}
                                                                </Typography>
                                                            </TableCell>
                                                            {result.sets.map((set, index) => (
                                                                <TableCell key={index} align="center" sx={{ fontWeight: (parseInt(set.pair1Score) > parseInt(set.pair2Score)) ? 'bold' : 'normal'}}>{set.pair1Score ?? 0}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                        <TableRow sx={{ backgroundColor: isWinner('pair2', result.sets) ? theme.palette.success.light+'60' : 'inherit' }}>
                                                            <TableCell component="th" scope="row">
                                                                {isWinner('pair2', result.sets) && <EmojiEvents sx={{ color: theme.palette.warning.main, verticalAlign: 'middle', mr: 0.5, fontSize: '1.1rem' }} />}
                                                                <Typography component="span" variant="body2" sx={{ fontWeight: isWinner('pair2', result.sets) ? 'bold' : 'normal' }}>
                                                                    {result.pair2?.player1 || 'N/A'} & {result.pair2?.player2 || 'N/A'}
                                                                </Typography>
                                                            </TableCell>
                                                            {result.sets.map((set, index) => (
                                                                <TableCell key={index} align="center" sx={{ fontWeight: (parseInt(set.pair2Score) > parseInt(set.pair1Score)) ? 'bold' : 'normal'}}>{set.pair2Score ?? 0}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                Añadido por: {result.addedBy || 'N/A'}
                                                {result.createdAt && ` el ${dayjs(result.createdAt.toDate ? result.createdAt.toDate() : result.createdAt).format('D/MM/YY HH:mm')}`}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'flex-end', pt:0, pb:1, px:1 }}>
                                            <Tooltip title="Compartir">
                                                <IconButton size="small" onClick={() => handleShareResult(result)} sx={{ color: theme.palette.success.main }}><ShareIcon fontSize="small"/></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Clonar">
                                                <IconButton size="small" onClick={() => handleClone(result)} sx={{ color: theme.palette.info.main }}><ContentCopy fontSize="small"/></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Editar">
                                                <IconButton size="small" onClick={() => handleEdit(result)} sx={{ color: theme.palette.warning.dark }}><Edit fontSize="small"/></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar">
                                                <IconButton size="small" onClick={() => handleDeleteResult(result.id, result)} sx={{ color: theme.palette.error.main }}><DeleteIcon fontSize="small"/></IconButton>
                                            </Tooltip>
                                        </CardActions>
                                    </>
                                )}
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, mb:2 }}>
                    <Button onClick={handlePreviousPage} disabled={currentPage <= 1} startIcon={<ArrowBackIcon />}>
                        Anterior
                    </Button>
                    <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                        Página {currentPage} de {totalPages}
                    </Typography>
                    <Button onClick={handleNextPage} disabled={currentPage >= totalPages} endIcon={<ArrowForwardIcon />}>
                        Siguiente
                    </Button>
                </Box>
            )}
            
            <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Grid container spacing={0} justifyContent="center">
                    {navigationButtons.map((item) => (
                        <Grid item xs key={item.label} sx={{textAlign:'center'}}>
                             <Button
                                fullWidth
                                variant="text"
                                color={item.color || "inherit"}
                                onClick={() => navigate(item.path)}
                                sx={{ 
                                    flexDirection: 'column', 
                                    py: 1, 
                                    px: 0.5,
                                    borderRadius:0, 
                                    minWidth: 'auto',
                                    fontSize: '0.65rem', // Reducido para que quepan más
                                    lineHeight: 1.2,
                                    '& .MuiButton-startIcon': { margin: 0, mb: 0.3 } // Ajuste del icono
                                }}
                                startIcon={item.icon}
                            >
                                {item.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

        </Box>
    );
};

export default ResultsList;