// src/components/stats/ActivitySection.js
// Section 5: Activity heatmap and frequency insights

import React, { useMemo } from 'react';
import { Box, Typography, Grid, useTheme, alpha, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import dayjs from 'dayjs';
import { tokens } from '../../theme';
import GlassCard from './ui/GlassCard';
import InsightChip from './ui/InsightChip';

const ActivityHeatmap = ({ heatmapData }) => {
  const theme = useTheme();

  // Generate last 6 months of dates
  const calendarData = useMemo(() => {
    const months = [];
    const today = dayjs();

    for (let m = 5; m >= 0; m--) {
      const monthStart = today.subtract(m, 'months').startOf('month');
      const monthEnd = monthStart.endOf('month');
      const weeks = [];
      let currentWeek = [];
      let current = monthStart.startOf('week');

      while (current.isBefore(monthEnd) || current.isSame(monthEnd, 'day')) {
        const dateKey = current.format('YYYY-MM-DD');
        const count = heatmapData[dateKey] || 0;
        const isCurrentMonth = current.month() === monthStart.month();

        currentWeek.push({
          date: dateKey,
          day: current.date(),
          count,
          isCurrentMonth,
          isToday: current.isSame(today, 'day'),
        });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }

        current = current.add(1, 'day');
      }

      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push({ date: null, day: null, count: 0, isCurrentMonth: false });
        }
        weeks.push(currentWeek);
      }

      months.push({
        label: monthStart.format('MMM'),
        year: monthStart.year(),
        weeks,
      });
    }

    return months;
  }, [heatmapData]);

  // Color scale based on activity
  const getColor = (count, isCurrentMonth) => {
    if (!isCurrentMonth) return 'transparent';
    if (count === 0) return alpha(theme.palette.primary.light, 0.3);
    if (count === 1) return alpha(theme.palette.secondary.main, 0.4);
    if (count === 2) return alpha(theme.palette.secondary.main, 0.7);
    return theme.palette.secondary.main;
  };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 1, minWidth: 'max-content' }}>
        {calendarData.map((month, monthIndex) => (
          <Box key={monthIndex} sx={{ flex: '0 0 auto' }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.6),
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
                textAlign: 'center',
              }}
            >
              {month.label}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {month.weeks.map((week, weekIndex) => (
                <Box key={weekIndex} sx={{ display: 'flex', gap: '2px' }}>
                  {week.map((day, dayIndex) => (
                    <Tooltip
                      key={dayIndex}
                      title={
                        day.date
                          ? `${dayjs(day.date).format('DD MMM YYYY')}: ${day.count} partido${
                              day.count !== 1 ? 's' : ''
                            }`
                          : ''
                      }
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '2px',
                          backgroundColor: getColor(day.count, day.isCurrentMonth),
                          border: day.isToday
                            ? `2px solid ${theme.palette.lime?.main || '#CCFF00'}`
                            : 'none',
                          cursor: day.isCurrentMonth ? 'pointer' : 'default',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: day.isCurrentMonth ? 'scale(1.3)' : 'none',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mt: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            color: alpha(theme.palette.text.primary, 0.5),
            fontSize: '0.6rem',
          }}
        >
          Menos
        </Typography>
        {[0, 1, 2, 3].map((level) => (
          <Box
            key={level}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '2px',
              backgroundColor:
                level === 0
                  ? alpha(theme.palette.primary.light, 0.3)
                  : level === 1
                  ? alpha(theme.palette.secondary.main, 0.4)
                  : level === 2
                  ? alpha(theme.palette.secondary.main, 0.7)
                  : theme.palette.secondary.main,
            }}
          />
        ))}
        <Typography
          variant="caption"
          sx={{
            fontFamily: tokens.typography.bodyFont,
            color: alpha(theme.palette.text.primary, 0.5),
            fontSize: '0.6rem',
          }}
        >
          Mas
        </Typography>
      </Box>
    </Box>
  );
};

const ActivitySection = ({ activityStats, selectedPlayer }) => {
  const theme = useTheme();

  const { heatmap, gamesThisMonth, mostActiveDay, favoriteLocation, totalGames } =
    activityStats || {};

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

  if (!activityStats || totalGames === 0) {
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
          Mi Actividad
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
            No hay suficientes datos de actividad
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
        Mi Actividad
      </Typography>

      {/* Heatmap Card */}
      <GlassCard component={motion.div} variants={itemVariants} sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.text.primary,
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.9rem',
          }}
        >
          Ultimos 6 Meses
        </Typography>
        <ActivityHeatmap heatmapData={heatmap || {}} />
      </GlassCard>

      {/* Stats Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <GlassCard
            component={motion.div}
            variants={itemVariants}
            accentColor={theme.palette.secondary.main}
            accentPosition="left"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SportsTennisIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
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
                  Este Mes
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                  }}
                >
                  {gamesThisMonth}{' '}
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: tokens.typography.bodyFont,
                      fontSize: '0.75rem',
                      color: alpha(theme.palette.text.primary, 0.6),
                    }}
                  >
                    partidos
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={4}>
          <GlassCard
            component={motion.div}
            variants={itemVariants}
            accentColor={theme.palette.info.main}
            accentPosition="left"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CalendarTodayIcon sx={{ color: theme.palette.info.light, fontSize: 28 }} />
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
                  Dia Favorito
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: tokens.typography.displayFont,
                    color: theme.palette.text.primary,
                    textTransform: 'uppercase',
                  }}
                >
                  {mostActiveDay || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={4}>
          <GlassCard
            component={motion.div}
            variants={itemVariants}
            accentColor={theme.palette.lime?.main || '#CCFF00'}
            accentPosition="left"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PlaceIcon sx={{ color: theme.palette.lime?.main || '#CCFF00', fontSize: 28 }} />
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
                  Lugar Favorito
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: tokens.typography.displayFont,
                    color: theme.palette.text.primary,
                    textTransform: 'uppercase',
                    fontSize: favoriteLocation && favoriteLocation.length > 12 ? '0.9rem' : '1.1rem',
                  }}
                >
                  {favoriteLocation || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Total Games Insight */}
      <Box
        component={motion.div}
        variants={itemVariants}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      >
        <InsightChip
          emoji="🎾"
          text={`${totalGames} partidos totales registrados`}
          variant="default"
        />
      </Box>
    </Box>
  );
};

export default ActivitySection;
