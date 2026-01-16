// src/components/MatchCard.js - Premium "Athletic Luxury Club" Design
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents,
  Edit,
  Delete,
  ContentCopy,
  Share,
  ExpandMore,
  ExpandLess,
  LocationOn,
  CalendarToday,
  Person,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { hapticLight, hapticMedium, hapticError } from '../utils/haptics';
import { tokens } from '../theme';

dayjs.locale('es');

// ============================================================================
// UTILITY: Victory Confetti Animation
// ============================================================================
const fireVictoryConfetti = (element) => {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  // Championship Gold confetti burst
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x, y },
    colors: ['#D4AF37', '#FFD700', '#E6C96E', '#CCFF00'],
    ticks: 150,
    gravity: 1.2,
    scalar: 0.8,
  });

  // Secondary burst with delay
  setTimeout(() => {
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { x, y },
      colors: ['#D4AF37', '#B8941F'],
      ticks: 100,
      gravity: 1,
      scalar: 0.6,
    });
  }, 150);
};

// ============================================================================
// HOOK: Swipe Detection with Premium Feedback
// ============================================================================
const useSwipe = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e) => {
    if (!swiping) return;
    touchEndX.current = e.touches[0].clientX;
    const diff = touchEndX.current - touchStartX.current;
    const progress = Math.min(Math.abs(diff) / threshold, 1);
    setSwipeProgress(progress);

    if (diff > 20) {
      setSwipeDirection('right');
    } else if (diff < -20) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const onTouchEnd = () => {
    const diff = touchEndX.current - touchStartX.current;

    if (diff > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (diff < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setSwiping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swiping,
    swipeDirection,
    swipeProgress,
  };
};

// ============================================================================
// UTILITY: Match Winner Determination
// ============================================================================
const getMatchWinner = (sets) => {
  if (!sets || !Array.isArray(sets)) return null;
  let pair1Wins = 0;
  let pair2Wins = 0;

  sets.forEach((set) => {
    const p1Score = parseInt(set.pair1Score, 10);
    const p2Score = parseInt(set.pair2Score, 10);
    if (p1Score > p2Score) pair1Wins++;
    else if (p2Score > p1Score) pair2Wins++;
  });

  if (pair1Wins > pair2Wins) return 'pair1';
  if (pair2Wins > pair1Wins) return 'pair2';
  return null;
};

// ============================================================================
// COMPONENT: Premium SetBadge with Space Mono
// ============================================================================
const SetBadge = React.memo(({ pair1Score, pair2Score, setNumber, theme }) => {
  const pair1Wins = parseInt(pair1Score, 10) > parseInt(pair2Score, 10);
  const pair2Wins = parseInt(pair2Score, 10) > parseInt(pair1Score, 10);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 50,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: tokens.typography.bodyFont,
          color: theme.palette.text.secondary,
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          mb: 0.5,
        }}
      >
        Set {setNumber}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {/* Score Pair 1 */}
        <Box
          sx={{
            fontFamily: tokens.typography.monoFont,
            fontSize: '1.125rem',
            fontWeight: 700,
            minWidth: 40,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            backgroundColor: pair1Wins
              ? alpha(theme.palette.success.main, 0.15)
              : alpha(theme.palette.grey[500], 0.08),
            color: pair1Wins
              ? theme.palette.success.dark
              : theme.palette.text.secondary,
            border: pair1Wins
              ? `2px solid ${theme.palette.success.main}`
              : `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
            boxShadow: pair1Wins ? theme.shadows[16] : 'none', // Gold glow
            transition: 'all 0.3s ease',
          }}
        >
          {pair1Score}
        </Box>

        {/* Score Pair 2 */}
        <Box
          sx={{
            fontFamily: tokens.typography.monoFont,
            fontSize: '1.125rem',
            fontWeight: 700,
            minWidth: 40,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            backgroundColor: pair2Wins
              ? alpha(theme.palette.success.main, 0.15)
              : alpha(theme.palette.grey[500], 0.08),
            color: pair2Wins
              ? theme.palette.success.dark
              : theme.palette.text.secondary,
            border: pair2Wins
              ? `2px solid ${theme.palette.success.main}`
              : `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
            boxShadow: pair2Wins ? theme.shadows[16] : 'none', // Gold glow
            transition: 'all 0.3s ease',
          }}
        >
          {pair2Score}
        </Box>
      </Box>
    </Box>
  );
});

