// src/components/Insignias.js
import React, { useState, useCallback, useMemo } from 'react';
import {
    Container,
    Typography,
    Grid,
    Tooltip,
    Box,
    Paper,
    Alert,
    LinearProgress,
    useTheme,
    Divider,
    ClickAwayListener,
    Skeleton,
    IconButton
} from '@mui/material';
import {
    SportsTennis as SportsTennisIcon,
    EmojiEvents as EmojiEventsIcon,
    Group as GroupIcon,
    ShowChart as ShowChartIcon,
    Whatshot as WhatshotIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Importamos el hook para no repetir la lógica de Firebase
import { usePadelResults } from '../hooks/usePadelResults';

// --- FUNCIONES AUXILIARES ---
const getMatchWinner = (sets) => {
    let pair1Wins = 0;
    let pair2Wins = 0;
    if (!sets || !Array.isArray(sets)) return 'pair1'; 

    sets.forEach(set => {
        const p1Score = parseInt(set.pair1Score, 10);
        const p2Score = parseInt(set.pair2Score, 10);
        if (p1Score > p2Score) pair1Wins++;
        else if (p2Score > p1Score) pair2Wins++;
    });
    return pair1Wins > pair2Wins ? 'pair1' : (pair2Wins > pair1Wins ? 'pair2' : 'draw');
};

const calculateConsecutiveWins = (matches, playerName) => {
    if (!Array.isArray(matches) || matches.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }
    // Ordenar cronológicamente
    const chronologicalMatches = [...matches].sort((a, b) => a.date - b.date);

    let currentStreakForPlayer = 0;
    let maxConsecutiveWins = 0;

    chronologicalMatches.forEach(match => {
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
            const p1 = match.pair1; const p2 = match.pair2;
            const playersInGame = [p1.player1, p1.player2, p2.player1, p2.player2];
            if (playersInGame.includes(playerName)) {
                currentStreakForPlayer = 0;
            }
        }
        
        if (currentStreakForPlayer > maxConsecutiveWins) {
            maxConsecutiveWins = currentStreakForPlayer;
        }
    });
    return { currentStreak: currentStreakForPlayer, longestStreak: maxConsecutiveWins };
};

