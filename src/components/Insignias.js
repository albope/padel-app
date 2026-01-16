// Insignias.js
// Premium Trophy Cabinet with 3D Shelf Perspective and Unlock Animations

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container,
    Typography,
    Tooltip,
    Box,
    Paper,
    CircularProgress,
    Alert,
    LinearProgress,
    useTheme,
    Divider,
    ClickAwayListener,
    alpha,
} from '@mui/material';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import LockIcon from '@mui/icons-material/Lock';
import DiamondIcon from '@mui/icons-material/Diamond';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

// Context
import { useData } from '../context/DataContext';

// Theme tokens
import { tokens } from '../theme';

// Haptic feedback
import { hapticSuccess, hapticMedium } from '../utils/haptics';

// --- HELPER FUNCTIONS ---
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

// ============================================================================
// BADGE RARITY CONFIGURATION - 5 TIERS
// ============================================================================
const RARITY_TIERS = {
    1: {
        name: 'Bronce',
        color: '#CD7F32',
        glow: 'rgba(205, 127, 50, 0.4)',
        labelBg: 'rgba(205, 127, 50, 0.35)',
        labelColor: '#FFD9B3',
    },
    2: {
        name: 'Plata',
        color: '#C0C0C0',
        glow: 'rgba(192, 192, 192, 0.4)',
        labelBg: 'rgba(192, 192, 192, 0.35)',
        labelColor: '#FFFFFF',
    },
    3: {
        name: 'Oro',
        color: '#FFD700',
        glow: 'rgba(255, 215, 0, 0.5)',
        labelBg: 'rgba(255, 215, 0, 0.35)',
        labelColor: '#FFF8DC',
    },
    4: {
        name: 'Platino',
        color: '#00FFFF', // Cyan brillante
        secondaryColor: '#E040FB', // Púrpura
        glow: 'rgba(0, 255, 255, 0.6)',
        labelBg: 'linear-gradient(135deg, rgba(0, 255, 255, 0.5) 0%, rgba(224, 64, 251, 0.5) 100%)',
        labelColor: '#FFFFFF',
        isPremium: true,
    },
    5: {
        name: 'Diamante',
        color: '#B9F2FF',
        glow: 'rgba(185, 242, 255, 0.6)',
        labelBg: 'rgba(185, 242, 255, 0.35)',
        labelColor: '#FFFFFF',
    },
};