// ============================================================================
// COMPONENT: Premium Team Display with Diagonal Design
// ============================================================================
const TeamDisplay = React.memo(({ pair, isWinner, position, theme }) => {
  const players = [pair?.player1 || 'N/A', pair?.player2 || 'N/A'];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: position === 'left' ? 'flex-start' : 'flex-end',
        textAlign: position === 'left' ? 'left' : 'right',
        p: 2,
        borderRadius: 2,
        position: 'relative',
        background: isWinner
          ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`
          : 'transparent',
        border: isWinner
          ? `2px solid ${theme.palette.success.main}`
          : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        transition: 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
        // Premium shadow for winners
        boxShadow: isWinner ? theme.shadows[16] : 'none',
        // Subtle transform on winner
        transform: isWinner ? 'scale(1.02)' : 'scale(1)',
        // Noise texture overlay
        '&::before': isWinner ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
          opacity: 0.03,
          pointerEvents: 'none',
          borderRadius: 2,
        } : {},
      }}
    >
      {/* Winner Trophy Badge */}
      {isWinner && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: theme.shadows[18], // Championship glow
            }}
          >
            <EmojiEvents
              sx={{
                fontSize: '1.125rem',
                color: theme.palette.success.contrastText,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.displayFont,
                color: theme.palette.success.contrastText,
                fontWeight: 400,
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
              }}
            >
              Victoria
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Player Names */}
      {players.map((player, idx) => (
        <Typography
          key={idx}
          variant="body1"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            fontWeight: isWinner ? 600 : 500,
            fontSize: '1rem',
            color: isWinner
              ? theme.palette.text.primary
              : theme.palette.text.secondary,
            lineHeight: 1.5,
            letterSpacing: '0.01em',
            mb: idx === 0 ? 0.5 : 0,
          }}
        >
          {player}
        </Typography>
      ))}
    </Box>
  );
});

// ============================================================================
// MAIN COMPONENT: Premium MatchCard
// ============================================================================
const MatchCard = React.memo(({
  result,
  onEdit,
  onDelete,
  onClone,
  onShare,
  category,
  isNew = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showVictoryAnimation, setShowVictoryAnimation] = useState(false);
  const cardRef = useRef(null);

  const winner = getMatchWinner(result.sets);
  const dateObj = result.date?.toDate ? result.date.toDate() : new Date(result.date);

  // Victory confetti on new match (once)
  useEffect(() => {
    if (isNew && winner && !showVictoryAnimation) {
      setTimeout(() => {
        if (cardRef.current) {
          fireVictoryConfetti(cardRef.current);
          setShowVictoryAnimation(true);
        }
      }, 600);
    }
  }, [isNew, winner, showVictoryAnimation]);

  // Swipe handlers with haptics
  const handleSwipeLeft = () => {
    hapticError();
    if (onDelete) onDelete(result.id, result);
  };

  const handleSwipeRight = () => {
    hapticMedium();
    if (onEdit) onEdit(result);
  };

  const handleExpandClick = () => {
    hapticLight();
    setExpanded(!expanded);
  };

  const { onTouchStart, onTouchMove, onTouchEnd, swipeDirection, swipeProgress } =
    useSwipe(handleSwipeLeft, handleSwipeRight);

  // Swipe background color
  const getSwipeBackground = () => {
    if (!swipeDirection) return 'transparent';
    if (swipeDirection === 'left') {
      return alpha(theme.palette.error.main, swipeProgress * 0.3);
    }
    return alpha(theme.palette.warning.main, swipeProgress * 0.3);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={isNew ? { opacity: 0, y: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        delay: isNew ? 0.1 : 0,
      }}
    >
      <Card
        className="noise-texture"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          transition: 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          backgroundColor: getSwipeBackground() || theme.palette.background.paper,
          '&:hover': {
            boxShadow: theme.shadows[10],
            transform: 'translateY(-4px)',
            borderColor: alpha(theme.palette.success.main, 0.3),
          },
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Swipe Indicators */}
        <AnimatePresence>
          {swipeDirection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeProgress }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                [swipeDirection === 'left' ? 'right' : 'left']: 0,
                width: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  swipeDirection === 'left'
                    ? alpha(theme.palette.error.main, 0.9)
                    : alpha(theme.palette.warning.main, 0.9),
                zIndex: 1,
              }}
            >
              {swipeDirection === 'left' ? (
                <Delete sx={{ color: 'white', fontSize: 28 }} />
              ) : (
                <Edit sx={{ color: 'white', fontSize: 28 }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Badge */}
        {category && (
          <Box sx={{ px: 2, pt: 1.5 }}>
            <Chip
              icon={category.icon}
              label={category.label}
              size="small"
              sx={{
                backgroundColor: category.color,
                color: theme.palette.getContrastText(category.color),
                fontFamily: tokens.typography.bodyFont,
                fontWeight: 600,
                letterSpacing: '0.02em',
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          </Box>
        )}

        <CardContent sx={{ pt: category ? 1 : 2, pb: 2 }}>
          {/* Header: Date & Location */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              pb: 1.5,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CalendarToday sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: tokens.typography.bodyFont,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {dayjs(dateObj).format('dddd, D MMM YYYY')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LocationOn sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: tokens.typography.bodyFont,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                {result.location || 'Sin ubicación'}
              </Typography>
            </Box>
          </Box>

          {/* Main Content: Teams Display */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 2,
              mb: 2,
            }}
          >
            {/* Team 1 */}
            <TeamDisplay
              pair={result.pair1}
              isWinner={winner === 'pair1'}
              position="left"
              theme={theme}
            />

            {/* VS Divider */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                minWidth: 40,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: tokens.typography.displayFont,
                  fontWeight: 400,
                  color: theme.palette.primary.main,
                  fontSize: '1.25rem',
                  letterSpacing: '0.1em',
                }}
              >
                VS
              </Typography>
            </Box>

            {/* Team 2 */}
            <TeamDisplay
              pair={result.pair2}
              isWinner={winner === 'pair2'}
              position="right"
              theme={theme}
            />
          </Box>

          {/* Sets Results - Premium Design */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2.5,
              py: 2,
              px: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 2,
              mb: 1,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            }}
          >
            {result.sets?.map((set, index) => (
              <SetBadge
                key={index}
                pair1Score={set.pair1Score}
                pair2Score={set.pair2Score}
                setNumber={index + 1}
                theme={theme}
              />
            ))}
          </Box>

          {/* Expand Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={handleExpandClick}
              sx={{
                color: theme.palette.text.secondary,
                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                '&:hover': {
                  transform: 'scale(1.2)',
                  color: theme.palette.success.main,
                  backgroundColor: alpha(theme.palette.success.main, 0.08),
                },
              }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Expandable Details */}
          <Collapse in={expanded}>
            <Box sx={{ pt: 2, mt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
              {/* Added By Info */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mb: 2,
                  px: 1,
                }}
              >
                <Person sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  Añadido por: <strong>{result.addedBy || 'N/A'}</strong>
                  {result.createdAt &&
                    ` el ${dayjs(
                      result.createdAt.toDate
                        ? result.createdAt.toDate()
                        : result.createdAt
                    ).format('D/MM/YY HH:mm')}`}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: 1,
                  pt: 1,
                }}
              >
                {onShare && (
                  <Tooltip title="Compartir" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        hapticLight();
                        onShare(result);
                      }}
                      sx={{
                        color: theme.palette.success.main,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          backgroundColor: alpha(theme.palette.success.main, 0.1),
                        },
                      }}
                    >
                      <Share fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onClone && (
                  <Tooltip title="Clonar" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        hapticLight();
                        onClone(result);
                      }}
                      sx={{
                        color: theme.palette.info.light,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          backgroundColor: alpha(theme.palette.info.light, 0.15),
                        },
                      }}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onEdit && (
                  <Tooltip title="Editar" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        hapticMedium();
                        onEdit(result);
                      }}
                      sx={{
                        color: theme.palette.warning.dark,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Eliminar" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        hapticError();
                        onDelete(result.id, result);
                      }}
                      sx={{
                        color: theme.palette.error.light,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          backgroundColor: alpha(theme.palette.error.light, 0.15),
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default MatchCard;
