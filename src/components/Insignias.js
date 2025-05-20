// Insignias.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container,
    Typography,
    Grid,
    Tooltip,
    Button,
    Box,
    Paper,
    CircularProgress,
    Alert,
    LinearProgress,
    useTheme,
    Divider,
    ClickAwayListener // Añadido para cerrar tooltip al hacer clic fuera
} from '@mui/material';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// --- FUNCIONES AUXILIARES (sin cambios respecto a la versión anterior) ---
const getMatchWinner = (sets) => {
    let pair1Wins = 0;
    let pair2Wins = 0;
    if (!sets || !Array.isArray(sets)) return 'pair1'; 

    sets.forEach(set => {
        const p1Score = parseInt(set.pair1Score, 10);
        const p2Score = parseInt(set.pair2Score, 10);
        if (p1Score > p2Score) {
            pair1Wins += 1;
        } else if (p2Score > p1Score) {
            pair2Wins += 1;
        }
    });
    return pair1Wins > pair2Wins ? 'pair1' : (pair2Wins > pair1Wins ? 'pair2' : 'draw');
};

const calculateConsecutiveWins = (matches, playerName) => {
    let currentConsecutiveWins = 0;
    let maxConsecutiveWins = 0;
    if (!Array.isArray(matches) || matches.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }
    const sortedMatches = [...matches].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
    });
    let currentStreakForPlayer = 0;
    sortedMatches.forEach(match => {
        const winnerPairId = getMatchWinner(match.sets);
        let playerWon = false;
        if (winnerPairId !== 'draw') {
            const winningTeamPlayers = [match[winnerPairId].player1, match[winnerPairId].player2];
            if (winningTeamPlayers.includes(playerName)) {
                playerWon = true;
            }
        }
        if (playerWon) {
            currentStreakForPlayer += 1;
        } else {
            currentStreakForPlayer = 0;
        }
        if (currentStreakForPlayer > maxConsecutiveWins) {
            maxConsecutiveWins = currentStreakForPlayer;
        }
    });
    return { currentStreak: currentStreakForPlayer, longestStreak: maxConsecutiveWins };
};
// --- FIN FUNCIONES AUXILIARES ---