// ============================================================================
// 3D BADGE COMPONENT
// ============================================================================
const Badge3D = ({
    icon,
    name,
    level,
    isLocked,
    notEligible,
    progressPercent,
    onClick,
    isSelected,
    isNewUnlock
}) => {
    const theme = useTheme();
    const rarity = RARITY_TIERS[level] || { name: 'Bloqueado', color: theme.palette.grey[500], glow: 'transparent' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isLocked ? {
                scale: 1.08,
                rotateY: 5,
                z: 20,
            } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            onClick={onClick}
            style={{
                cursor: 'pointer',
                perspective: '1000px',
                transformStyle: 'preserve-3d',
            }}
        >
            <Paper
                elevation={isLocked ? 1 : level >= 4 ? 12 : level >= 3 ? 8 : 4}
                sx={{
                    p: 2,
                    textAlign: 'center',
                    width: 120,
                    height: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 3,
                    background: isLocked
                        ? `linear-gradient(145deg, ${alpha(theme.palette.grey[800], 0.9)} 0%, ${alpha(theme.palette.grey[900], 0.95)} 100%)`
                        : level === 4
                            ? `linear-gradient(145deg, ${alpha('#0D1B2A', 0.98)} 0%, ${alpha('#1B263B', 0.95)} 50%, ${alpha('#0D1B2A', 0.98)} 100%)`
                            : `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
                    border: isLocked
                        ? `2px solid ${alpha(theme.palette.grey[600], 0.3)}`
                        : level === 4
                            ? `2px solid transparent`
                            : `2px solid ${alpha(rarity.color, 0.6)}`,
                    // Platino: borde gradiente especial
                    ...(level === 4 && !isLocked && {
                        backgroundImage: `linear-gradient(145deg, #0D1B2A, #1B263B), linear-gradient(135deg, #00FFFF 0%, #E040FB 50%, #00FFFF 100%)`,
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box',
                    }),
                    boxShadow: isSelected
                        ? level === 4
                            ? `0 0 40px rgba(0, 255, 255, 0.6), 0 0 60px rgba(224, 64, 251, 0.4), 0 8px 32px rgba(0, 255, 255, 0.5)`
                            : `0 0 30px ${rarity.glow}, 0 8px 32px ${alpha(rarity.color, 0.4)}`
                        : isLocked
                            ? 'none'
                            : level === 4
                                ? `0 0 25px rgba(0, 255, 255, 0.4), 0 0 40px rgba(224, 64, 251, 0.2)`
                                : `0 4px 20px ${alpha(rarity.color, 0.2)}`,
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'translateY(-8px)' : 'none',
                    // Shimmer effect para nivel 3+
                    '&::before': !isLocked && level >= 3 ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '200%',
                        height: '100%',
                        background: level === 4
                            ? `linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), rgba(224, 64, 251, 0.2), transparent)`
                            : `linear-gradient(90deg, transparent, ${alpha(rarity.color, 0.2)}, transparent)`,
                        animation: level === 4 ? 'shimmerPlatinum 2s infinite' : 'shimmer 3s infinite',
                        '@keyframes shimmer': {
                            '0%': { transform: 'translateX(-100%)' },
                            '100%': { transform: 'translateX(100%)' },
                        },
                        '@keyframes shimmerPlatinum': {
                            '0%': { transform: 'translateX(-100%)' },
                            '100%': { transform: 'translateX(100%)' },
                        },
                    } : {},
                    // Aura pulsante para Platino
                    '&::after': !isLocked && level === 4 ? {
                        content: '""',
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        borderRadius: 'inherit',
                        background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.3) 0%, rgba(224, 64, 251, 0.3) 50%, rgba(0, 255, 255, 0.3) 100%)',
                        zIndex: -1,
                        animation: 'pulsePlatinum 2s ease-in-out infinite',
                        '@keyframes pulsePlatinum': {
                            '0%, 100%': { opacity: 0.5, transform: 'scale(1)' },
                            '50%': { opacity: 1, transform: 'scale(1.02)' },
                        },
                    } : {},
                }}
            >
                {/* Spotlight effect for unlocked badges */}
                {!isLocked && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -50,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 100,
                            height: 100,
                            background: `radial-gradient(circle, ${alpha(rarity.color, 0.3)} 0%, transparent 70%)`,
                            pointerEvents: 'none',
                        }}
                    />
                )}

                {/* Badge Icon */}
                <Box
                    sx={{
                        position: 'relative',
                        mb: 1,
                    }}
                >
                    {isLocked ? (
                        <Box sx={{ position: 'relative' }}>
                            <Box
                                sx={{
                                    opacity: 0.2,
                                    filter: 'grayscale(100%)',
                                }}
                            >
                                {React.cloneElement(icon, {
                                    sx: { fontSize: 40, color: theme.palette.grey[600] }
                                })}
                            </Box>
                            <LockIcon
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: 24,
                                    color: theme.palette.grey[500],
                                }}
                            />
                        </Box>
                    ) : (
                        <motion.div
                            animate={isNewUnlock ? {
                                rotate: [0, -10, 10, -10, 10, 0],
                                scale: [1, 1.2, 1],
                            } : level === 4 ? {
                                scale: [1, 1.05, 1],
                            } : {}}
                            transition={level === 4 ? {
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            } : { duration: 0.5 }}
                        >
                            {React.cloneElement(icon, {
                                sx: {
                                    fontSize: 44,
                                    color: rarity.color,
                                    filter: level >= 4
                                        ? `drop-shadow(0 0 6px ${rarity.color}) drop-shadow(0 0 12px ${rarity.glow})`
                                        : level >= 3
                                            ? `drop-shadow(0 0 8px ${rarity.glow})`
                                            : 'none',
                                }
                            })}
                        </motion.div>
                    )}
                </Box>

                {/* Badge Name */}
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 600,
                        color: isLocked ? theme.palette.grey[500] : theme.palette.text.primary,
                        lineHeight: 1.2,
                        fontSize: '0.7rem',
                        textAlign: 'center',
                    }}
                >
                    {isLocked ? '???' : name}
                </Typography>

                {/* Rarity Label */}
                {!isLocked && level > 0 && (
                    <Box
                        sx={{
                            mt: 0.5,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            background: rarity.labelBg || alpha(rarity.color, 0.35),
                            border: level === 4
                                ? '1px solid rgba(0, 255, 255, 0.6)'
                                : `1px solid ${alpha(rarity.color, 0.5)}`,
                            boxShadow: level === 4
                                ? '0 0 8px rgba(0, 255, 255, 0.4), inset 0 0 6px rgba(224, 64, 251, 0.2)'
                                : level >= 3
                                    ? `0 0 6px ${alpha(rarity.color, 0.3)}`
                                    : 'none',
                            position: 'relative',
                            overflow: 'hidden',
                            // Shimmer para Platino
                            ...(level === 4 && {
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '200%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'labelShimmer 1.5s infinite',
                                    '@keyframes labelShimmer': {
                                        '0%': { transform: 'translateX(-100%)' },
                                        '100%': { transform: 'translateX(100%)' },
                                    },
                                },
                            }),
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                fontFamily: tokens.typography.displayFont,
                                fontSize: '0.7rem',
                                color: rarity.labelColor || '#FFFFFF',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textShadow: level === 4
                                    ? '0 0 8px rgba(0, 255, 255, 0.8)'
                                    : level >= 3
                                        ? `0 0 4px ${alpha(rarity.color, 0.6)}`
                                        : 'none',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {rarity.name.toUpperCase()}
                        </Typography>
                    </Box>
                )}

                {/* Progress bar for locked badges */}
                {isLocked && !notEligible && (
                    <Box sx={{ width: '80%', mt: 1 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.grey[600], 0.3),
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: theme.palette.grey[400],
                                    borderRadius: 2,
                                },
                            }}
                        />
                    </Box>
                )}

                {/* Not eligible indicator */}
                {notEligible && (
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.55rem',
                            color: theme.palette.grey[500],
                            mt: 0.5,
                        }}
                    >
                        Min. 5 PJ
                    </Typography>
                )}
            </Paper>
        </motion.div>
    );
};