const Insignias = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [openTooltipKey, setOpenTooltipKey] = useState(null);
    
    // 1. USAMOS EL HOOK (Datos centralizados)
    const { results, loading, error } = usePadelResults();
    
    const playersList = useMemo(() => ['Lucas', 'Bort', 'Martin', 'Ricardo'], []);

    // 2. CÁLCULO DE ESTADÍSTICAS
    const playerStats = useMemo(() => {
        if (loading || !results.length) return {};

        const stats = {};
        playersList.forEach(p => {
            stats[p] = { gamesPlayed: 0, gamesWon: 0, partners: new Set(), efficiency: 0, winStreak: 0, longestStreak: 0 };
        });

        results.forEach(match => {
            const winnerPairId = getMatchWinner(match.sets);
            const p1 = match.pair1; 
            const p2 = match.pair2;
            const playersInGame = [p1.player1, p1.player2, p2.player1, p2.player2];

            playersInGame.forEach(playerName => {
                if (stats[playerName]) {
                    stats[playerName].gamesPlayed += 1;
                    if (p1.player1 === playerName && p1.player2) stats[playerName].partners.add(p1.player2);
                    else if (p1.player2 === playerName && p1.player1) stats[playerName].partners.add(p1.player1);
                    else if (p2.player1 === playerName && p2.player2) stats[playerName].partners.add(p2.player2);
                    else if (p2.player2 === playerName && p2.player1) stats[playerName].partners.add(p2.player1);

                    if (winnerPairId !== 'draw') {
                        const winningTeam = [match[winnerPairId].player1, match[winnerPairId].player2];
                        if (winningTeam.includes(playerName)) stats[playerName].gamesWon += 1;
                    }
                }
            });
        });

        playersList.forEach(playerName => {
            if (stats[playerName]) {
                const playerMatches = results.filter(match =>
                    [match.pair1.player1, match.pair1.player2, match.pair2.player1, match.pair2.player2].includes(playerName)
                );
                const { currentStreak, longestStreak } = calculateConsecutiveWins(playerMatches, playerName);
                stats[playerName].winStreak = currentStreak;
                stats[playerName].longestStreak = longestStreak;
                stats[playerName].partners = Array.from(stats[playerName].partners);
                stats[playerName].efficiency = stats[playerName].gamesPlayed > 0
                    ? parseFloat(((stats[playerName].gamesWon / stats[playerName].gamesPlayed) * 100).toFixed(1))
                    : 0;
            }
        });

        return stats;
    }, [results, loading, playersList]);

    const handleTooltipToggle = (key) => setOpenTooltipKey(prev => (prev === key ? null : key));
    const handleTooltipClose = () => setOpenTooltipKey(null);

    const getAchievementStatus = useCallback((playerName, statType, thresholds) => {
        const pStats = playerStats[playerName];
        if (!pStats) return { unlocked: 0, value: 0, notEligible: false, progressPercent: 0 };

        let value = 0;
        if (statType === 'efficiency') value = pStats.efficiency || 0;
        else if (statType === 'partners') value = pStats.partners?.length || 0;
        else value = pStats[statType] || 0;
        
        if (statType === 'efficiency' && pStats.gamesPlayed < 5) {
            return { unlocked: 0, value, nextThreshold: thresholds[0], notEligible: true, progressPercent: (pStats.gamesPlayed/5)*100 };
        }

        let unlocked = 0;
        thresholds.forEach((t, i) => { if (value >= t) unlocked = i + 1; });

        const levelNames = ['Bronce', 'Plata', 'Oro'];
        const currentLevelName = unlocked > 0 ? levelNames[unlocked - 1] : null;
        const nextThreshold = unlocked < thresholds.length ? thresholds[unlocked] : thresholds[thresholds.length - 1];
        
        let progressPercent = 0;
        if (unlocked < thresholds.length) {
            const base = unlocked > 0 ? thresholds[unlocked-1] : 0;
            const range = nextThreshold - base;
            progressPercent = range > 0 ? ((value - base) / range) * 100 : 0;
        } else {
            progressPercent = 100;
        }

        return { unlocked, value, currentLevelName, nextThreshold, notEligible: false, progressPercent: Math.min(100, Math.max(0, progressPercent)) };
    }, [playerStats]);

    const achievements = useMemo(() => ({
        gamesPlayed: [10, 25, 50], gamesWon: [10, 20, 30],
        partners: [2, 3, 4], efficiency: [50, 60, 75],
        longestStreak: [3, 5, 7],
    }), []);

    const achievementDetails = useMemo(() => ({
        gamesPlayed: { name: 'Veterano', description: 'Partidos jugados totales.', icon: <SportsTennisIcon /> },
        gamesWon: { name: 'Ganador', description: 'Victorias acumuladas.', icon: <EmojiEventsIcon /> },
        partners: { name: 'Sociable', description: 'Compañeros distintos.', icon: <GroupIcon /> },
        efficiency: { name: 'Efectivo', description: '% Victorias (Min 5 PJ).', icon: <ShowChartIcon /> },
        longestStreak: { name: 'En Racha', description: 'Victorias seguidas (Récord).', icon: <WhatshotIcon /> },
    }), []);

    const getBadgeColor = (level) => {
        switch (level) {
            case 1: return '#CD7F32'; // Bronce
            case 2: return '#C0C0C0'; // Plata
            case 3: return '#FFD700'; // Oro
            default: return theme.palette.grey[300];
        }
    };

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

    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container sx={{ py: 3, pb: 8 }}>
            <Paper elevation={0} sx={headerStyle}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                    Galería de Trofeos
                </Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    Desbloquea logros jugando y ganando
                </Typography>
            </Paper>

            {loading ? (
                <Grid container spacing={4}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} key={i}>
                             <Skeleton variant="rectangular" height={40} width={150} sx={{ mb: 2, borderRadius: 1, mx: 'auto' }} />
                             <Grid container spacing={2} justifyContent="center">
                                {[1,2,3,4,5].map(j => (
                                    <Grid item xs={6} sm={4} md={2.4} key={j}>
                                        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                                    </Grid>
                                ))}
                             </Grid>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                playersList.map(playerName => (
                    <Box key={playerName} sx={{ mb: 6 }}>
                        <Typography variant="h5" component="h2" gutterBottom sx={{ 
                            fontWeight: 700, 
                            textAlign: 'center', 
                            mb: 3,
                            color: theme.palette.text.primary,
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            {playerName}
                        </Typography>
                        
                        <Grid container spacing={2} justifyContent="center">
                            {Object.keys(achievements).map(achievementKey => {
                                const status = getAchievementStatus(playerName, achievementKey, achievements[achievementKey]);
                                const details = achievementDetails[achievementKey];
                                const badgeColor = getBadgeColor(status.unlocked);
                                const currentTooltipKey = `${playerName}-${achievementKey}`;
                                
                                // --- LÓGICA DEL MENSAJE DE PROGRESO ---
                                let progressText = '';
                                let remainingText = '';
                                const levelNames = ['Bronce', 'Plata', 'Oro'];
                                
                                if (status.notEligible) {
                                    progressText = `Necesitas ${5 - (playerStats[playerName]?.gamesPlayed || 0)} partidos más.`;
                                } else if (status.unlocked >= 3) {
                                    progressText = `¡Máximo nivel alcanzado! (${status.value})`;
                                } else {
                                    // Calculamos lo que falta
                                    const isEfficiency = achievementKey === 'efficiency';
                                    const nextLevelName = levelNames[status.unlocked]; // 0->Bronce, 1->Plata...
                                    
                                    const currentVal = isEfficiency ? status.value.toFixed(1) + '%' : status.value;
                                    const targetVal = isEfficiency ? status.nextThreshold + '%' : status.nextThreshold;
                                    
                                    const diff = status.nextThreshold - status.value;
                                    // Para eficiencia usamos decimal, para el resto entero
                                    const diffDisplay = isEfficiency ? diff.toFixed(1) + '%' : Math.ceil(diff);

                                    progressText = `Actual: ${currentVal} / Meta: ${targetVal}`;
                                    // Mensaje motivacional
                                    remainingText = `Faltan ${diffDisplay} para ${nextLevelName}`;
                                }

                                return (
                                    <Grid item xs={6} sm={4} md={2.4} key={achievementKey} sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <ClickAwayListener onClickAway={() => { if (openTooltipKey === currentTooltipKey) handleTooltipClose(); }}>
                                            <div style={{ width: '100%', maxWidth: 140 }}>
                                                <Tooltip
                                                    title={
                                                        <Box sx={{ p: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold">{details.name}</Typography>
                                                            <Typography variant="caption" display="block" sx={{ mb: 1, color: 'grey.300' }}>{details.description}</Typography>
                                                            
                                                            {status.currentLevelName && (
                                                                <Typography variant="caption" sx={{ color: badgeColor, fontWeight: 'bold', display:'block' }}>
                                                                    Nivel {status.currentLevelName}
                                                                </Typography>
                                                            )}
                                                            
                                                            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                                                            
                                                            <Typography variant="caption" display="block">
                                                                {progressText}
                                                            </Typography>
                                                            
                                                            {remainingText && (
                                                                <Typography variant="caption" display="block" sx={{ color: theme.palette.secondary.light, fontWeight: 'bold', mt: 0.5 }}>
                                                                    {remainingText}
                                                                </Typography>
                                                            )}

                                                            {!status.notEligible && status.unlocked < 3 && (
                                                                <LinearProgress 
                                                                    variant="determinate" 
                                                                    value={status.progressPercent} 
                                                                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: 'grey.700', '& .MuiLinearProgress-bar': { bgcolor: badgeColor } }} 
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    placement="top"
                                                    arrow
                                                    open={openTooltipKey === currentTooltipKey}
                                                    disableFocusListener disableHoverListener disableTouchListener
                                                    onClose={handleTooltipClose}
                                                >
                                                    <Paper
                                                        elevation={status.unlocked > 0 ? 4 : 0}
                                                        onClick={() => handleTooltipToggle(currentTooltipKey)}
                                                        sx={{
                                                            p: 2,
                                                            height: '100%',
                                                            minHeight: 130,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textAlign: 'center',
                                                            borderRadius: 3,
                                                            border: `2px solid ${status.notEligible ? theme.palette.divider : badgeColor}`,
                                                            bgcolor: status.notEligible ? theme.palette.action.disabledBackground : (status.unlocked > 0 ? `${badgeColor}15` : theme.palette.background.paper),
                                                            transition: 'all 0.2s',
                                                            cursor: 'pointer',
                                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] }
                                                        }}
                                                    >
                                                        {React.cloneElement(details.icon, { 
                                                            sx: { 
                                                                fontSize: 40, 
                                                                color: status.notEligible ? theme.palette.action.disabled : badgeColor, 
                                                                mb: 1,
                                                                filter: status.unlocked > 0 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                                                            } 
                                                        })}
                                                        <Typography variant="caption" fontWeight="bold" sx={{ lineHeight: 1.2, color: theme.palette.text.primary }}>
                                                            {details.name}
                                                        </Typography>
                                                        {status.currentLevelName && !status.notEligible && (
                                                            <Typography variant="caption" sx={{ color: badgeColor, fontWeight: 'bold', mt: 0.5, fontSize: '0.7rem' }}>
                                                                {status.currentLevelName.toUpperCase()}
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
                    </Box>
                ))
            )}
        </Container>
    );
};

export default Insignias;