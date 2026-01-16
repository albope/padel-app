// src/components/PlayerCard.js - Premium "Athletic Luxury Club" Design
import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../theme';
import { hapticMedium } from '../utils/haptics';

// Colores del documento de diseño
const COLORS = {
  burgundy: '#E53935', // Red más visible para derrotas (mejor contraste)
  gold: '#D4AF37',     // Championship Gold
};

// ============================================================================
// COMPONENT: Radial Progress Ring (Premium circular progress)
// ============================================================================
const RadialProgress = ({ value, size = 120, strokeWidth = 8, label, color }) => {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={alpha(theme.palette.background.dark, 0.3)}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle with Gradient */}
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color || theme.palette.success.light} />
            <stop offset="100%" stopColor={color || theme.palette.success.dark} />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${label})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {/* Center Value */}
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: tokens.typography.monoFont,
            fontWeight: 700,
            color: theme.palette.success.main,
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            fontSize: '0.65rem',
            fontWeight: 600,
            color: alpha(theme.palette.text.primary, 0.7),
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mt: 0.5,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

// ============================================================================
// COMPONENT: Premium Sparkline Chart
// ============================================================================
const TrendChart = ({ results, playerName }) => {
  const theme = useTheme();
  const lastFiveResults = results.slice(-5);

  if (lastFiveResults.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            color: alpha(theme.palette.text.primary, 0.5),
          }}
        >
          No hay datos suficientes
        </Typography>
      </Box>
    );
  }

  const points = lastFiveResults.map((result, index) => {
    const { pair1, pair2, sets } = result;
    let pair1SetWins = 0;
    let pair2SetWins = 0;

    if (Array.isArray(sets)) {
      sets.forEach((set) => {
        if (parseInt(set.pair1Score, 10) > parseInt(set.pair2Score, 10)) pair1SetWins++;
        else if (parseInt(set.pair2Score, 10) > parseInt(set.pair1Score, 10)) pair2SetWins++;
      });
    }

    const playerWon =
      (pair1SetWins > pair2SetWins && (pair1.player1 === playerName || pair1.player2 === playerName)) ||
      (pair2SetWins > pair1SetWins && (pair2.player1 === playerName || pair2.player2 === playerName));

    return {
      x: (index / Math.max(lastFiveResults.length - 1, 1)) * 100,
      y: playerWon ? 20 : 80,
      won: playerWon,
    };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaData = `${pathData} L 100,100 L 0,100 Z`;

  return (
    <Box sx={{ width: '100%', height: 60, position: 'relative' }}>
      <svg width="100%" height="60" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid Lines */}
        <line x1="0" y1="50" x2="100" y2="50" stroke={alpha(theme.palette.success.main, 0.1)} strokeWidth="0.5" strokeDasharray="2,2" />

        {/* Area Fill with Gradient */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity="0.3" />
            <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaData} fill="url(#areaGradient)" />

        {/* Trend Line */}
        <path
          d={pathData}
          fill="none"
          stroke={theme.palette.success.main}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="drop-shadow(0 0 4px rgba(212, 175, 55, 0.5))"
        />

        {/* Points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={point.won ? theme.palette.success.main : COLORS.burgundy}
            stroke={theme.palette.background.dark}
            strokeWidth="2"
            filter="drop-shadow(0 0 3px rgba(0,0,0,0.5))"
          />
        ))}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            color: alpha(theme.palette.text.primary, 0.6),
            fontSize: '0.625rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Últimos {lastFiveResults.length} partidos
        </Typography>
      </Box>
    </Box>
  );
};

// ============================================================================
// COMPONENT: Premium Medal Badge
// ============================================================================
const Medal = ({ position }) => {
  const theme = useTheme();

  const medalColors = {
    1: { bg: theme.palette.badges.gold, label: 'ORO', shadow: '#B8941F' },
    2: { bg: theme.palette.badges.silver, label: 'PLATA', shadow: '#A0A0A0' },
    3: { bg: theme.palette.badges.bronze, label: 'BRONCE', shadow: '#8B4513' },
  };

  const color = medalColors[position];
  if (!color) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.3,
      }}
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color.bg} 0%, ${color.shadow} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 16px ${alpha(color.bg, 0.4)}, 0 0 24px ${alpha(color.bg, 0.3)}`,
          border: `2px solid ${alpha('#FFFFFF', 0.3)}`,
        }}
      >
        <EmojiEventsIcon sx={{ color: theme.palette.background.dark, fontSize: '1.75rem' }} />
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.displayFont,
            fontSize: '0.5rem',
            fontWeight: 400,
            color: theme.palette.background.dark,
            letterSpacing: '0.1em',
            mt: -0.5,
          }}
        >
          {color.label}
        </Typography>
      </Box>
    </motion.div>
  );
};

// ============================================================================
// COMPONENT: Hexagonal Player Image
// ============================================================================
const HexagonalImage = ({ image, playerName, playerKey, theme, onCameraClick }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        pt: '75%',
        backgroundColor: theme.palette.background.dark,
        overflow: 'hidden',
      }}
    >
      {/* Animated Radial Rings Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 300 300"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <defs>
            <radialGradient id={`ring-gradient-${playerKey}`}>
              <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity="0.3" />
              <stop offset="50%" stopColor={theme.palette.success.main} stopOpacity="0.15" />
              <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Static decorative rings (no blur filter for performance) */}
          {[1, 2, 3, 4].map((ring, index) => (
            <circle
              key={ring}
              cx="150"
              cy="150"
              r={90 + ring * 20}
              fill="none"
              stroke={theme.palette.success.main}
              strokeWidth="1"
              strokeOpacity={0.12 - index * 0.02}
              strokeDasharray={`${4 + index * 2} ${8 + index * 4}`}
            />
          ))}

          {/* Inner glow circle */}
          <circle
            cx="150"
            cy="150"
            r="95"
            fill={`url(#ring-gradient-${playerKey})`}
            opacity="0.3"
          />
        </svg>
      </Box>

      {/* Hexagonal Mask with Image */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '85%',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
          }}
        >
          <CardMedia
            component="img"
            image={image}
            alt={playerName}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Hexagonal border */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              clipPath: 'inherit',
              boxShadow: `inset 0 0 0 3px ${alpha(theme.palette.success.main, 0.6)}`,
            }}
          />
        </Box>

        {/* Corner dots */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          <circle cx="60" cy="0" r="3" fill={theme.palette.success.main} opacity="0.8" />
          <circle cx="140" cy="0" r="3" fill={theme.palette.success.main} opacity="0.8" />
          <circle cx="200" cy="100" r="3" fill={theme.palette.success.main} opacity="0.8" />
          <circle cx="140" cy="200" r="3" fill={theme.palette.success.main} opacity="0.8" />
          <circle cx="60" cy="200" r="3" fill={theme.palette.success.main} opacity="0.8" />
          <circle cx="0" cy="100" r="3" fill={theme.palette.success.main} opacity="0.8" />
        </svg>
      </Box>

      {/* Camera Button */}
      <IconButton
        size="small"
        onClick={onCameraClick}
        sx={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 5,
          backgroundColor: alpha(theme.palette.background.dark, 0.9),
          color: theme.palette.success.main,
          border: `2px solid ${alpha(theme.palette.success.main, 0.4)}`,
          '&:hover': {
            backgroundColor: alpha(theme.palette.success.main, 0.15),
          },
        }}
      >
        <PhotoCameraIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