const Insignias = () => {
    const theme = useTheme();
    const [playerStats, setPlayerStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const playersList = useMemo(() => ['Lucas', 'Bort', 'Martin', 'Ricardo'], []);
    const navigate = useNavigate();

    // --- NUEVO ESTADO PARA CONTROLAR EL TOOLTIP ABIERTO ---
    const [openTooltipKey, setOpenTooltipKey] = useState(null); // Almacenará una clave única tipo "playerName-achievementKey"

    useEffect(() => {
        const fetchAndProcessResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const querySnapshot = await getDocs(collection(db, "results"));
                const allMatches = [];
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const matchDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
                    allMatches.push({ ...data, id: doc.id, date: matchDate });
                });
                allMatches.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
                const stats = {};
                playersList.forEach(playerName => {
                    stats[playerName] = {
                        gamesPlayed: 0, gamesWon: 0, partners: new Set(),
                        efficiency: 0, winStreak: 0, longestStreak: 0,
                    };
                });
                allMatches.forEach(match => {
                    const winnerPairId = getMatchWinner(match.sets);
                    const p1 = match.pair1; const p2 = match.pair2;
                    const playersInGame = [p1.player1, p1.player2, p2.player1, p2.player2];
                    playersInGame.forEach(playerName => {
                        if (stats[playerName]) {
                            stats[playerName].gamesPlayed += 1;
                            if (p1.player1 === playerName && p1.player2) stats[playerName].partners.add(p1.player2);
                            else if (p1.player2 === playerName && p1.player1) stats[playerName].partners.add(p1.player1);
                            else if (p2.player1 === playerName && p2.player2) stats[playerName].partners.add(p2.player2);
                            else if (p2.player2 === playerName && p2.player1) stats[playerName].partners.add(p2.player1);
                            if (winnerPairId !== 'draw') {
                                const winningTeamPlayers = [match[winnerPairId].player1, match[winnerPairId].player2];
                                if (winningTeamPlayers.includes(playerName)) {
                                    stats[playerName].gamesWon += 1;
                                }
                            }
                        }
                    });
                });
                playersList.forEach(playerName => {
                    if (stats[playerName]) {
                        const playerSpecificMatches = allMatches.filter(match =>
                            [match.pair1.player1, match.pair1.player2, match.pair2.player1, match.pair2.player2].includes(playerName)
                        );
                        const { currentStreak, longestStreak } = calculateConsecutiveWins(playerSpecificMatches, playerName);
                        stats[playerName].winStreak = currentStreak;
                        stats[playerName].longestStreak = longestStreak;
                        stats[playerName].partners = Array.from(stats[playerName].partners);
                        stats[playerName].efficiency = stats[playerName].gamesPlayed > 0
                            ? parseFloat(((stats[playerName].gamesWon / stats[playerName].gamesPlayed) * 100).toFixed(1))
                            : 0;
                    }
                });
                setPlayerStats(stats);
            } catch (err) {
                console.error("Error fetching insignias data:", err);
                setError("No se pudieron cargar los datos para las insignias.");
            } finally {
                setLoading(false);
            }
        };
        fetchAndProcessResults();
    }, [playersList]);

    const handleTooltipToggle = (key) => {
        setOpenTooltipKey(prevKey => (prevKey === key ? null : key));
    };

    const handleTooltipClose = () => {
        setOpenTooltipKey(null);
    };


    const getAchievementStatus = useCallback((playerName, statType, thresholds) => {
        const playerStatData = playerStats[playerName];
        if (!playerStatData) {
            return { unlocked: 0, value: 0, currentLevelName: null, nextLevelName: null, nextThreshold: null, notEligible: false, progressPercent:0 };
        }
        let value;
        if (statType === 'efficiency') value = playerStatData.efficiency || 0;
        else if (statType === 'partners') value = playerStatData.partners?.length || 0;
        else value = playerStatData[statType] || 0;
        
        let unlocked = 0;
        if (statType === 'efficiency' && playerStatData.gamesPlayed < 5) {
            return { unlocked: 0, value, currentLevelName: null, nextLevelName: thresholds[0], nextThreshold: thresholds[0], notEligible: true, progressPercent: (playerStatData.gamesPlayed/5)*100 };
        }
        thresholds.forEach((threshold, index) => {
            if (value >= threshold) unlocked = index + 1;
        });
        const levelNames = ['Bronce', 'Plata', 'Oro'];
        const currentLevelName = unlocked > 0 ? levelNames[unlocked - 1] : null;
        const nextThreshold = unlocked < thresholds.length ? thresholds[unlocked] : thresholds[thresholds.length - 1];
        const nextLevelName = unlocked < thresholds.length ? levelNames[unlocked] : null;
        let progressPercent = 0;
        if (unlocked < thresholds.length) {
            const base = unlocked > 0 ? thresholds[unlocked-1] : 0;
            const range = nextThreshold - base;
            progressPercent = range > 0 ? ((value - base) / range) * 100 : 0; // Evitar división por cero
        } else {
            progressPercent = 100;
        }
        return { unlocked, value, currentLevelName, nextLevelName, nextThreshold, notEligible: false, progressPercent: Math.min(100, Math.max(0, progressPercent)) };
    }, [playerStats]);

    const achievements = useMemo(() => ({
        gamesPlayed: [10, 25, 50], gamesWon: [10, 20, 30],
        partners: [2, 3, 4], efficiency: [50, 70, 80],
        longestStreak: [3, 5, 7],
    }), []);

    const achievementDetails = useMemo(() => ({
        gamesPlayed: { name: 'Jugador Experimentado', description: 'Total de partidas jugadas.', icon: <SportsTennisIcon /> },
        gamesWon: { name: 'Ganador Consistente', description: 'Total de partidas ganadas.', icon: <EmojiEventsIcon /> },
        partners: { name: 'Compañero Versátil', description: 'Jugado con diferentes compañeros.', icon: <GroupIcon /> },
        efficiency: { name: 'Máquina de Eficiencia', description: '% de victorias. (Req. 5 PJ)', icon: <ShowChartIcon /> },
        longestStreak: { name: 'Racha Imparable', description: 'Victorias consecutivas.', icon: <WhatshotIcon /> },
    }), []);

    const getBadgeColor = useCallback((level) => {
        switch (level) {
            case 1: return '#cd7f32';
            case 2: return '#c0c0c0';
            case 3: return theme.palette.warning.main; 
            default: return theme.palette.grey[400];
        }
    }, [theme]);

    if (loading) return <Container sx={{ py: 4, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Calculando insignias...</Typography></Container>;
    if (error) return <Container sx={{ py: 4, textAlign: 'center' }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ backgroundColor: theme.palette.common.black, color: theme.palette.common.white, padding: theme.spacing(2,3), textAlign: 'center', mb: 4, borderRadius: 2 }}>
                <Typography variant={theme.breakpoints.down('sm') ? "h5" : "h4"} component="h1" sx={{fontWeight: 'bold'}}>
                    Galería de Insignias
                </Typography>
            </Paper>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h6" color="text.secondary">¡Consulta tus logros desbloqueados!</Typography>
            </Box>

            {playersList.map(playerName => (
                <Box key={playerName} sx={{ mb: 5 }}>
                    <Paper elevation={2} sx={{p: 2, borderRadius: 2, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700]: theme.palette.grey[100] }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ 
                            fontWeight: 'medium', 
                            color: theme.palette.common.black, // Título del jugador en negro
                            textAlign: 'center', mb:2 
                        }}>
                            {playerName}
                        </Typography>
                        <Grid container spacing={{xs: 2, sm:3}} justifyContent="center">
                            {Object.keys(achievements).map(achievementKey => {
                                const status = getAchievementStatus(playerName, achievementKey, achievements[achievementKey]);
                                const details = achievementDetails[achievementKey];
                                const badgeColor = getBadgeColor(status.unlocked);
                                const currentTooltipKey = `${playerName}-${achievementKey}`;

                                let progressInfoText = '';
                                if (status.notEligible) {
                                    progressInfoText = `Necesitas ${5 - (playerStats[playerName]?.gamesPlayed || 0)} partidos más para esta insignia.`;
                                } else {
                                    if (achievementKey === 'longestStreak') {
                                        progressInfoText = `Actual: ${playerStats[playerName]?.winStreak || 0} | Récord: ${status.value || 0}`;
                                        if (status.unlocked < achievements[achievementKey].length) progressInfoText += ` | Próximo: ${status.nextThreshold}`;
                                    } else {
                                        progressInfoText = `Valor: ${achievementKey === 'efficiency' ? status.value.toFixed(1) + '%' : Math.round(status.value)}`;
                                        if (status.unlocked < achievements[achievementKey].length) progressInfoText += ` / ${status.nextThreshold}`;
                                    }
                                }
                                
                                const tooltipTitle = (
                                    <Box sx={{p:1}}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{details.name}</Typography>
                                        <Typography variant="body2" sx={{my:0.5}}>{details.description}</Typography>
                                        <Divider sx={{my:1}}/>
                                        {status.currentLevelName && (<Typography variant="body2" sx={{ color: badgeColor, fontWeight:'bold' }}>Nivel: {status.currentLevelName}</Typography>)}
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>{progressInfoText}</Typography>
                                        {!status.notEligible && status.unlocked < achievements[achievementKey].length && (
                                            <LinearProgress variant="determinate" value={status.progressPercent} sx={{height: 8, borderRadius: 4, mt:1, backgroundColor: theme.palette.grey[300], '& .MuiLinearProgress-bar': {backgroundColor: badgeColor} }} />
                                        )}
                                    </Box>
                                );

                                return (
                                    <Grid item xs={6} sm={4} md={2.4} key={achievementKey} sx={{display:'flex', justifyContent:'center'}}>
                                        <ClickAwayListener onClickAway={() => {if(openTooltipKey === currentTooltipKey) handleTooltipClose();}}>
                                            <div> {/* Div extra necesario para ClickAwayListener y Tooltip juntos */}
                                                <Tooltip
                                                    title={tooltipTitle}
                                                    placement="top"
                                                    arrow
                                                    PopperProps={{ disablePortal: true }} // Ayuda con ClickAwayListener
                                                    open={openTooltipKey === currentTooltipKey}
                                                    disableFocusListener // Desactivar para control manual
                                                    disableHoverListener // Desactivar para control manual
                                                    disableTouchListener // Desactivar para control manual
                                                    onClose={handleTooltipClose} // Opcional, si quieres que se cierre con Escape también
                                                >
                                                    <Paper 
                                                        elevation={status.unlocked > 0 ? 4 : 1} 
                                                        onClick={() => handleTooltipToggle(currentTooltipKey)} // <-- ONCLICK AQUÍ
                                                        sx={{ 
                                                            p: {xs:1.5, sm:2}, textAlign: 'center', width: '100%', maxWidth: 140,
                                                            minHeight: 120, display: 'flex', flexDirection: 'column',
                                                            justifyContent: 'center', alignItems: 'center',
                                                            border: `2px solid ${status.notEligible ? theme.palette.grey[300] : badgeColor}`,
                                                            backgroundColor: status.notEligible ? theme.palette.grey[100] : (status.unlocked > 0 ? `${badgeColor}20` : theme.palette.background.paper),
                                                            cursor: 'pointer', // Indicar que es clickeable
                                                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[6] }
                                                        }}
                                                    >
                                                        {React.cloneElement(details.icon, { sx: { fontSize: {xs:32, sm:40}, color: status.notEligible ? theme.palette.grey[400] : badgeColor, mb: 1 } })}
                                                        <Typography variant="caption" component="div" sx={{ fontWeight: 'medium', color: status.notEligible ? 'text.disabled' : 'text.primary', lineHeight: 1.2 }}>
                                                            {details.name}
                                                        </Typography>
                                                        {status.currentLevelName && !status.notEligible && (
                                                            <Typography variant="caption" sx={{color: badgeColor, fontWeight:'bold', mt:0.5}}>
                                                                {status.currentLevelName}
                                                            </Typography>
                                                        )}
                                                    </Paper>
                                                </Tooltip>
                                            </div>
                                        </ClickAwayListener>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Paper>
                </Box>
            ))}

            <Box sx={{ textAlign: 'center', mt: 4, mb:2 }}>
                <Button
                    variant="contained"
                    onClick={() => navigate('/')}
                    sx={{
                        backgroundColor: theme.palette.common.black, // Botón negro
                        color: theme.palette.common.white,           // Texto blanco
                        borderRadius: '30px',
                        padding: '10px 30px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        '&:hover': {
                            backgroundColor: theme.palette.grey[800], // Hover gris oscuro
                        },
                    }}
                >
                    Volver a la Pantalla Principal
                </Button>
            </Box>
        </Container>
    );
};

export default Insignias;