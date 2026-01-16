// src/components/Calendar.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Modal,
  TextField,
  IconButton,
  Container,
  Drawer,
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import BlockIcon from '@mui/icons-material/Block';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { tokens } from '../theme';

dayjs.locale('es');
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.015,
    },
  },
};

const dayVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

const Calendar = ({ results = [], noMatchDays = [], onNoMatchSave, onNoMatchDelete }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(dayjs());
  const [noMatchModal, setNoMatchModal] = useState({ open: false, selectedDay: null, reason: '' });
  const [direction, setDirection] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false);

  // Obtener el ultimo partido jugado
  const lastPlayedDate = useMemo(() => {
    if (results.length === 0) return null;
    const sortedResults = [...results]
      .filter(r => r.date)
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
    return sortedResults.length > 0 ? dayjs(sortedResults[0].date) : null;
  }, [results]);

  // Calcular el proximo dia jugable
  const nextPlayableDay = useMemo(() => {
    let searchStartDate = dayjs();
    if (lastPlayedDate && lastPlayedDate.isSameOrAfter(searchStartDate, 'day')) {
      searchStartDate = lastPlayedDate.add(1, 'day');
    }

    let currentDate = searchStartDate.clone().subtract(1, 'day');
    for (let i = 0; i < 90; i++) {
      currentDate = currentDate.add(1, 'day');
      const dow = currentDate.day();
      if (dow === 1 || dow === 4) {
        const checkDate = currentDate;
        const isNoMatch = noMatchDays.some(nmd => dayjs(nmd.date).isSame(checkDate, 'day'));
        if (!isNoMatch) {
          return checkDate;
        }
      }
    }
    return null;
  }, [lastPlayedDate, noMatchDays]);

  // Funcion para obtener iniciales de una pareja
  const getPairInitials = useCallback((pairName) => {
    if (!pairName) return '';
    return pairName.split('&').map(s => s.trim().charAt(0).toUpperCase()).join('');
  }, []);

  // Funcion para determinar el info de cada dia
  const getCalendarDayInfo = useCallback((day) => {
    if (!day || typeof day.isSame !== 'function') {
      return { type: 'empty', tooltip: 'Error de fecha', style: {} };
    }

    const isNextPlayable = nextPlayableDay && day.isSame(nextPlayableDay, 'day');
    if (isNextPlayable) {
      return {
        type: 'nextPlayable',
        label: 'Proximo partido',
        sublabel: 'Lunes/Jueves disponible',
      };
    }

    const noMatch = noMatchDays.find(nmd => dayjs(nmd.date).isSame(day, 'day'));
    if (noMatch) {
      return {
        type: 'noMatch',
        label: 'Sin partido',
        sublabel: noMatch.reason || 'Dia marcado como no disponible',
      };
    }

    const dayResult = results.find(r => dayjs(r.date).isSame(day, 'day'));
    if (dayResult && dayResult.winner) {
      const sets = dayResult.sets?.map(s => `${s.pair1Score}-${s.pair2Score}`).join(', ') || 'N/A';
      return {
        type: 'played',
        winner: dayResult.winner,
        loser: dayResult.loser,
        sets: sets,
        label: 'Partido jugado',
        sublabel: `${dayResult.winner} vs ${dayResult.loser}`,
      };
    }

    const dow = day.day();
    if ((dow === 1 || dow === 4) && day.isSameOrAfter(dayjs(), 'day')) {
      return {
        type: 'scheduledRegular',
        label: 'Dia de partido',
        sublabel: dow === 1 ? 'Lunes' : 'Jueves',
      };
    }

    return {
      type: 'empty',
      label: 'Sin evento',
      sublabel: '',
    };
  }, [noMatchDays, results, nextPlayableDay]);

  // Manejadores
  const handleModalClose = () => {
    setNoMatchModal({ open: false, selectedDay: null, reason: '' });
  };

  const handleNoMatchSave = async () => {
    if (!noMatchModal.selectedDay) return;
    const dateStr = noMatchModal.selectedDay.format('YYYY-MM-DD');
    await onNoMatchSave({ date: dateStr, reason: noMatchModal.reason || '', noMatch: true });
    handleModalClose();
    setDayDrawerOpen(false);
  };

  const handleNoMatchDelete = async (day) => {
    await onNoMatchDelete(day);
    setDayDrawerOpen(false);
  };

  const handleQuickAdd = (day) => {
    navigate('/add-result', { state: { prefilledDate: day.format('YYYY-MM-DD') } });
  };

  const handlePrevMonth = () => {
    setDirection(-1);
    setViewDate(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setDirection(1);
    setViewDate(prev => prev.add(1, 'month'));
  };

  const handleDayClick = (day, dayInfo, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    setSelectedDay({ day, info: dayInfo });
    setDayDrawerOpen(true);
  };

  const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Obtener info del dia seleccionado para el drawer
  const selectedDayInfo = selectedDay?.info;
  const isMatchDay = selectedDay?.day && (selectedDay.day.day() === 1 || selectedDay.day.day() === 4);

  return (
    <Container maxWidth="lg" sx={{ py: 2, pb: 12, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Premium Header - Compacto en movil */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={8}
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.98)} 100%)`,
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
            mb: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
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

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <CalendarMonthIcon
              sx={{
                fontSize: { xs: 24, sm: 32 },
                color: theme.palette.secondary.main,
                filter: `drop-shadow(0 0 6px ${alpha(theme.palette.secondary.main, 0.5)})`,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontSize: { xs: '1.3rem', sm: '1.8rem' },
                letterSpacing: '0.08em',
                color: theme.palette.secondary.main,
                textShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            >
              CALENDARIO
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* Month Navigation - Mas grande y touch-friendly */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Paper
          elevation={4}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            onClick={handlePrevMonth}
            sx={{
              color: theme.palette.secondary.main,
              p: { xs: 1.5, sm: 1 },
              '&:active': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                transform: 'scale(0.95)',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: { xs: 32, sm: 28 } }} />
          </IconButton>

          <AnimatePresence mode="wait">
            <motion.div
              key={viewDate.format('YYYY-MM')}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -30 }}
              transition={{ duration: 0.2 }}
            >
              <Typography
                sx={{
                  fontFamily: tokens.typography.displayFont,
                  fontSize: { xs: '1.1rem', sm: '1.4rem' },
                  letterSpacing: '0.06em',
                  color: theme.palette.text.primary,
                  textTransform: 'uppercase',
                }}
              >
                {viewDate.format('MMMM YYYY')}
              </Typography>
            </motion.div>
          </AnimatePresence>

          <IconButton
            onClick={handleNextMonth}
            sx={{
              color: theme.palette.secondary.main,
              p: { xs: 1.5, sm: 1 },
              '&:active': {
                backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                transform: 'scale(0.95)',
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: { xs: 32, sm: 28 } }} />
          </IconButton>
        </Paper>
      </motion.div>

      {/* Calendar Grid - Optimizado para movil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
            p: { xs: 1, sm: 2 },
            mb: 2,
            overflow: 'hidden',
          }}
        >
          {/* Weekday Headers */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: { xs: 0.5, sm: 0.75 },
              mb: 1,
            }}
          >
            {weekdayLabels.map((day, idx) => (
              <Box
                key={day}
                sx={{
                  textAlign: 'center',
                  py: { xs: 0.5, sm: 1 },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: tokens.typography.displayFont,
                    fontSize: { xs: '0.75rem', sm: '0.9rem' },
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    color: idx === 5 || idx === 6
                      ? theme.palette.secondary.main
                      : alpha(theme.palette.text.primary, 0.8),
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Days Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewDate.format('YYYY-MM')}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: { xs: 0.5, sm: 0.75 },
                }}
              >
                {(() => {
                  const monthStart = viewDate.startOf('month');
                  const calendarStart = monthStart.startOf('isoWeek');
                  const daysArray = [];
                  let currentDayIter = calendarStart.clone();

                  for (let i = 0; i < 42; i++) {
                    daysArray.push(currentDayIter.clone());
                    currentDayIter = currentDayIter.add(1, 'day');
                  }

                  return daysArray.map((day) => {
                    const dayInfo = getCalendarDayInfo(day);
                    const isCurrentMonth = day.isSame(viewDate, 'month');
                    const isToday = day.isSame(dayjs(), 'day');

                    // Estilos segun tipo de dia
                    let dayStyle = {};
                    let dotColor = null;
                    let showBadge = false;

                    if (dayInfo.type === 'nextPlayable') {
                      dayStyle = {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.25)} 0%, ${alpha(theme.palette.secondary.dark, 0.35)} 100%)`,
                        border: `2px solid ${theme.palette.secondary.main}`,
                        boxShadow: `0 0 12px ${alpha(theme.palette.secondary.main, 0.4)}`,
                      };
                      dotColor = theme.palette.secondary.main;
                    } else if (dayInfo.type === 'noMatch') {
                      dayStyle = {
                        background: alpha(theme.palette.error.main, 0.15),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      };
                    } else if (dayInfo.type === 'played') {
                      dayStyle = {
                        background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 50%, ${alpha(theme.palette.error.main, 0.2)} 50%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
                      };
                      showBadge = true;
                    } else if (dayInfo.type === 'scheduledRegular') {
                      dayStyle = {
                        background: alpha(theme.palette.primary.light, 0.4),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                      };
                      dotColor = alpha(theme.palette.secondary.main, 0.5);
                    } else {
                      dayStyle = {
                        background: 'transparent',
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.08)}`,
                      };
                    }

                    return (
                      <motion.div key={day.format('YYYYMMDD')} variants={dayVariants}>
                        <Box
                          onClick={() => handleDayClick(day, dayInfo, isCurrentMonth)}
                          sx={{
                            aspectRatio: '1',
                            minHeight: { xs: 44, sm: 56 },
                            borderRadius: { xs: 1.5, sm: 2 },
                            cursor: isCurrentMonth ? 'pointer' : 'default',
                            position: 'relative',
                            opacity: isCurrentMonth ? 1 : 0.25,
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ...dayStyle,
                            '&:active': isCurrentMonth ? {
                              transform: 'scale(0.92)',
                              opacity: 0.8,
                            } : {},
                          }}
                        >
                          {/* Numero del dia */}
                          <Typography
                            sx={{
                              fontFamily: tokens.typography.monoFont,
                              fontSize: { xs: '0.85rem', sm: '1rem' },
                              fontWeight: isToday ? 800 : 600,
                              color: isToday
                                ? theme.palette.primary.dark
                                : theme.palette.text.primary,
                              backgroundColor: isToday ? theme.palette.secondary.main : 'transparent',
                              borderRadius: '50%',
                              width: isToday ? { xs: 26, sm: 30 } : 'auto',
                              height: isToday ? { xs: 26, sm: 30 } : 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isToday
                                ? `0 0 10px ${alpha(theme.palette.secondary.main, 0.6)}`
                                : 'none',
                              lineHeight: 1,
                            }}
                          >
                            {isCurrentMonth ? day.date() : ''}
                          </Typography>

                          {/* Badge para partidos jugados */}
                          {showBadge && isCurrentMonth && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: { xs: 2, sm: 4 },
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: 0.25,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: tokens.typography.monoFont,
                                  fontSize: { xs: '0.5rem', sm: '0.55rem' },
                                  fontWeight: 700,
                                  color: theme.palette.secondary.main,
                                  lineHeight: 1,
                                  textShadow: `0 1px 2px ${alpha(theme.palette.primary.dark, 0.8)}`,
                                }}
                              >
                                {getPairInitials(dayInfo.winner)}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: tokens.typography.monoFont,
                                  fontSize: { xs: '0.5rem', sm: '0.55rem' },
                                  fontWeight: 600,
                                  color: alpha(theme.palette.text.primary, 0.5),
                                  lineHeight: 1,
                                }}
                              >
                                v
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: tokens.typography.monoFont,
                                  fontSize: { xs: '0.5rem', sm: '0.55rem' },
                                  fontWeight: 600,
                                  color: alpha(theme.palette.error.light, 0.8),
                                  lineHeight: 1,
                                }}
                              >
                                {getPairInitials(dayInfo.loser)}
                              </Typography>
                            </Box>
                          )}

                          {/* Dot indicator */}
                          {dotColor && isCurrentMonth && !showBadge && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: { xs: 3, sm: 5 },
                                width: { xs: 5, sm: 6 },
                                height: { xs: 5, sm: 6 },
                                borderRadius: '50%',
                                backgroundColor: dotColor,
                                boxShadow: dayInfo.type === 'nextPlayable'
                                  ? `0 0 8px ${dotColor}`
                                  : 'none',
                              }}
                            />
                          )}

                          {/* Icono sin partido */}
                          {dayInfo.type === 'noMatch' && isCurrentMonth && (
                            <BlockIcon
                              sx={{
                                position: 'absolute',
                                bottom: { xs: 1, sm: 3 },
                                fontSize: { xs: 10, sm: 12 },
                                color: alpha(theme.palette.error.main, 0.6),
                              }}
                            />
                          )}
                        </Box>
                      </motion.div>
                    );
                  });
                })()}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Paper>
      </motion.div>

      {/* Leyenda compacta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'center',
            px: 1,
          }}
        >
          {[
            { label: 'Jugado', color: theme.palette.secondary.main, type: 'gradient' },
            { label: 'Proximo', color: theme.palette.secondary.main, type: 'glow' },
            { label: 'L/J', color: alpha(theme.palette.secondary.main, 0.5), type: 'dot' },
            { label: 'Cancelado', color: theme.palette.error.main, type: 'icon' },
          ].map((item) => (
            <Chip
              key={item.label}
              size="small"
              label={item.label}
              sx={{
                fontFamily: tokens.typography.bodyFont,
                fontSize: '0.65rem',
                height: 24,
                backgroundColor: alpha(theme.palette.primary.dark, 0.5),
                color: item.color,
                border: `1px solid ${alpha(item.color, 0.3)}`,
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          ))}
        </Box>
      </motion.div>

      {/* Day Detail Drawer - Mobile first */}
      <Drawer
        anchor="bottom"
        open={dayDrawerOpen}
        onClose={() => setDayDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            background: `linear-gradient(180deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
            borderBottom: 'none',
            maxHeight: '70vh',
          },
        }}
      >
        {selectedDay && (
          <Box sx={{ p: 3 }}>
            {/* Handle bar */}
            <Box
              sx={{
                width: 40,
                height: 4,
                backgroundColor: alpha(theme.palette.secondary.main, 0.3),
                borderRadius: 2,
                mx: 'auto',
                mb: 3,
              }}
            />

            {/* Fecha */}
            <Typography
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontSize: '1.5rem',
                letterSpacing: '0.05em',
                color: theme.palette.secondary.main,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {selectedDay.day.format('dddd')}
            </Typography>
            <Typography
              sx={{
                fontFamily: tokens.typography.monoFont,
                fontSize: '2rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
                textAlign: 'center',
                mb: 2,
              }}
            >
              {selectedDay.day.format('D MMMM YYYY')}
            </Typography>

            <Divider sx={{ borderColor: alpha(theme.palette.secondary.main, 0.2), mb: 3 }} />

            {/* Info del dia */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.dark, 0.3),
              }}
            >
              {selectedDayInfo?.type === 'played' && (
                <EmojiEventsIcon sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
              )}
              {selectedDayInfo?.type === 'nextPlayable' && (
                <SportsTennisIcon sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
              )}
              {selectedDayInfo?.type === 'scheduledRegular' && (
                <CalendarMonthIcon sx={{ fontSize: 32, color: alpha(theme.palette.secondary.main, 0.7) }} />
              )}
              {selectedDayInfo?.type === 'noMatch' && (
                <BlockIcon sx={{ fontSize: 32, color: theme.palette.error.main }} />
              )}
              {selectedDayInfo?.type === 'empty' && (
                <EventIcon sx={{ fontSize: 32, color: alpha(theme.palette.text.primary, 0.5) }} />
              )}

              <Box>
                <Typography
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  {selectedDayInfo?.label}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '0.85rem',
                    color: alpha(theme.palette.text.primary, 0.7),
                  }}
                >
                  {selectedDayInfo?.sublabel}
                </Typography>
              </Box>
            </Box>

            {/* Detalle de partido jugado */}
            {selectedDayInfo?.type === 'played' && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: tokens.typography.bodyFont,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: theme.palette.secondary.main,
                    }}
                  >
                    {selectedDayInfo.winner}
                  </Typography>
                  <Chip
                    label="GANADOR"
                    size="small"
                    sx={{
                      fontFamily: tokens.typography.displayFont,
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      height: 20,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                      color: theme.palette.secondary.main,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '0.85rem',
                    color: alpha(theme.palette.text.primary, 0.6),
                    mb: 1,
                  }}
                >
                  vs
                </Typography>
                <Typography
                  sx={{
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: alpha(theme.palette.text.primary, 0.8),
                    mb: 2,
                  }}
                >
                  {selectedDayInfo.loser}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: tokens.typography.monoFont,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    textAlign: 'center',
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.primary.dark, 0.3),
                  }}
                >
                  {selectedDayInfo.sets}
                </Typography>
              </Box>
            )}

            {/* Botones de accion */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Boton anadir partido */}
              {isMatchDay &&
                (selectedDayInfo?.type === 'empty' ||
                 selectedDayInfo?.type === 'scheduledRegular' ||
                 selectedDayInfo?.type === 'nextPlayable') && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleQuickAdd(selectedDay.day)}
                  sx={{
                    py: 1.5,
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    color: theme.palette.primary.dark,
                    borderRadius: 2,
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  }}
                >
                  Registrar Partido
                </Button>
              )}

              {/* Boton marcar sin partido */}
              {isMatchDay &&
                (selectedDayInfo?.type === 'scheduledRegular' ||
                 selectedDayInfo?.type === 'nextPlayable' ||
                 (selectedDayInfo?.type === 'empty')) && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  onClick={() => setNoMatchModal({ open: true, selectedDay: selectedDay.day, reason: '' })}
                  sx={{
                    py: 1.5,
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    borderColor: alpha(theme.palette.error.main, 0.5),
                    color: theme.palette.error.light,
                    borderRadius: 2,
                    '&:active': {
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  Marcar Sin Partido
                </Button>
              )}

              {/* Boton desmarcar sin partido */}
              {selectedDayInfo?.type === 'noMatch' && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => handleNoMatchDelete(selectedDay.day)}
                  sx={{
                    py: 1.5,
                    fontFamily: tokens.typography.bodyFont,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    borderColor: alpha(theme.palette.secondary.main, 0.5),
                    color: theme.palette.secondary.main,
                    borderRadius: 2,
                    '&:active': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    },
                  }}
                >
                  Habilitar Dia
                </Button>
              )}

              {/* Boton cerrar */}
              <Button
                fullWidth
                onClick={() => setDayDrawerOpen(false)}
                sx={{
                  py: 1,
                  fontFamily: tokens.typography.bodyFont,
                  color: alpha(theme.palette.text.primary, 0.6),
                  '&:active': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.05),
                  },
                }}
              >
                Cerrar
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Modal para marcar dia sin partido */}
      <Modal open={noMatchModal.open} onClose={handleModalClose}>
        <Paper
          elevation={12}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '92%', sm: 420 },
            borderRadius: 3,
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.98)} 0%, ${alpha(theme.palette.primary.main, 0.99)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
            p: 3,
            outline: 'none',
            overflow: 'hidden',
          }}
        >
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

          <IconButton
            onClick={handleModalClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: theme.palette.text.secondary,
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            sx={{
              fontFamily: tokens.typography.displayFont,
              fontSize: '1.2rem',
              letterSpacing: '0.06em',
              color: theme.palette.secondary.main,
              mb: 2,
            }}
          >
            MARCAR SIN PARTIDO
          </Typography>

          <Typography
            sx={{
              fontFamily: tokens.typography.bodyFont,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            {noMatchModal.selectedDay?.format('dddd, DD/MM/YYYY')}
          </Typography>

          <TextField
            fullWidth
            label="Motivo (opcional)"
            value={noMatchModal.reason}
            onChange={(e) => setNoMatchModal((p) => ({ ...p, reason: e.target.value }))}
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              onClick={handleModalClose}
              sx={{
                py: 1.5,
                color: theme.palette.text.secondary,
              }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleNoMatchSave}
              sx={{
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                color: theme.palette.primary.dark,
                fontWeight: 600,
              }}
            >
              Guardar
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Container>
  );
};

export default Calendar;