// ============================================================================
// COMPONENT: Front Face Content
// ============================================================================
const FrontFace = ({ player, stats, image, playerKey, rank, theme, onCameraClick }) => {
  const efficiencyPercent = stats.efficiency || 0;

  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: theme.shadows[6],
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
      }}
    >
      {/* Medal Badge for Top 3 */}
      {rank <= 3 && stats.gamesPlayed > 0 && <Medal position={rank} />}

      {/* Hexagonal Image */}
      <HexagonalImage
        image={image}
        playerName={player.name}
        playerKey={playerKey}
        theme={theme}
        onCameraClick={onCameraClick}
      />

      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
        {/* Player Name & Flag */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 0.5 }}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontFamily: tokens.typography.displayFont,
              fontWeight: 400,
              fontSize: '1.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: theme.palette.text.primary,
            }}
          >
            {player.name}
          </Typography>
          <Box
            component="img"
            src={player.flag}
            alt={`${player.country} flag`}
            sx={{
              height: 24,
              ml: 1.5,
              borderRadius: 1,
              boxShadow: theme.shadows[2],
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            color: alpha(theme.palette.text.primary, 0.7),
            mb: { xs: 1.5, sm: 3 },
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {player.position}
        </Typography>

        {/* Radial Progress Ring */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, sm: 2 } }}>
          <RadialProgress
            value={efficiencyPercent}
            size={100}
            strokeWidth={7}
            label="%"
            color={theme.palette.success.main}
          />
        </Box>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontWeight: 700,
                color: theme.palette.success.main,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              {stats.gamesWon}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.6),
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Victorias
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontWeight: 700,
                color: COLORS.burgundy,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              {stats.gamesLost}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.6),
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Derrotas
            </Typography>
          </Box>
        </Box>

        {/* Streak Badge */}
        {stats.consecutiveWins > 0 && (
          <Box
            sx={{
              mt: { xs: 1.5, sm: 2 },
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
              border: `2px solid ${theme.palette.success.main}`,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontWeight: 400,
                fontSize: '1.125rem',
                color: theme.palette.success.main,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Racha: {stats.consecutiveWins}
            </Typography>
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: { xs: 1.5, sm: 3 },
            textAlign: 'center',
            fontFamily: tokens.typography.bodyFont,
            color: alpha(theme.palette.text.primary, 0.5),
            fontStyle: 'italic',
            fontSize: '0.75rem',
          }}
        >
          Toca para ver detalles
        </Typography>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// COMPONENT: Back Face Content
// ============================================================================
const BackFace = ({ player, stats, playerKey, allResults, theme }) => {
  const playerResults = allResults.filter(r =>
    r.pair1?.player1 === playerKey ||
    r.pair1?.player2 === playerKey ||
    r.pair2?.player1 === playerKey ||
    r.pair2?.player2 === playerKey
  );

  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        borderRadius: 3,
        boxShadow: theme.shadows[6],
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        overflow: 'auto',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontFamily: tokens.typography.displayFont,
          fontWeight: 400,
          fontSize: '1.5rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          mb: 3,
          textAlign: 'center',
          color: theme.palette.text.primary,
        }}
      >
        Estadísticas
      </Typography>

      {/* Personal Info */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.dark, 0.5),
          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
        }}
      >
        <StatRow label="Nacimiento" value={player.birthDate} />
        <StatRow label="Altura" value={player.height} />
        <StatRow label="Origen" value={player.birthPlace} />
      </Box>

      {/* Performance Stats */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: tokens.typography.displayFont,
            fontWeight: 400,
            fontSize: '1.125rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            mb: 2,
            color: theme.palette.text.primary,
          }}
        >
          Rendimiento
        </Typography>
        <StatRow label="Partidos jugados" value={stats.gamesPlayed} mono />
        <StatRow label="Victorias" value={stats.gamesWon} mono color={COLORS.gold} />
        <StatRow label="Derrotas" value={stats.gamesLost} mono color={COLORS.burgundy} />
        <StatRow label="Eficiencia" value={`${stats.efficiency}%`} mono color={COLORS.gold} />
        <StatRow label="Racha actual" value={stats.consecutiveWins} mono />
      </Box>

      {/* Trend Chart */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: tokens.typography.displayFont,
            fontWeight: 400,
            fontSize: '1.125rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            mb: 2,
            color: theme.palette.text.primary,
          }}
        >
          Tendencia
        </Typography>
        <TrendChart results={playerResults} playerName={playerKey} />
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 3,
          textAlign: 'center',
          fontFamily: tokens.typography.bodyFont,
          color: alpha(theme.palette.text.primary, 0.5),
          fontStyle: 'italic',
          fontSize: '0.75rem',
        }}
      >
        Toca para volver
      </Typography>
    </Card>
  );
};

