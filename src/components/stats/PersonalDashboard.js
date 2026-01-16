// src/components/stats/PersonalDashboard.js
// Section 1: Personal Dashboard with KPIs and quick insights

import React from 'react';
import { Box, Typography, Grid, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GroupIcon from '@mui/icons-material/Group';
import SportsIcon from '@mui/icons-material/Sports';
import { tokens } from '../../theme';
import GlassCard from './ui/GlassCard';
import RadialProgress from './ui/RadialProgress';
import InsightChip from './ui/InsightChip';

const PersonalDashboard = ({
  playerName,
  basicStats,
  trendStats,
  insights,
  playerImage,
}) => {
  const theme = useTheme();

  const {
    gamesWon,
    gamesLost,
    efficiency,
    consecutiveWins,
  } = basicStats;

  const { efficiencyChange, trend, gamesChange } = trendStats;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section Title */}
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
        Mi Dashboard
      </Typography>

      {/* Hero Card */}
      <GlassCard
        component={motion.div}
        variants={itemVariants}
        accentColor={theme.palette.secondary.main}
        sx={{ mb: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Radial Progress */}
          <Box sx={{ flexShrink: 0 }}>
            <RadialProgress
              value={efficiency}
              size={140}
              strokeWidth={10}
              label="Eficiencia"
              color={theme.palette.secondary.main}
            />
          </Box>

          {/* Stats */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: tokens.typography.displayFont,
                color: theme.palette.text.primary,
                mb: 1,
                textTransform: 'uppercase',
              }}
            >
              {playerName}
            </Typography>

            {/* Win/Loss Stats */}
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mb: 2,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontWeight: 700,
                    color: theme.palette.success.main,
                  }}
                >
                  {gamesWon}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    color: alpha(theme.palette.text.primary, 0.7),
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
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
                    color: theme.palette.error.light,
                  }}
                >
                  {gamesLost}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    color: alpha(theme.palette.text.primary, 0.7),
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Derrotas
                </Typography>
              </Box>
              {consecutiveWins > 0 && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: tokens.typography.monoFont,
                      fontWeight: 700,
                      color: theme.palette.lime?.main || '#CCFF00',
                    }}
                  >
                    {consecutiveWins}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: tokens.typography.bodyFont,
                      color: alpha(theme.palette.text.primary, 0.7),
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Racha
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Streak Badge */}
            {consecutiveWins >= 3 && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.lime?.main || '#CCFF00', 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.lime?.main || '#CCFF00', 0.4)}`,
                }}
              >
                <WhatshotIcon sx={{ color: theme.palette.lime?.main || '#CCFF00', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: tokens.typography.displayFont,
                    color: theme.palette.lime?.main || '#CCFF00',
                    letterSpacing: '0.05em',
                  }}
                >
                  EN RACHA
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </GlassCard>

      {/* Quick Insights Grid */}
      <Grid container spacing={2}>
        {/* Trend Card */}
        <Grid item xs={12} sm={4}>
          <GlassCard
            component={motion.div}
            variants={itemVariants}
            accentColor={
              trend === 'up'
                ? theme.palette.success.main
                : trend === 'down'
                ? theme.palette.error.main
                : theme.palette.info.main
            }
            accentPosition="left"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {trend === 'up' ? (
                <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
              ) : trend === 'down' ? (
                <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
              ) : (
                <TrendingUpIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />
              )}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    color: alpha(theme.palette.text.primary, 0.7),
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    letterSpacing: '0.05em',
                    display: 'block',
                  }}
                >
                  vs Mes Anterior
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontWeight: 700,
                    color:
                      trend === 'up'
                        ? theme.palette.success.main
                        : trend === 'down'
                        ? theme.palette.error.main
                        : theme.palette.text.primary,
                  }}
                >
                  {efficiencyChange > 0 ? '+' : ''}
                  {efficiencyChange}%
                </Typography>
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        {/* Best Partner Card */}
        <Grid item xs={12} sm={4}>
          <GlassCard
            component={motion.div}
            variants={itemVariants}
            accentColor={theme.palette.secondary.main}
            accentPosition="left"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GroupIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    color: alpha(theme.palette.text.primary, 0.7),
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    letterSpacing: '0.05em',
                    display: 'block',
                  }}
                >
                  Mejor Pareja
                </Typography>
                {insights.bestPartner ? (
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: tokens.typography.displayFont,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {insights.bestPartner.partner}
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: tokens.typography.monoFont,
                        fontSize: '0.9rem',
                        color: theme.palette.secondary.main,
                        ml: 1,
                      }}
                    >
                      {insights.bestPartner.winRate}%
                    </Typography>
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.palette.text.primary, 0.5) }}
                  >
                    Sin datos
                  </Typography>
                )}
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        {/* Nemesis Card */}
        <Grid item xs={12} sm={4}>
          <GlassCard
            component={motion.div}
            variants={itemVariants}
            accentColor={theme.palette.error.main}
            accentPosition="left"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SportsIcon sx={{ color: theme.palette.error.light, fontSize: 28 }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    color: alpha(theme.palette.text.primary, 0.7),
                    textTransform: 'uppercase',
                    fontSize: '0.65rem',
                    letterSpacing: '0.05em',
                    display: 'block',
                  }}
                >
                  Nemesis
                </Typography>
                {insights.nemesis ? (
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: tokens.typography.displayFont,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {insights.nemesis.rival}
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: tokens.typography.monoFont,
                        fontSize: '0.85rem',
                        color: theme.palette.error.light,
                        ml: 1,
                      }}
                    >
                      {insights.nemesis.wins}-{insights.nemesis.losses}
                    </Typography>
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.palette.text.primary, 0.5) }}
                  >
                    Ninguno
                  </Typography>
                )}
              </Box>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Activity Chip */}
      {gamesChange !== 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', px: 1 }}>
          <InsightChip
            emoji={gamesChange > 0 ? '📈' : '📉'}
            text={`${Math.abs(gamesChange)} partido${Math.abs(gamesChange) !== 1 ? 's' : ''} ${gamesChange > 0 ? 'más' : 'menos'} que el mes pasado`}
            variant={gamesChange > 0 ? 'success' : 'info'}
          />
        </Box>
      )}
    </Box>
  );
};

export default PersonalDashboard;
