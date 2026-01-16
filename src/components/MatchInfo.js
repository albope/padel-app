// MatchInfo.js - Premium "Athletic Luxury Club" Design
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PhoneIcon from '@mui/icons-material/Phone';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BlockIcon from '@mui/icons-material/Block';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

// Context hooks
import { useSnackbar } from '../context/SnackbarContext';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import advancedFormat from 'dayjs/plugin/advancedFormat';

// Importa los servicios de Firebase
import * as firebaseService from '../services/firebaseService';

// Importar el componente Calendar y tokens
import Calendar from './Calendar';
import { tokens } from '../theme';

dayjs.locale('es');
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

// --- Constantes ---
const PADEL_LOCATION = "Passing Padel";
const PADEL_PHONE = "722 18 91 91";
const MAP_IFRAME_SRC = "https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color, theme }) => (
  <motion.div variants={itemVariants}>
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(color, 0.3)}`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Top accent line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
        }}
      />

      <Icon
        sx={{
          fontSize: { xs: 28, sm: 32 },
          color: color,
          mb: 1,
          filter: `drop-shadow(0 0 8px ${alpha(color, 0.4)})`,
        }}
      />

      <Typography
        sx={{
          fontFamily: tokens.typography.monoFont,
          fontSize: { xs: '2rem', sm: '2.5rem' },
          fontWeight: 700,
          color: color,
          lineHeight: 1,
          textShadow: `0 0 20px ${alpha(color, 0.3)}`,
        }}
      >
        {value}
      </Typography>

      <Typography
        sx={{
          fontFamily: tokens.typography.bodyFont,
          fontSize: { xs: '0.75rem', sm: '0.85rem' },
          color: theme.palette.text.secondary,
          mt: 0.5,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Paper>
  </motion.div>
);

// Schedule Card Component
const ScheduleCard = ({ day, time, calendarLink, theme }) => (
  <motion.div variants={itemVariants}>
    <Paper
      elevation={6}
      sx={{
        borderRadius: 3,
        background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
          p: 2,
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${tokens.colors.electricLime.main} 50%, ${theme.palette.secondary.main} 100%)`,
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalendarMonthIcon
            sx={{
              fontSize: 24,
              color: theme.palette.secondary.main,
              filter: `drop-shadow(0 0 6px ${alpha(theme.palette.secondary.main, 0.5)})`,
            }}
          />
          <Typography
            sx={{
              fontFamily: tokens.typography.displayFont,
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              letterSpacing: '0.08em',
              color: theme.palette.secondary.main,
            }}
          >
            {day.toUpperCase()}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Time */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
          <Typography
            sx={{
              fontFamily: tokens.typography.monoFont,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            {time}
          </Typography>
        </Box>

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocationOnIcon sx={{ fontSize: 18, color: alpha(theme.palette.secondary.main, 0.7) }} />
          <Typography
            sx={{
              fontFamily: tokens.typography.bodyFont,
              fontSize: '0.9rem',
              color: theme.palette.text.primary,
              fontWeight: 500,
            }}
          >
            {PADEL_LOCATION}
          </Typography>
        </Box>

        {/* Phone */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PhoneIcon sx={{ fontSize: 18, color: alpha(theme.palette.secondary.main, 0.7) }} />
          <Typography
            sx={{
              fontFamily: tokens.typography.monoFont,
              fontSize: '0.85rem',
              color: theme.palette.text.secondary,
            }}
          >
            {PADEL_PHONE}
          </Typography>
        </Box>

        {/* Map */}
        <Box
          sx={{
            flex: 1,
            minHeight: 140,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            mb: 2,
          }}
        >
          <iframe
            src={MAP_IFRAME_SRC}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: 140, filter: 'saturate(0.8) contrast(1.1)' }}
            allowFullScreen
            loading="lazy"
            title={`Mapa ${PADEL_LOCATION} ${day}`}
          />
        </Box>

        {/* Calendar Button */}
        <Button
          component="a"
          href={calendarLink}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<NotificationsActiveIcon />}
          fullWidth
          sx={{
            py: 1.2,
            fontFamily: tokens.typography.bodyFont,
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            color: theme.palette.primary.dark,
            mt: 'auto',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
        >
          Anadir a Calendar
        </Button>
      </Box>
    </Paper>
  </motion.div>
);

const MatchInfo = () => {
  const theme = useTheme();
  const { showSuccess, showError: showSnackbarError } = useSnackbar();

  // --- Estados ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noMatchDays, setNoMatchDays] = useState([]);
  const [results, setResults] = useState([]);

  // --- Logica de Carga de Datos ---
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { noMatchDays: fetchedNoMatch, results: fetchedResults } = await firebaseService.getAllMatchData();

      const processedResults = fetchedResults.map(r => {
        let p1Sets = 0, p2Sets = 0;
        if (r.sets?.length) {
          r.sets.forEach(s => {
            const score1 = parseInt(s.pair1Score, 10);
            const score2 = parseInt(s.pair2Score, 10);
            if (score1 > score2) p1Sets++;
            else if (score2 > score1) p2Sets++;
          });
        }

        const p1Name = `${r.pair1?.player1 || ''} & ${r.pair1?.player2 || ''}`.trim();
        const p2Name = `${r.pair2?.player1 || ''} & ${r.pair2?.player2 || ''}`.trim();

        let winner = '', loser = '';
        if (p1Sets > p2Sets) {
          winner = p1Name;
          loser = p2Name;
        } else if (p2Sets > p1Sets) {
          winner = p2Name;
          loser = p1Name;
        }

        return { ...r, winner, loser };
      });

      setResults(processedResults);
      setNoMatchDays(fetchedNoMatch);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos. Por favor, intentalo de nuevo mas tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --- Manejadores de Eventos del Calendario ---
  const handleNoMatchSave = async (noMatchData) => {
    setIsLoading(true);
    try {
      await firebaseService.addNoMatchDay(noMatchData);
      showSuccess('Dia sin partido guardado');
      await loadAllData();
    } catch (err) {
      console.error("Error saving no match day:", err);
      showSnackbarError('Error al guardar dia sin partido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoMatchDelete = async (dayToDelete) => {
    const found = noMatchDays.find(n => dayjs(n.date).isSame(dayToDelete, 'day'));
    if (found?.id) {
      setIsLoading(true);
      try {
        await firebaseService.deleteNoMatchDay(found.id);
        showSuccess('Dia sin partido eliminado');
        await loadAllData();
      } catch (err) {
        console.error("Error deleting no match day:", err);
        showSnackbarError('Error al eliminar dia sin partido');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- Enlaces de Google Calendar ---
  const calendarLinks = useMemo(() => {
    const createLink = (textSuffix, dayOfWeekISO, timeStart, timeEnd) => {
      try {
        let date = dayjs();
        const targetIsoDay = parseInt(dayOfWeekISO, 10);

        if (isNaN(targetIsoDay) || targetIsoDay < 1 || targetIsoDay > 7) {
          console.error("calendarLinks: Invalid dayOfWeekISO:", dayOfWeekISO);
          return "#error-invalid-day";
        }

        let attempts = 0;
        while (date.isoWeekday() !== targetIsoDay && attempts < 14) {
          date = date.add(1, 'day');
          attempts++;
        }

        if (attempts >= 14) {
          console.error("calendarLinks: Could not find target day for", textSuffix);
          return "#error-day-not-found";
        }

        const datesParam = `${date.format('YYYYMMDD')}T${timeStart}/${date.format('YYYYMMDD')}T${timeEnd}`;
        const dayCodeForRecur = date.format('dd').substring(0, 2).toUpperCase();

        const params = new URLSearchParams({
          action: 'TEMPLATE',
          text: `Partida Padel - ${textSuffix}`,
          dates: datesParam,
          details: `Partida de padel en ${PADEL_LOCATION}`,
          location: PADEL_LOCATION,
          recur: `RRULE:FREQ=WEEKLY;BYDAY=${dayCodeForRecur}`
        });
        return `https://www.google.com/calendar/render?${params.toString()}`;
      } catch (e) {
        console.error(`calendarLinks: Error in createLink for ${textSuffix}:`, e);
        return "#error-creating-link";
      }
    };

    const mondayLink = createLink('Lunes', 1, '200000', '213000');
    const thursdayLink = createLink('Jueves', 4, '193000', '210000');

    return {
      monday: mondayLink,
      thursday: thursdayLink,
    };
  }, []);

  // Calculate last match date
  const lastMatchDate = useMemo(() => {
    if (results.length === 0) return '-';
    const sorted = [...results].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    const lastDate = sorted[0]?.date;
    if (!lastDate) return '-';
    const dateObj = lastDate.toDate ? lastDate.toDate() : new Date(lastDate);
    return dayjs(dateObj).format('DD/MM');
  }, [results]);

  // --- Renderizado ---
  if (isLoading && !results.length && !noMatchDays.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress
          size={48}
          sx={{ color: theme.palette.secondary.main }}
        />
        <Typography
          sx={{
            fontFamily: tokens.typography.bodyFont,
            color: theme.palette.text.secondary,
          }}
        >
          Cargando datos...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2, pb: 12, px: { xs: 1, sm: 2, md: 3 } }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Premium Header */}
        <motion.div variants={itemVariants}>
          <Paper
            elevation={8}
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
              p: { xs: 2, sm: 3 },
              textAlign: 'center',
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
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

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              <SportsTennisIcon
                sx={{
                  fontSize: { xs: 28, sm: 36 },
                  color: theme.palette.secondary.main,
                  filter: `drop-shadow(0 0 8px ${alpha(theme.palette.secondary.main, 0.5)})`,
                }}
              />
              <Typography
                sx={{
                  fontFamily: tokens.typography.displayFont,
                  fontSize: { xs: '1.4rem', sm: '2rem' },
                  letterSpacing: '0.08em',
                  color: theme.palette.secondary.main,
                  textShadow: `0 0 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
                }}
              >
                PARTIDAS DE PADEL
              </Typography>
            </Box>

            <Chip
              label="Lunes & Jueves"
              size="small"
              sx={{
                mt: 1.5,
                fontFamily: tokens.typography.bodyFont,
                fontSize: '0.75rem',
                backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                color: theme.palette.secondary.main,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            />
          </Paper>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Schedule Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 2, sm: 3 },
            mb: 3,
          }}
        >
          <ScheduleCard
            day="Lunes"
            time="20:00 - 21:30"
            calendarLink={calendarLinks.monday}
            theme={theme}
          />
          <ScheduleCard
            day="Jueves"
            time="19:30 - 21:00"
            calendarLink={calendarLinks.thursday}
            theme={theme}
          />
        </Box>

        {/* Stats Section */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                letterSpacing: '0.1em',
                color: theme.palette.secondary.main,
                mb: 2,
                textAlign: 'center',
              }}
            >
              RESUMEN DE ACTIVIDAD
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(3, 1fr)' },
                gap: { xs: 1, sm: 2 },
              }}
            >
              <StatCard
                icon={EmojiEventsIcon}
                value={results.length}
                label="Partidos"
                color={theme.palette.secondary.main}
                theme={theme}
              />
              <StatCard
                icon={BlockIcon}
                value={noMatchDays.length}
                label="Cancelados"
                color={theme.palette.error.main}
                theme={theme}
              />
              <StatCard
                icon={TrendingUpIcon}
                value={lastMatchDate}
                label="Ultimo"
                color={tokens.colors.electricLime.main}
                theme={theme}
              />
            </Box>
          </Box>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants}>
          <Divider
            sx={{
              my: 3,
              borderColor: alpha(theme.palette.secondary.main, 0.2),
              '&::before, &::after': {
                borderColor: alpha(theme.palette.secondary.main, 0.2),
              },
            }}
          >
            <Chip
              icon={<CalendarMonthIcon sx={{ color: `${theme.palette.secondary.main} !important` }} />}
              label="CALENDARIO"
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                backgroundColor: alpha(theme.palette.primary.dark, 0.5),
                color: theme.palette.secondary.main,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            />
          </Divider>
        </motion.div>

        {/* Calendar Component */}
        <motion.div variants={itemVariants}>
          <Calendar
            results={results}
            noMatchDays={noMatchDays}
            onNoMatchSave={handleNoMatchSave}
            onNoMatchDelete={handleNoMatchDelete}
          />
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default MatchInfo;
