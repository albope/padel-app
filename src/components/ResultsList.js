// ResultsList.js
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
// No necesitamos getDocs, collection de firebase aquí si los datos vienen de props
import { deleteDoc, doc, addDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase';

import {
    Typography, Grid, Card, CardContent, Box, Button,
    FormControl, Select, MenuItem, InputLabel, Paper, TextField,
    CircularProgress, useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Star } from '@mui/icons-material'; // Used in categorizeMatch
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import { tokens } from '../theme';

import dayjs from 'dayjs';

// Context hooks
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirmDialog } from '../context/ConfirmDialog';
import { useData } from '../context/DataContext';

// Components
import MatchCard from './MatchCard';
import ResultsListSkeleton from './skeletons/ResultsListSkeleton';

// Props que esperamos: results (array de todos los resultados)
const ResultsList = ({ results: allResults }) => {
    const theme = useTheme();
    const { showSuccess, showError } = useSnackbar();
    const { confirmDelete } = useConfirmDialog();
    const { refreshResults } = useData();

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

    // Track newly added results for animation
    const [newResultId, setNewResultId] = useState(null);
    const prevResultsCount = useRef(allResults?.length || 0);

    // Detect new results for animation
    useEffect(() => {
        let timeoutId = null;

        if (allResults && allResults.length > prevResultsCount.current) {
            // A new result was added - get the most recent one
            const sortedResults = [...allResults].sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            if (sortedResults[0]) {
                setNewResultId(sortedResults[0].id);
                // Clear the new flag after animation
                timeoutId = setTimeout(() => setNewResultId(null), 500);
            }
        }
        prevResultsCount.current = allResults?.length || 0;

        // Cleanup to prevent memory leak if component unmounts
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [allResults]);
    
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
    }, []); // No dependencies needed - uses static values only

    const handleMonthChange = useCallback(event => {
        setCurrentMonth(event.target.value);
    }, []);

    const handleYearChange = useCallback(event => {
        setCurrentYear(event.target.value);
    }, []);

    const handleDeleteResult = useCallback(async (resultId, resultData) => {
        const confirmed = await confirmDelete(
            '¿Estás seguro de que quieres eliminar este resultado? Esta accion no se puede deshacer.'
        );
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, 'results', resultId));
            await addDoc(collection(db, 'deletions'), {
                resultId,
                dateDeleted: serverTimestamp(),
                deletedBy: localStorage.getItem('addedBy') || 'Anónimo',
                resultData,
            });
            await refreshResults();
            showSuccess('Resultado eliminado correctamente');
        } catch (error) {
            console.error('Error al eliminar el resultado:', error);
            showError('Error al eliminar el resultado. Intentalo de nuevo.');
        }
    }, [confirmDelete, showSuccess, showError, refreshResults]);

    const handleClone = useCallback(async (resultToClone) => {
        try {
            const newResult = { ...resultToClone };
            delete newResult.id;
            newResult.date = serverTimestamp();
            newResult.createdAt = serverTimestamp();
            newResult.addedBy = localStorage.getItem('addedBy') || 'Clonador Anónimo';

            await addDoc(collection(db, "results"), newResult);
            await refreshResults();
            showSuccess('Resultado clonado con la fecha actual');
        } catch (error) {
            console.error("Error al clonar el resultado:", error);
            showError('Error al clonar el resultado. Intentalo de nuevo.');
        }
    }, [showSuccess, showError, refreshResults]);

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
            await refreshResults();
            showSuccess('Resultado actualizado correctamente');
        } catch (error) {
            console.error("Error al guardar los cambios:", error);
            showError('Error al guardar los cambios. Intentalo de nuevo.');
        }
    }, [editableResult, editingId, showSuccess, showError, refreshResults]);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setEditableResult(null);
    }, []);

    // Determine winner for share message
    const getWinnerPair = useCallback((result) => {
        if (!result.sets || !Array.isArray(result.sets)) return null;
        let pair1Wins = 0;
        let pair2Wins = 0;
        result.sets.forEach(set => {
            const p1Score = parseInt(set.pair1Score, 10);
            const p2Score = parseInt(set.pair2Score, 10);
            if (p1Score > p2Score) pair1Wins++;
            else if (p2Score > p1Score) pair2Wins++;
        });
        return pair1Wins > pair2Wins ? 'pair1' : pair2Wins > pair1Wins ? 'pair2' : null;
    }, []);

    const handleShareResult = useCallback(result => {
        const setsResults = result.sets
            .map((set, index) => `  - *Set ${index + 1}:* ${set.pair1Score}-${set.pair2Score}`)
            .join('\n');

        const winner = getWinnerPair(result);
        const winnerText = winner === 'pair1'
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
    }, [getWinnerPair]);

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
        return <ResultsListSkeleton itemCount={5} />;
    }
    

    return (
        <Box sx={{ width: '100%' }}>
            {/* Premium Header - Historial de Partidas */}
            <Paper
                elevation={4}
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Línea decorativa superior */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${tokens.colors.electricLime.main} 50%, ${theme.palette.secondary.main} 100%)`,
                    }}
                />

                {/* Título con icono */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        pt: 2.5,
                        pb: 1.5,
                    }}
                >
                    <HistoryIcon
                        sx={{
                            fontSize: { xs: 22, sm: 26 },
                            color: theme.palette.secondary.main,
                            filter: `drop-shadow(0 0 6px ${alpha(theme.palette.secondary.main, 0.5)})`,
                        }}
                    />
                    <Typography
                        sx={{
                            fontFamily: tokens.typography.displayFont,
                            fontSize: { xs: '1.1rem', sm: '1.4rem' },
                            letterSpacing: '0.08em',
                            color: theme.palette.secondary.main,
                            textShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.3)}`,
                        }}
                    >
                        HISTORIAL DE PARTIDAS
                    </Typography>
                </Box>

                {/* Selectores compactos inline */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: { xs: 1.5, sm: 2 },
                        px: { xs: 2, sm: 3 },
                        pb: 2.5,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <FormControl
                        size="small"
                        sx={{
                            minWidth: { xs: 130, sm: 150 },
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: alpha(theme.palette.primary.dark, 0.4),
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(theme.palette.secondary.main, 0.5),
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.secondary.main,
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: alpha(theme.palette.text.primary, 0.7),
                                fontSize: '0.85rem',
                                '&.Mui-focused': {
                                    color: theme.palette.secondary.main,
                                },
                            },
                            '& .MuiSelect-select': {
                                py: 1,
                                fontSize: '0.9rem',
                            },
                        }}
                    >
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

                    <FormControl
                        size="small"
                        sx={{
                            minWidth: { xs: 90, sm: 100 },
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: alpha(theme.palette.primary.dark, 0.4),
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(theme.palette.secondary.main, 0.5),
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.secondary.main,
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: alpha(theme.palette.text.primary, 0.7),
                                fontSize: '0.85rem',
                                '&.Mui-focused': {
                                    color: theme.palette.secondary.main,
                                },
                            },
                            '& .MuiSelect-select': {
                                py: 1,
                                fontSize: '0.9rem',
                                fontFamily: tokens.typography.monoFont,
                                fontWeight: 600,
                            },
                        }}
                    >
                        <InputLabel id="year-select-label">Año</InputLabel>
                        <Select
                            labelId="year-select-label"
                            value={currentYear}
                            onChange={handleYearChange}
                            label="Año"
                            disabled={availableYears.length === 0}
                        >
                            {availableYears.map(year => (
                                <MenuItem
                                    key={year}
                                    value={year}
                                    sx={{ fontFamily: tokens.typography.monoFont }}
                                >
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
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
                    return (
                        <Grid item xs={12} key={result.id}>
                            {editingId === result.id ? (
                                <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
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
                                </Card>
                            ) : (
                                <MatchCard
                                    result={result}
                                    category={category}
                                    isNew={result.id === newResultId}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteResult}
                                    onClone={handleClone}
                                    onShare={handleShareResult}
                                />
                            )}
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
            

        </Box>
    );
};

export default ResultsList;