// ============================================================================
// PLAYER SHELF COMPONENT - 3D Perspective Trophy Cabinet
// ============================================================================
const PlayerShelf = ({ playerName, achievements, getAchievementStatus, achievementDetails, playerStats }) => {
    const theme = useTheme();
    const [openTooltipKey, setOpenTooltipKey] = useState(null);

    const handleBadgeClick = (key) => {
        hapticMedium();
        setOpenTooltipKey(prev => prev === key ? null : key);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Paper
                elevation={6}
                sx={{
                    mb: 4,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.98)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    position: 'relative',
                }}
            >
                {/* Player Name Header */}
                <Box
                    sx={{
                        py: 2,
                        px: 3,
                        background: `linear-gradient(90deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, transparent 50%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                        borderBottom: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                        textAlign: 'center',
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontFamily: tokens.typography.displayFont,
                            color: theme.palette.secondary.main,
                            letterSpacing: '0.1em',
                        }}
                    >
                        {playerName.toUpperCase()}
                    </Typography>
                </Box>

                {/* 3D Shelf Container */}
                <Box
                    sx={{
                        p: 3,
                        perspective: '1000px',
                        position: 'relative',
                    }}
                >
                    {/* Shelf surface with 3D effect */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 2,
                            py: 3,
                            px: 2,
                            position: 'relative',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: '5%',
                                width: '90%',
                                height: 8,
                                background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.3)} 0%, transparent 100%)`,
                                borderRadius: '50%',
                                filter: 'blur(4px)',
                            },
                        }}
                    >
                        {Object.keys(achievements).map((achievementKey) => {
                            const status = getAchievementStatus(playerName, achievementKey, achievements[achievementKey]);
                            const details = achievementDetails[achievementKey];
                            const tooltipKey = `${playerName}-${achievementKey}`;
                            const isSelected = openTooltipKey === tooltipKey;

                            let progressInfoText = '';
                            if (status.notEligible) {
                                progressInfoText = `Necesitas ${5 - (playerStats[playerName]?.gamesPlayed || 0)} partidos más.`;
                            } else {
                                if (achievementKey === 'longestStreak') {
                                    progressInfoText = `Actual: ${playerStats[playerName]?.winStreak || 0} | Récord: ${status.value || 0}`;
                                    if (status.unlocked < achievements[achievementKey].length) {
                                        progressInfoText += ` | Próximo: ${status.nextThreshold}`;
                                    }
                                } else {
                                    progressInfoText = `Valor: ${achievementKey === 'efficiency' ? status.value.toFixed(1) + '%' : Math.round(status.value)}`;
                                    if (status.unlocked < achievements[achievementKey].length) {
                                        progressInfoText += ` / ${status.nextThreshold}`;
                                    }
                                }
                            }

                            const tooltipContent = (
                                <Box sx={{ p: 1.5 }}>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontFamily: tokens.typography.displayFont,
                                            fontWeight: 'bold',
                                            color: status.unlocked > 0
                                                ? RARITY_TIERS[status.unlocked]?.color
                                                : theme.palette.text.primary,
                                        }}
                                    >
                                        {details.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ my: 0.5, opacity: 0.9 }}>
                                        {details.description}
                                    </Typography>
                                    <Divider sx={{ my: 1, borderColor: alpha('#fff', 0.2) }} />
                                    {status.currentLevelName && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: RARITY_TIERS[status.unlocked]?.color,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            Nivel: {status.currentLevelName}
                                        </Typography>
                                    )}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            color: 'text.secondary',
                                            mt: 0.5,
                                        }}
                                    >
                                        {progressInfoText}
                                    </Typography>
                                    {!status.notEligible && status.unlocked < achievements[achievementKey].length && (
                                        <LinearProgress
                                            variant="determinate"
                                            value={status.progressPercent}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                mt: 1.5,
                                                backgroundColor: alpha('#fff', 0.2),
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: status.unlocked > 0
                                                        ? RARITY_TIERS[status.unlocked]?.color
                                                        : theme.palette.grey[400],
                                                    borderRadius: 3,
                                                },
                                            }}
                                        />
                                    )}
                                </Box>
                            );

                            return (
                                <ClickAwayListener
                                    key={achievementKey}
                                    onClickAway={() => {
                                        if (openTooltipKey === tooltipKey) setOpenTooltipKey(null);
                                    }}
                                >
                                    <div>
                                        <Tooltip
                                            title={tooltipContent}
                                            placement="top"
                                            arrow
                                            open={isSelected}
                                            disableFocusListener
                                            disableHoverListener
                                            disableTouchListener
                                            PopperProps={{
                                                sx: {
                                                    '& .MuiTooltip-tooltip': {
                                                        backgroundColor: alpha(theme.palette.primary.dark, 0.95),
                                                        backdropFilter: 'blur(10px)',
                                                        maxWidth: 280,
                                                    },
                                                },
                                            }}
                                        >
                                            <div>
                                                <Badge3D
                                                    icon={details.icon}
                                                    name={details.name}
                                                    level={status.unlocked}
                                                    isLocked={status.unlocked === 0}
                                                    notEligible={status.notEligible}
                                                    progressPercent={status.progressPercent}
                                                    onClick={() => handleBadgeClick(tooltipKey)}
                                                    isSelected={isSelected}
                                                />
                                            </div>
                                        </Tooltip>
                                    </div>
                                </ClickAwayListener>
                            );
                        })}
                    </Box>
                </Box>
            </Paper>
        </motion.div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Insignias = () => {
    const theme = useTheme();
    const { results, loading, error } = useData();
    const [playerStats, setPlayerStats] = useState({});
    const [statsCalculated, setStatsCalculated] = useState(false);
    const playersList = useMemo(() => ['Lucas', 'Bort', 'Martin', 'Ricardo'], []);

    // Calculate badge stats when data is available
    useEffect(() => {
        if (loading || statsCalculated || results.length === 0) return;

        const allMatches = [...results].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
        const stats = {};

        playersList.forEach(playerName => {
            stats[playerName] = {
                gamesPlayed: 0, gamesWon: 0, partners: new Set(),
                efficiency: 0, winStreak: 0, longestStreak: 0,
            };
        });

        allMatches.forEach(match => {
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
        setStatsCalculated(true);
    }, [results, loading, statsCalculated, playersList]);

    const getAchievementStatus = useCallback((playerName, statType, thresholds) => {
        const playerStatData = playerStats[playerName];
        if (!playerStatData) {
            return { unlocked: 0, value: 0, currentLevelName: null, nextLevelName: null, nextThreshold: null, notEligible: false, progressPercent: 0 };
        }
        let value;
        if (statType === 'efficiency') value = playerStatData.efficiency || 0;
        else if (statType === 'partners') value = playerStatData.partners?.length || 0;
        else value = playerStatData[statType] || 0;

        let unlocked = 0;
        if (statType === 'efficiency' && playerStatData.gamesPlayed < 5) {
            return { unlocked: 0, value, currentLevelName: null, nextLevelName: thresholds[0], nextThreshold: thresholds[0], notEligible: true, progressPercent: (playerStatData.gamesPlayed / 5) * 100 };
        }
        thresholds.forEach((threshold, index) => {
            if (value >= threshold) unlocked = index + 1;
        });

        // Map to 5-tier system
        const levelNames = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'];
        const currentLevelName = unlocked > 0 ? levelNames[unlocked - 1] : null;
        const nextThreshold = unlocked < thresholds.length ? thresholds[unlocked] : thresholds[thresholds.length - 1];
        const nextLevelName = unlocked < thresholds.length ? levelNames[unlocked] : null;

        let progressPercent = 0;
        if (unlocked < thresholds.length) {
            const base = unlocked > 0 ? thresholds[unlocked - 1] : 0;
            const range = nextThreshold - base;
            progressPercent = range > 0 ? ((value - base) / range) * 100 : 0;
        } else {
            progressPercent = 100;
        }

        return {
            unlocked,
            value,
            currentLevelName,
            nextLevelName,
            nextThreshold,
            notEligible: false,
            progressPercent: Math.min(100, Math.max(0, progressPercent))
        };
    }, [playerStats]);

    // Extended achievements with 5 tiers
    const achievements = useMemo(() => ({
        gamesPlayed: [10, 25, 50, 75, 100],
        gamesWon: [10, 20, 35, 50, 75],
        partners: [2, 3, 4, 5, 6],
        efficiency: [50, 60, 70, 80, 90],
        longestStreak: [3, 5, 7, 10, 15],
    }), []);

    const achievementDetails = useMemo(() => ({
        gamesPlayed: { name: 'Veterano', description: 'Total de partidas jugadas.', icon: <SportsTennisIcon /> },
        gamesWon: { name: 'Campeón', description: 'Total de partidas ganadas.', icon: <EmojiEventsIcon /> },
        partners: { name: 'Sociable', description: 'Compañeros diferentes.', icon: <GroupIcon /> },
        efficiency: { name: 'Eficiencia', description: '% de victorias. (Min. 5 PJ)', icon: <ShowChartIcon /> },
        longestStreak: { name: 'Racha', description: 'Victorias consecutivas.', icon: <WhatshotIcon /> },
    }), []);

    if (loading || !statsCalculated) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress color="secondary" size={48} />
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                    Cargando gabinete de trofeos...
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container sx={{ py: 3, pb: 10 }}>
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper
                    elevation={8}
                    sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
                        color: theme.palette.text.primary,
                        p: 3,
                        textAlign: 'center',
                        mb: 4,
                        borderRadius: 4,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative line */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${tokens.colors.electricLime.main} 50%, ${theme.palette.secondary.main} 100%)`,
                        }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                        <DiamondIcon sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
                        <Typography
                            variant="h4"
                            sx={{
                                fontFamily: tokens.typography.displayFont,
                                letterSpacing: '0.1em',
                                color: theme.palette.secondary.main,
                            }}
                        >
                            GABINETE DE TROFEOS
                        </Typography>
                        <DiamondIcon sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Desbloquea insignias alcanzando nuevos logros
                    </Typography>

                    {/* Rarity Legend */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 2,
                            mt: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        {Object.entries(RARITY_TIERS).map(([level, tier]) => (
                            <Box
                                key={level}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: tier.isPremium ? 1 : 0,
                                    py: tier.isPremium ? 0.25 : 0,
                                    borderRadius: tier.isPremium ? 2 : 0,
                                    background: tier.isPremium
                                        ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(224, 64, 251, 0.15) 100%)'
                                        : 'transparent',
                                    border: tier.isPremium ? '1px solid rgba(0, 255, 255, 0.3)' : 'none',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: tier.isPremium ? 14 : 12,
                                        height: tier.isPremium ? 14 : 12,
                                        borderRadius: '50%',
                                        background: tier.isPremium
                                            ? 'linear-gradient(135deg, #00FFFF 0%, #E040FB 100%)'
                                            : tier.color,
                                        boxShadow: tier.isPremium
                                            ? '0 0 10px rgba(0, 255, 255, 0.6), 0 0 15px rgba(224, 64, 251, 0.4)'
                                            : `0 0 6px ${tier.glow}`,
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: tier.isPremium ? '0.7rem' : '0.65rem',
                                        color: tier.isPremium ? '#00FFFF' : tier.labelColor || tier.color,
                                        fontWeight: tier.isPremium ? 700 : 600,
                                        textShadow: tier.isPremium ? '0 0 6px rgba(0, 255, 255, 0.6)' : 'none',
                                    }}
                                >
                                    {tier.name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </motion.div>

            {/* Player Shelves */}
            <AnimatePresence>
                {playersList.map((playerName, index) => (
                    <motion.div
                        key={playerName}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15, duration: 0.4 }}
                    >
                        <PlayerShelf
                            playerName={playerName}
                            achievements={achievements}
                            getAchievementStatus={getAchievementStatus}
                            achievementDetails={achievementDetails}
                            playerStats={playerStats}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </Container>
    );
};

export default Insignias;
