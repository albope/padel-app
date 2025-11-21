// src/components/MatchInfo.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Typography, Box, Button, IconButton, Tooltip, Modal,
  TextField, Paper, Grid, Divider, TableBody, TableRow, TableCell,
  Alert, useTheme, Skeleton
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  CalendarMonth as CalendarMonthIcon,
  Map as MapIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as firebaseService from '../services/firebaseService';

dayjs.locale('es');
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);

// --- Constantes ---
const PADEL_LOCATION = "Passing Padel";
const PADEL_PHONE = "722 18 91 91";
const MAP_IFRAME_SRC = "https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed";

const MODAL_STYLE = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper', p: 4, width: { xs: '90%', sm: 400 },
  borderRadius: '16px', boxShadow: 24, outline: 'none'
};

// Función simple para iniciales de parejas en calendario
const getPairInitials = (pairName) => {
  if (!pairName) return '';
  return pairName.split('&').map(s => s.trim().charAt(0).toUpperCase()).join('&');
};

const MatchInfo = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // --- Estados Simplificados ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noMatchDays, setNoMatchDays] = useState([]);
  const [results, setResults] = useState([]); 
  const [viewDate, setViewDate] = useState(dayjs());
  const [userMessage, setUserMessage] = useState({ type: '', text: '' });
  
  // Modal solo para "Día sin partido"
  const [noMatchModal, setNoMatchModal] = useState({ open: false, selectedDay: null, reason: '' });

  // --- Carga de Datos ---
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { noMatchDays: fetchedNoMatch, results: fetchedResults } = await firebaseService.getAllMatchData();
      
      const processedResults = fetchedResults.map(r => {
        let p1Sets = 0, p2Sets = 0;
        if (r.sets?.length) {
          r.sets.forEach(s => {
            if (parseInt(s.pair1Score) > parseInt(s.pair2Score)) p1Sets++;
            else if (parseInt(s.pair2Score) > parseInt(s.pair1Score)) p2Sets++;
          });
        }
        const p1Name = `${r.pair1?.player1 || '?'} & ${r.pair1?.player2 || '?'}`;
        const p2Name = `${r.pair2?.player1 || '?'} & ${r.pair2?.player2 || '?'}`;
        
        let winner = '', loser = '';
        if (p1Sets > p2Sets) { winner = p1Name; loser = p2Name; }
        else if (p2Sets > p1Sets) { winner = p2Name; loser = p1Name; }
        
        return { ...r, winner, loser, dateObj: dayjs(r.date) };
      });

      setResults(processedResults);
      setNoMatchDays(fetchedNoMatch);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar calendario.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Lógica: Calcular Próximo Partido General ---
  const nextPlayableDate = useMemo(() => {
    let searchDate = dayjs();
    for (let i = 0; i < 30; i++) {
      if (searchDate.day() === 1 || searchDate.day() === 4) {
        const isNoMatch = noMatchDays.some(n => dayjs(n.date).isSame(searchDate, 'day'));
        const alreadyPlayed = results.some(r => r.dateObj.isSame(searchDate, 'day'));

        if (!isNoMatch && !alreadyPlayed) {
          return searchDate;
        }
      }
      searchDate = searchDate.add(1, 'day');
    }
    return null;
  }, [noMatchDays, results]);

  // --- Manejadores ---
  const handleNoMatchSave = async () => {
    if (!noMatchModal.selectedDay) return;
    try {
      await firebaseService.addNoMatchDay({ 
        date: noMatchModal.selectedDay.format('YYYY-MM-DD'), 
        reason: noMatchModal.reason || '', 
        noMatch: true 
      });
      setUserMessage({ type: 'success', text: 'Día bloqueado correctamente.' });
      setNoMatchModal({ open: false, selectedDay: null, reason: '' });
      loadData(); 
    } catch (err) {
      console.error(err);
      setUserMessage({ type: 'error', text: 'Error al guardar.' });
    }
  };

  const handleNoMatchDelete = async (dayToDelete) => {
    const found = noMatchDays.find(n => dayjs(n.date).isSame(dayToDelete, 'day'));
    if (found?.id) {
      try {
        await firebaseService.deleteNoMatchDay(found.id);
        setUserMessage({ type: 'success', text: 'Día desbloqueado.' });
        loadData();
      } catch (err) {
        setUserMessage({ type: 'error', text: 'Error al eliminar.' });
      }
    }
  };

  // --- Lógica Visual del Calendario ---
  const getCalendarDayInfo = useCallback((currentDay) => {
    const noMatch = noMatchDays.find(n => dayjs(n.date).isSame(currentDay, 'day'));
    if (noMatch) return { type: 'noMatch', tooltip: `Cancelado: ${noMatch.reason || 'Sin motivo'}`, color: theme.palette.grey[400] };

    const played = results.find(r => r.dateObj.isSame(currentDay, 'day'));
    if (played) return { 
        type: 'played', 
        tooltip: `Ganadores: ${played.winner}`, 
        winner: played.winner, 
        loser: played.loser,
        color: theme.palette.success.light 
    };

    if (nextPlayableDate && currentDay.isSame(nextPlayableDate, 'day')) {
        return { type: 'next', tooltip: '¡Próximo Partido!', color: theme.palette.primary.main };
    }

    if ((currentDay.day() === 1 || currentDay.day() === 4) && currentDay.isAfter(dayjs())) {
        return { type: 'standard', tooltip: 'Disponible', color: theme.palette.action.hover };
    }

    return { type: 'empty', color: 'transparent' };
  }, [noMatchDays, results, nextPlayableDate, theme]);

  // --- ESTILO DEL ENCABEZADO CORREGIDO ---
  // Ahora usa primary.main -> secondary.main para consistencia total
  const headerStyle = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: theme.palette.common.white,
    padding: theme.spacing(3),
    borderRadius: 3,
    marginBottom: theme.spacing(3),
    position: 'relative',
    boxShadow: '0px 8px 20px rgba(0,0,0,0.15)'
  };

  const googleCalLink = (dayName) => `https://calendar.google.com/calendar/u/0/r/eventedit?text=Padel+${dayName}&location=${PADEL_LOCATION}`;

  return (
    <Container maxWidth="lg" sx={{ py: 3, pb: 8 }}>
      {/* HEADER */}
      <Paper elevation={0} sx={headerStyle}>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px">Información & Calendario</Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5 }}>{PADEL_LOCATION}</Typography>
        </Box>
      </Paper>

      {userMessage.text && <Alert severity={userMessage.type} onClose={() => setUserMessage({type:'', text:''})} sx={{mb:2}}>{userMessage.text}</Alert>}

      {/* INFO CARDS */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { day: 'Lunes', time: '20:00 - 21:30', link: googleCalLink('Lunes') },
          { day: 'Jueves', time: '19:30 - 21:00', link: googleCalLink('Jueves') }
        ].map((item) => (
            <Grid item xs={12} md={6} key={item.day}>
                <Paper elevation={2} sx={{ p: 2, borderRadius: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonthIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">{item.day}</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>Horario: <strong>{item.time}</strong></Typography>
                    <Box sx={{ flexGrow: 1, borderRadius: 2, overflow: 'hidden', mb: 2, minHeight: 150 }}>
                         <iframe src={MAP_IFRAME_SRC} width="100%" height="100%" style={{border:0}} loading="lazy" title="map" />
                    </Box>
                    <Button variant="outlined" startIcon={<NotificationsActiveIcon />} href={item.link} target="_blank" fullWidth>
                        Agendar
                    </Button>
                </Paper>
            </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* CALENDARIO */}
      <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button onClick={() => setViewDate(viewDate.subtract(1, 'month'))}>Ant.</Button>
            <Typography variant="h6" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                {viewDate.format('MMMM YYYY')}
            </Typography>
            <Button onClick={() => setViewDate(viewDate.add(1, 'month'))}>Sig.</Button>
        </Box>

        {isLoading ? <Skeleton variant="rectangular" height={300} /> : (
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                                <th key={d} style={{ padding: 10, color: theme.palette.text.secondary }}>{d}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Lógica de renderizado de días */}
                        {(() => {
                            const startOfMonth = viewDate.startOf('month');
                            const startCalendar = startOfMonth.startOf('isoWeek');
                            const weeks = [];
                            let dayIter = startCalendar.clone();
                            
                            for(let i=0; i<6; i++) {
                                const week = [];
                                for(let j=0; j<7; j++) {
                                    week.push(dayIter.clone());
                                    dayIter = dayIter.add(1, 'day');
                                }
                                weeks.push(week);
                            }

                            return weeks.map((week, i) => (
                                <TableRow key={i}>
                                    {week.map((dayItem, j) => {
                                        const info = getCalendarDayInfo(dayItem);
                                        const isSameMonth = dayItem.isSame(viewDate, 'month');
                                        const isToday = dayItem.isSame(dayjs(), 'day');

                                        return (
                                            <TableCell key={j} align="center" sx={{ 
                                                p: 0, border: '1px solid #eee', height: 60, verticalAlign: 'top',
                                                bgcolor: info.color, 
                                                opacity: isSameMonth ? 1 : 0.3,
                                                cursor: (dayItem.day()===1 || dayItem.day()===4) ? 'pointer' : 'default',
                                                '&:hover': { filter: 'brightness(0.95)' }
                                            }}>
                                                <Tooltip title={info.tooltip}>
                                                    <Box 
                                                        onClick={() => {
                                                            if (info.type === 'noMatch') handleNoMatchDelete(dayItem);
                                                            else if (dayItem.day()===1 || dayItem.day()===4) setNoMatchModal({ open: true, selectedDay: dayItem, reason: '' });
                                                        }}
                                                        sx={{ height: '100%', width: '100%', p: 0.5, position: 'relative' }}
                                                    >
                                                        <Typography variant="caption" fontWeight={isToday?'bold':'normal'} 
                                                            sx={{ 
                                                                display: 'inline-block', width: 24, height: 24, borderRadius: '50%', 
                                                                bgcolor: isToday ? 'black' : 'transparent', color: isToday ? 'white' : 'inherit',
                                                                lineHeight: '24px'
                                                            }}>
                                                            {dayItem.date()}
                                                        </Typography>
                                                        {info.type === 'played' && (
                                                            <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', fontWeight: 'bold', lineHeight: 1 }}>
                                                                {getPairInitials(info.winner)}
                                                            </Typography>
                                                        )}
                                                        {info.type === 'noMatch' && <EventBusyIcon sx={{ fontSize: 16, mt: 0.5, opacity: 0.5 }} />}
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ));
                        })()}
                    </tbody>
                </table>
            </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
                { label: 'Próximo', color: theme.palette.primary.main },
                { label: 'Jugado', color: theme.palette.success.light },
                { label: 'Cancelado', color: theme.palette.grey[400] }
            ].map(l => (
                <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: l.color, borderRadius: 1 }} />
                    <Typography variant="caption">{l.label}</Typography>
                </Box>
            ))}
        </Box>
      </Paper>

      {/* MODAL CANCELAR PARTIDO */}
      <Modal open={noMatchModal.open} onClose={() => setNoMatchModal({...noMatchModal, open: false})}>
        <Paper sx={MODAL_STYLE}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Marcar Día Sin Partido</Typography>
                <IconButton onClick={() => setNoMatchModal({...noMatchModal, open: false})} size="small"><CloseIcon /></IconButton>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Fecha: <strong>{noMatchModal.selectedDay?.format('dddd, DD MMMM')}</strong>
            </Typography>
            <TextField 
                fullWidth label="Motivo (Ej: Lluvia, Festivo)" 
                value={noMatchModal.reason} 
                onChange={(e) => setNoMatchModal({...noMatchModal, reason: e.target.value})}
                multiline rows={2} sx={{ mb: 3 }}
            />
            <Button variant="contained" fullWidth onClick={handleNoMatchSave}>Guardar Bloqueo</Button>
        </Paper>
      </Modal>

    </Container>
  );
};

export default MatchInfo;