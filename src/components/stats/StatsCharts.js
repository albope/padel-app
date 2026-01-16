// src/components/stats/StatsCharts.js
// Champions Analytics Dashboard - Main Container
// Redesigned statistics component with useful metrics

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Skeleton,
  Paper,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Context
import { useData } from '../../context/DataContext';

// Theme tokens
import { tokens } from '../../theme';

// Custom hook for stats
import usePlayerStats, { PLAYERS } from '../../hooks/usePlayerStats';

// Section components
import PersonalDashboard from './PersonalDashboard';
import RivalrySection from './RivalrySection';
import PartnershipsSection from './PartnershipsSection';
import EvolutionChart from './EvolutionChart';
import ActivitySection from './ActivitySection';

dayjs.locale('es');

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// Loading skeleton component
const StatsSkeleton = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header skeleton */}
      <Skeleton
        variant="rounded"
        width="100%"
        height={100}
        sx={{
          mb: 4,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.primary.light, 0.3),
        }}
      />

      {/* Player selector skeleton */}
      <Skeleton
        variant="rounded"
        width={200}
        height={56}
        sx={{
          mb: 4,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.primary.light, 0.3),
        }}
      />

      {/* Dashboard skeleton */}
      <Skeleton
        variant="rounded"
        width="100%"
        height={200}
        sx={{
          mb: 3,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.primary.light, 0.3),
        }}
      />

      {/* Cards skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{
              flex: 1,
              height: 100,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.light, 0.3),
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

const StatsCharts = () => {
  const theme = useTheme();
  const { results: allResults, loading: dataLoading } = useData();
  const [selectedPlayer, setSelectedPlayer] = useState(PLAYERS[0]);
  const [isChangingPlayer, setIsChangingPlayer] = useState(false);

  // Get player stats using custom hook
  const {
    basicStats,
    rivalryStats,
    partnershipStats,
    evolutionStats,
    trendStats,
    activityStats,
    insights,
  } = usePlayerStats(allResults, selectedPlayer);

  // Handle player change with animation
  const handlePlayerChange = (event) => {
    setIsChangingPlayer(true);
    setTimeout(() => {
      setSelectedPlayer(event.target.value);
      setIsChangingPlayer(false);
    }, 200);
  };

  // Show loading state
  if (dataLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <StatsSkeleton />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, pb: 10 }}>
      {/* Header */}
      <Paper
        component={motion.div}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        elevation={8}
        sx={{
          background: `linear-gradient(135deg,
            ${alpha(theme.palette.primary.main, 0.95)} 0%,
            ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
          color: theme.palette.text.primary,
          p: { xs: 2.5, sm: 3 },
          textAlign: 'center',
          mb: 4,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg,
              ${theme.palette.secondary.main} 0%,
              ${tokens.colors.electricLime.main} 50%,
              ${theme.palette.secondary.main} 100%)`,
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <BarChartIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: theme.palette.secondary.main }} />
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontWeight: 400,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Champions Analytics
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: tokens.typography.bodyFont,
                color: alpha(theme.palette.text.primary, 0.7),
                mt: 0.5,
              }}
            >
              Tu rendimiento en detalle
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Player Selector */}
      <Box
        component={motion.div}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        sx={{ mb: 4 }}
      >
        <FormControl fullWidth sx={{ maxWidth: 280 }}>
          <Select
            value={selectedPlayer}
            onChange={handlePlayerChange}
            displayEmpty
            startAdornment={
              <PersonIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
            }
            sx={{
              backgroundColor: alpha(theme.palette.primary.light, 0.5),
              borderRadius: 3,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.secondary.main, 0.3),
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.secondary.main,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.secondary.main,
              },
              '& .MuiSelect-select': {
                fontFamily: tokens.typography.displayFont,
                fontSize: '1.1rem',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              },
            }}
          >
            {PLAYERS.map((player) => (
              <MenuItem
                key={player}
                value={player}
                sx={{
                  fontFamily: tokens.typography.displayFont,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                {player}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Sections with animations */}
      <AnimatePresence mode="wait">
        {!isChangingPlayer && (
          <motion.div
            key={selectedPlayer}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Section 1: Personal Dashboard */}
            <Box
              component={motion.section}
              variants={fadeInUp}
              sx={{ mb: 5 }}
            >
              <PersonalDashboard
                playerName={selectedPlayer}
                basicStats={basicStats}
                trendStats={trendStats}
                insights={insights}
              />
            </Box>

            {/* Section 2: Rivalries */}
            <Box
              component={motion.section}
              variants={fadeInUp}
              sx={{ mb: 5 }}
            >
              <RivalrySection
                rivalryStats={rivalryStats}
                selectedPlayer={selectedPlayer}
              />
            </Box>

            {/* Section 3: Partnerships */}
            <Box
              component={motion.section}
              variants={fadeInUp}
              sx={{ mb: 5 }}
            >
              <PartnershipsSection
                partnershipStats={partnershipStats}
                selectedPlayer={selectedPlayer}
              />
            </Box>

            {/* Section 4: Evolution */}
            <Box
              component={motion.section}
              variants={fadeInUp}
              sx={{ mb: 5 }}
            >
              <EvolutionChart
                evolutionStats={evolutionStats}
                selectedPlayer={selectedPlayer}
              />
            </Box>

            {/* Section 5: Activity */}
            <Box
              component={motion.section}
              variants={fadeInUp}
              sx={{ mb: 5 }}
            >
              <ActivitySection
                activityStats={activityStats}
                selectedPlayer={selectedPlayer}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state during player change */}
      {isChangingPlayer && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              fontFamily: tokens.typography.bodyFont,
              color: alpha(theme.palette.text.primary, 0.6),
            }}
          >
            Cargando estadisticas...
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default StatsCharts;
