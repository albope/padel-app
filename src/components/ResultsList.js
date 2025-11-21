// src/components/ResultsList.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  Typography, Grid, Card, CardContent, CardActions, Box, Button,
  FormControl, Select, MenuItem, InputLabel, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, TextField,
  CircularProgress, Chip, Tooltip, useTheme, Alert, Avatar
} from '@mui/material';
import {
  EmojiEvents, Star, Edit, Delete as DeleteIcon,
  Share as ShareIcon, ContentCopy as ContentCopyIcon,
  ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { deleteDoc, doc, addDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

// --- SUB-COMPONENTE: TARJETA DE RESULTADO ---
const ResultCardItem = ({ result, theme, onEdit, onDelete, onClone, onShare }) => {
    // Lógica visual para detectar "Superclásico" (Simplificada)
    const isSuperclasico = useMemo(() => {
        const p1 = [result.pair1?.player1, result.pair1?.player2].sort().join('-');
        const p2 = [result.pair2?.player1, result.pair2?.player2].sort().join('-');
        // Normalizar nombres si es necesario, aquí simplificado
        const teamA = "Bort-Ricardo";
        const teamB = "Lucas-Martin";
        return (p1 === teamA && p2 === teamB) || (p1 === teamB && p2 === teamA);
    }, [result]);

    const isWinner = (pairKey) => {
        if (!result.sets) return false;
        let wins = 0;
        result.sets.forEach(s => {
            const s1 = parseInt(s.pair1Score) || 0;
            const s2 = parseInt(s.pair2Score) || 0;
            if (pairKey === 'pair1' && s1 > s2) wins++;
            if (pairKey === 'pair2' && s2 > s1) wins++;
        });
        return wins >= 2; // Asumiendo mejor de 3
    };

    return (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, position: 'relative', overflow: 'visible' }}>
            {isSuperclasico && (
                <Chip
                    icon={<Star sx={{ color: '#FFD700 !important' }} />}
                    label="Superclásico"
                    size="small"
                    sx={{
                        position: 'absolute', top: -12, right: 16,
                        bgcolor: '#222', color: '#FFD700', fontWeight: 'bold',
                        boxShadow: 3
                    }}
                />
            )}
            <CardContent sx={{ pt: 3 }}>
                {/* Cabecera de la Tarjeta */}
                <Box display="flex" alignItems="center" gap={1} mb={2} color="text.secondary">
                    <CalendarIcon fontSize="small" />
                    <Typography variant="body2" fontWeight="bold">
                        {dayjs(result.date.toDate ? result.date.toDate() : result.date).format('dddd, D MMMM YYYY')}
                    </Typography>
                </Box>

                {/* Tabla de Resultados */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                            <TableRow>
                                <TableCell>Pareja</TableCell>
                                {result.sets?.map((_, i) => <TableCell key={i} align="center">S{i + 1}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {['pair1', 'pair2'].map((pairKey) => {
                                const won = isWinner(pairKey);
                                const pName1 = result[pairKey]?.player1 || '?';
                                const pName2 = result[pairKey]?.player2 || '?';
                                return (
                                    <TableRow key={pairKey} sx={{ bgcolor: won ? theme.palette.success.light + '20' : 'transparent' }}>
                                        <TableCell sx={{ fontWeight: won ? 'bold' : 'normal' }}>
                                            {won && <EmojiEvents fontSize="inherit" sx={{ color: '#FFD700', mr: 0.5, verticalAlign: 'middle' }} />}
                                            {pName1} & {pName2}
                                        </TableCell>
                                        {result.sets?.map((s, i) => (
                                            <TableCell key={i} align="center" sx={{ fontWeight: 'bold' }}>
                                                {pairKey === 'pair1' ? s.pair1Score : s.pair2Score}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Typography variant="caption" color="text.secondary">
                    📍 {result.location || 'Sin ubicación'} • Añadido por: {result.addedBy}
                </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: 'flex-end', borderTop: `1px solid ${theme.palette.divider}`, py: 1 }}>
                <Tooltip title="Compartir"><IconButton size="small" onClick={() => onShare(result)} color="success"><ShareIcon /></IconButton></Tooltip>
                <Tooltip title="Clonar"><IconButton size="small" onClick={() => onClone(result)} color="info"><ContentCopyIcon /></IconButton></Tooltip>
                <Tooltip title="Editar"><IconButton size="small" onClick={() => onEdit(result)} color="warning"><Edit /></IconButton></Tooltip>
                <Tooltip title="Eliminar"><IconButton size="small" onClick={() => onDelete(result.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
            </CardActions>
        </Card>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ResultsList = ({ results: allResults }) => {
    const theme = useTheme();
    
    // Estados
    const [currentMonth, setCurrentMonth] = useState(dayjs().month());
    const [currentYear, setCurrentYear] = useState(dayjs().year());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    // Estados Edición
    const [editingId, setEditingId] = useState(null);
    const [editableResult, setEditableResult] = useState(null);

    // Años disponibles
    const availableYears = useMemo(() => {
        if (!allResults) return [];
        const years = new Set(allResults.map(r => dayjs(r.date.toDate ? r.date.toDate() : r.date).year()));
        return [...years].sort((a, b) => b - a);
    }, [allResults]);

    // Filtrado
    const filteredResults = useMemo(() => {
        if (!allResults) return [];
        return allResults.filter(r => {
            const d = dayjs(r.date.toDate ? r.date.toDate() : r.date);
            if (currentMonth === 12) return d.year() === currentYear;
            return d.month() === currentMonth && d.year() === currentYear;
        }).sort((a, b) => {
            const da = dayjs(a.date.toDate ? a.date.toDate() : a.date);
            const db = dayjs(b.date.toDate ? b.date.toDate() : b.date);
            return db.diff(da);
        });
    }, [allResults, currentMonth, currentYear]);

    // Paginación
    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const paginatedResults = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- MANEJADORES ---
    const handleDelete = async (id) => {
        if (window.confirm("¿Borrar este partido?")) {
            try { await deleteDoc(doc(db, 'results', id)); }
            catch (e) { console.error(e); alert("Error al borrar"); }
        }
    };

    const handleClone = async (result) => {
        const { id, ...rest } = result;
        try {
            await addDoc(collection(db, 'results'), {
                ...rest,
                date: serverTimestamp(),
                createdAt: serverTimestamp(),
                addedBy: localStorage.getItem('addedBy') || 'Clonado'
            });
            alert("Partido clonado como HOY");
        } catch (e) { console.error(e); }
    };

    const handleShare = (result) => {
        const d = dayjs(result.date.toDate ? result.date.toDate() : result.date);
        const setsTxt = result.sets.map((s, i) => `S${i+1}: ${s.pair1Score}-${s.pair2Score}`).join(' | ');
        const text = `🎾 Resultado Padel ${d.format('DD/MM')}\n${result.pair1.player1}&${result.pair1.player2} vs ${result.pair2.player1}&${result.pair2.player2}\n${setsTxt}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Manejadores Edición (Básicos, idealmente mover a un Modal separado como en Players.js)
    const startEdit = (result) => {
        setEditingId(result.id);
        setEditableResult({ ...result, date: dayjs(result.date.toDate ? result.date.toDate() : result.date).format('YYYY-MM-DD') });
    };

    const saveEdit = async () => {
        try {
            const { id, ...data } = editableResult;
            await updateDoc(doc(db, 'results', id), {
                ...data,
                date: dayjs(data.date).toDate()
            });
            setEditingId(null);
        } catch (e) { console.error(e); alert("Error al guardar"); }
    };

    if (!allResults) return <Box p={3} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box>
            {/* FILTROS */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: theme.palette.action.hover }}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Mes</InputLabel>
                            <Select value={currentMonth} label="Mes" onChange={(e) => setCurrentMonth(e.target.value)}>
                                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => <MenuItem key={i} value={i}>{m}</MenuItem>)}
                                <MenuItem value={12}>Todo el Año</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Año</InputLabel>
                            <Select value={currentYear} label="Año" onChange={(e) => setCurrentYear(e.target.value)}>
                                {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* LISTA */}
            {paginatedResults.length === 0 ? (
                <Alert severity="info">No hay partidos en esta fecha.</Alert>
            ) : (
                paginatedResults.map(result => {
                    if (editingId === result.id) {
                        // MODO EDICIÓN (Simplificado para no alargar, idealmente un componente aparte)
                        return (
                            <Card key={result.id} sx={{ mb: 2, p: 2 }}>
                                <Typography variant="h6" gutterBottom>Editar Resultado</Typography>
                                <TextField fullWidth label="Fecha" type="date" value={editableResult.date} onChange={(e) => setEditableResult({...editableResult, date: e.target.value})} sx={{ mb: 2 }} />
                                <TextField fullWidth label="Ubicación" value={editableResult.location} onChange={(e) => setEditableResult({...editableResult, location: e.target.value})} sx={{ mb: 2 }} />
                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                    <Button onClick={() => setEditingId(null)}>Cancelar</Button>
                                    <Button variant="contained" onClick={saveEdit}>Guardar</Button>
                                </Box>
                            </Card>
                        );
                    }
                    return (
                        <ResultCardItem 
                            key={result.id} 
                            result={result} 
                            theme={theme}
                            onDelete={handleDelete}
                            onClone={handleClone}
                            onShare={handleShare}
                            onEdit={startEdit}
                        />
                    );
                })
            )}

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={2}>
                    <IconButton onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ArrowBackIcon /></IconButton>
                    <Typography variant="caption">{currentPage} / {totalPages}</Typography>
                    <IconButton onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ArrowForwardIcon /></IconButton>
                </Box>
            )}
        </Box>
    );
};

export default ResultsList;