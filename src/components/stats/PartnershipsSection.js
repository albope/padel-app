// src/components/stats/PartnershipsSection.js
// Section 3: Partnership ranking and stats

import React from 'react';
import { Box, Typography, useTheme, alpha, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { tokens } from '../../theme';
import GlassCard from './ui/GlassCard';

const PartnerCard = ({ partnership, rank, selectedPlayer }) => {
  const theme = useTheme();
  const { partner, wins, games, winRate, currentStreak } = partnership;

  // Medal colors for top 3
  const medalColors = {
    1: { color: theme.palette.badges?.gold || '#FFD700', label: 'ORO' },
    2: { color: theme.palette.badges?.silver || '#C0C0C0', label: 'PLATA' },
    3: { color: theme.palette.badges?.bronze || '#CD7F32', label: 'BRONCE' },
  };

  const medal = medalColors[rank];

  return (
    <GlassCard
      accentColor={medal?.color || theme.palette.secondary.main}
      accentPosition="left"
      sx={{ mb: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Medal / Rank */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: medal
              ? `linear-gradient(135deg, ${medal.color} 0%, ${alpha(medal.color, 0.6)} 100%)`
              : alpha(theme.palette.primary.light, 0.5),
            boxShadow: medal ? `0 4px 12px ${alpha(medal.color, 0.4)}` : 'none',
            flexShrink: 0,
          }}
        >
          {medal ? (
            <EmojiEventsIcon
              sx={{
                color: theme.palette.background.dark,
                fontSize: 24,
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              {rank}
            </Typography>
          )}
        </Box>

        {/* Partner Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: tokens.typography.displayFont,
                color: theme.palette.text.primary,
                textTransform: 'uppercase',
              }}
            >
              {partner}
            </Typography>
            {currentStreak >= 2 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  background: alpha(theme.palette.lime?.main || '#CCFF00', 0.2),
                }}
              >
                <WhatshotIcon
                  sx={{
                    color: theme.palette.lime?.main || '#CCFF00',
                    fontSize: 14,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontWeight: 700,
                    color: theme.palette.lime?.main || '#CCFF00',
                    fontSize: '0.65rem',
                  }}
                >
                  {currentStreak}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={winRate}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background:
                    rank === 1
                      ? `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.lime?.main || '#CCFF00'} 100%)`
                      : `linear-gradient(90deg, ${alpha(theme.palette.secondary.main, 0.7)} 0%, ${theme.palette.secondary.main} 100%)`,
                },
              }}
            />
          </Box>

          {/* Stats */}
          <Typography
            variant="caption"
            sx={{
              fontFamily: tokens.typography.bodyFont,
              color: alpha(theme.palette.text.primary, 0.6),
              fontSize: '0.7rem',
            }}
          >
            {games} partidos juntos · {wins} victorias
          </Typography>
        </Box>

        {/* Win Rate */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: tokens.typography.monoFont,
              fontWeight: 700,
              color: theme.palette.secondary.main,
            }}
          >
            {winRate}%
          </Typography>
        </Box>
      </Box>
    </GlassCard>
  );
};

const PartnershipsSection = ({ partnershipStats, selectedPlayer }) => {
  const theme = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  if (!partnershipStats || partnershipStats.length === 0) {
    return (
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.text.primary,
            mb: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Mis Parejas
        </Typography>
        <GlassCard>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: alpha(theme.palette.text.primary, 0.5),
              py: 4,
            }}
          >
            No hay suficientes datos de parejas
          </Typography>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Typography
        variant="h5"
        component={motion.h2}
        variants={itemVariants}
        sx={{
          fontFamily: tokens.typography.displayFont,
          color: theme.palette.text.primary,
          mb: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Mis Parejas
      </Typography>

      {partnershipStats.map((partnership, index) => (
        <motion.div key={partnership.partner} variants={itemVariants}>
          <PartnerCard
            partnership={partnership}
            rank={index + 1}
            selectedPlayer={selectedPlayer}
          />
        </motion.div>
      ))}

      {/* Summary Insight */}
      {partnershipStats.length > 1 && (
        <Box
          component={motion.div}
          variants={itemVariants}
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            background: alpha(theme.palette.secondary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: tokens.typography.bodyFont,
              color: alpha(theme.palette.text.primary, 0.8),
            }}
          >
            Tu mejor combinación es con{' '}
            <Typography
              component="span"
              sx={{
                fontFamily: tokens.typography.displayFont,
                color: theme.palette.secondary.main,
              }}
            >
              {partnershipStats[0].partner}
            </Typography>
            {partnershipStats[0].winRate > 50 && (
              <>
                {' '}
                con un{' '}
                <Typography
                  component="span"
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontWeight: 700,
                    color: theme.palette.secondary.main,
                  }}
                >
                  {partnershipStats[0].winRate}%
                </Typography>{' '}
                de victorias
              </>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PartnershipsSection;