// ============================================================================
// HELPER: Stat Row Component
// ============================================================================
const StatRow = ({ label, value, mono = false, color }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography
        variant="body2"
        sx={{
          fontFamily: tokens.typography.bodyFont,
          color: alpha(theme.palette.text.primary, 0.7),
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        {label}:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: mono ? tokens.typography.monoFont : tokens.typography.bodyFont,
          fontWeight: mono ? 700 : 600,
          fontSize: '0.875rem',
          color: color || theme.palette.text.primary,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT: Premium PlayerCard
// ============================================================================
const PlayerCard = React.memo(({
  player,
  playerKey,
  stats,
  image,
  rank,
  onImageEdit,
  allResults = [],
}) => {
  const theme = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    hapticMedium();
    setIsFlipped(!isFlipped);
  };

  const handleImageEditClick = (e) => {
    e.stopPropagation();
    hapticMedium();
    onImageEdit(playerKey);
  };

  return (
    <Box
      sx={{
        perspective: '1500px',
        height: '100%',
        minHeight: { xs: 620, sm: 580 },
      }}
    >
      <Box
        onClick={handleCardClick}
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          transition: 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT FACE */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <FrontFace
            player={player}
            stats={stats}
            image={image}
            playerKey={playerKey}
            rank={rank}
            theme={theme}
            onCameraClick={handleImageEditClick}
          />
        </Box>

        {/* BACK FACE */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <BackFace
            player={player}
            stats={stats}
            playerKey={playerKey}
            allResults={allResults}
            theme={theme}
          />
        </Box>
      </Box>
    </Box>
  );
});

export default PlayerCard;
