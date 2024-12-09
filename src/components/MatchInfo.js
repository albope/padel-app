// MatchInfo.js

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Modal,
  TextField,
  Paper,
  Grid,
  Divider,
  TableContainer,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ajustar según la configuración

dayjs.locale('es');

const styleModal = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'white',
  p: 4,
  width: 300,
  borderRadius: '8px',
  position: 'relative'
};

const availablePlayers = ['Lucas','Bort','Martin','Ricardo'];

const MatchInfo = () => {
  const navigate = useNavigate();

  const calendarLinkMonday = `https://www.google.com/calendar/render?action=TEMPLATE&text=Partida%20de%20Padel%20-%20Lunes&dates=20241209T180000Z/20241209T193000Z&details=Partida%20de%20padel&location=Passing%20Padel&recur=RRULE:FREQ=WEEKLY;BYDAY=MO`;
  const calendarLinkThursday = `https://www.google.com/calendar/render?action=TEMPLATE&text=Partida%20de%20Padel%20-%20Jueves&dates=20241212T173000Z/20241212T190000Z&details=Partida%20de%20padel&location=Passing%20Padel&recur=RRULE:FREQ=WEEKLY;BYDAY=TH`;

  const [cycles, setCycles] = useState([]);
  const [currentCycle, setCurrentCycle] = useState(null);
  const [noMatchDays, setNoMatchDays] = useState([]);
  const [results, setResults] = useState([]);

  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [noMatchReason, setNoMatchReason] = useState('');

  const [nextMatchInfo, setNextMatchInfo] = useState('');
  const [nextMatchDate, setNextMatchDate] = useState(null);
  const [nextMatchPairs, setNextMatchPairs] = useState('');
  const [currentCycleNumber, setCurrentCycleNumber] = useState(0);
  const [previousNoMatchMessage, setPreviousNoMatchMessage] = useState('');

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [viewYear, setViewYear] = useState(2024);
  const [viewMonth, setViewMonth] = useState(11);

  const [pair1Player1, setPair1Player1] = useState('');
  const [pair1Player2, setPair1Player2] = useState('');
  const [pair2Player1, setPair2Player1] = useState('');
  const [pair2Player2, setPair2Player2] = useState('');

  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  const [cyclesCurrentPage, setCyclesCurrentPage] = useState(1);
  const cyclesPerPage = 5;

  const loadData = async () => {
    const cyclesSnap = await getDocs(collection(db, 'cycles'));
    const loadedCycles = [];
    cyclesSnap.forEach(docu => {
      loadedCycles.push({ id: docu.id, ...docu.data() });
    });
    loadedCycles.sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    setCycles(loadedCycles);

    if (loadedCycles.length>0) {
      setMinDate(dayjs(loadedCycles[0].startDate));
      const lastC = loadedCycles[loadedCycles.length-1];
      setMaxDate(lastC.endDate?dayjs(lastC.endDate):dayjs());
    }

    const now = dayjs();
    let current = null;
    let cycleNum = 0;
    for (let i = 0; i < loadedCycles.length; i++) {
      const c = loadedCycles[i];
      cycleNum = i + 1;
      if (!c.endDate || dayjs(c.endDate).isAfter(now)) {
        current = c;
        break;
      }
    }
    if (!current && loadedCycles.length > 0) {
      current = loadedCycles[loadedCycles.length - 1];
      cycleNum = loadedCycles.length;
    }
    setCurrentCycle(current);
    setCurrentCycleNumber(cycleNum);

    const noMatchSnap = await getDocs(collection(db, 'noMatchDays'));
    const loadedNoMatch = [];
    noMatchSnap.forEach(docu => {
      loadedNoMatch.push({ id: docu.id, ...docu.data() });
    });
    setNoMatchDays(loadedNoMatch);

    const resultsSnap = await getDocs(collection(db, 'results'));
    let loadedResults = [];
    resultsSnap.forEach(docu => {
      const r = docu.data();
      let pair1SetsWon=0;
      let pair2SetsWon=0;
      if (r.sets && r.sets.length>0) {
        r.sets.forEach(s=>{
          const p1Score = parseInt(s.pair1Score,10);
          const p2Score = parseInt(s.pair2Score,10);
          if (p1Score > p2Score) pair1SetsWon++;
          else if (p2Score > p1Score) pair2SetsWon++;
        });
      }

      const pair1Name = `${r.pair1.player1} & ${r.pair1.player2}`;
      const pair2Name = `${r.pair2.player1} & ${r.pair2.player2}`;
      let winner='', loser='';
      if (pair1SetsWon>pair2SetsWon) {
        winner=pair1Name; loser=pair2Name;
      } else if (pair2SetsWon>pair1SetsWon) {
        winner=pair2Name; loser=pair1Name;
      }

      const date = r.date;
      let cycleId=null;
      for (const c of loadedCycles) {
        if ((dayjs(date).isSame(c.startDate,'day')||dayjs(date).isAfter(c.startDate)) &&
            c.endDate && (dayjs(date).isBefore(c.endDate,'day')||dayjs(date).isSame(c.endDate,'day'))) {
          cycleId = c.id;
          break;
        }
      }

      loadedResults.push({
        id: docu.id,
        ...r,
        winner,
        loser,
        cycleId
      });
    });

    setResults(loadedResults);

    for (const c of loadedCycles) {
      const cycleMatches = loadedResults.filter(m=>m.cycleId===c.id && m.winner && m.loser).sort((a,b)=>dayjs(a.date).diff(dayjs(b.date)));
      cycleMatches.forEach((m,i)=>{
        m.matchNumberInCycle = i+1;
      });
    }

    setResults([...loadedResults]);

    if (current) {
      const cycleResults = loadedResults.filter(m => m.cycleId===current.id && m.winner && m.loser);
      let lastMatchDate = null;
      cycleResults.forEach(m => {
        const d = dayjs(m.date, 'YYYY-MM-DD');
        if (!lastMatchDate || d.isAfter(lastMatchDate)) {
          lastMatchDate = d;
        }
      });

      let nextDate = current.startDate ? dayjs(current.startDate) : dayjs();
      if (lastMatchDate && lastMatchDate.isAfter(dayjs())) {
        let nextPossible = lastMatchDate;
        for (let i = 1; i <= 60; i++) {
          nextPossible = nextPossible.add(1, 'day');
          const dow = nextPossible.day();
          if (dow === 1 || dow === 4) {
            const nm = loadedNoMatch.find(n => dayjs(n.date, 'YYYY-MM-DD').isSame(nextPossible, 'day'));
            if (!nm) {
              nextDate = nextPossible;
              break;
            }
          }
        }
      }

      setNextMatchDate(nextDate);
      const pairs = current && current.currentPairs ? current.currentPairs : "Martin & Bort vs Lucas & Ricardo";
      setNextMatchPairs(pairs);

      const recentNoMatch = loadedNoMatch.filter(n => dayjs(n.date, 'YYYY-MM-DD').isBefore(nextDate));
      if (recentNoMatch.length > 0) {
        const lastNoMatch = recentNoMatch.sort((a,b)=>dayjs(b.date).diff(dayjs(a.date)))[0];
        const reasonText = lastNoMatch.reason ? ` (motivo: ${lastNoMatch.reason})` : '';
        setPreviousNoMatchMessage(`El partido del ${dayjs(lastNoMatch.date).format('DD/MM')} no se jugó${reasonText}. Próximo partido: ${nextDate.format('DD/MM/YYYY')}`);
      } else {
        setPreviousNoMatchMessage('');
      }

      // Actualizar el texto del ciclo disputado con la cantidad de ciclos cargados
      setNextMatchInfo(`${loadedCycles.length}º ciclo disputado`);
    } else {
      setNextMatchInfo('');
      setNextMatchDate(null);
      setNextMatchPairs('');
      setPreviousNoMatchMessage('');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleNoMatchSave = async () => {
    if (!selectedDay) return;
    const dateStr = selectedDay.format('YYYY-MM-DD');
    await addDoc(collection(db, 'noMatchDays'), {
      date: dateStr,
      reason: noMatchReason || '',
      noMatch: true
    });
    setModalOpen(false);
    setNoMatchReason('');
    setSelectedDay(null);
    loadData();
  };

  const handlePrevMonth = () => {
    let newMonth = viewMonth - 1;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = viewMonth + 1;
    let newYear = viewYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const getInitials = (pairName) => {
    const names = pairName.split('&').map(s=>s.trim());
    return names.map(n=>n.charAt(0)).join('&');
  };

  const getSetsString = (sets) => {
    if (!sets) return '';
    return sets.map(s=>`${s.pair1Score}-${s.pair2Score}`).join(', ');
  };

  const getMatchTooltip = (match) => {
    const setsDetail = getSetsString(match.sets);
    const matchOrdinalText = match.matchNumberInCycle ? `${match.matchNumberInCycle}º partido del ciclo` : '';
    return `${match.winner} ganaron contra ${match.loser} (${setsDetail}) en ${match.location}. ${matchOrdinalText}.`;
  };

  const getDayStyle = (d) => {
    const nm = noMatchDays.find(n=> dayjs(n.date,'YYYY-MM-DD').isSame(d,'day'));
    if (nm) {
      return { type:'noMatch', tooltip: `Día sin partido${nm.reason ? ' (motivo: '+nm.reason+')' : ''}` };
    }

    const dayResult = results.filter(m=>m.date===d.format('YYYY-MM-DD') && m.winner && m.loser);
    if (dayResult && dayResult.length>0) {
      const match = dayResult[0];
      const tooltip = getMatchTooltip(match);
      return { type:'played', winner: match.winner, loser: match.loser, tooltip };
    }

    const dow = d.day();
    if (dow===1 || dow===4) {
      return { type:'scheduled', tooltip:'Partido programado' };
    }

    return { type:'empty', tooltip:'Sin evento' };
  };

  const renderDayCell = (d) => {
    const ds = getDayStyle(d);
    const dayNumber = d.month()===viewMonth?d.date():'';
    let cellContent=null;
    let cellSx = {cursor:'pointer', width:'40px', height:'40px', position:'relative', p:0};

    if (!dayNumber) {
      return <TableCell key={d.format()} sx={{backgroundColor:'white'}}></TableCell>;
    }

    switch(ds.type) {
      case 'noMatch':
        cellSx.backgroundColor='grey';
        break;
      case 'played':
        cellSx.background='linear-gradient(to bottom, green 50%, red 50%)';
        const wInit = getInitials(ds.winner);
        const lInit = getInitials(ds.loser);
        cellContent=(
          <Box sx={{position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column'}}>
            <Box sx={{flex:1, display:'flex',justifyContent:'center',alignItems:'center',color:'white',fontWeight:'bold'}}>
              {wInit}
            </Box>
            <Box sx={{flex:1, display:'flex',justifyContent:'center',alignItems:'center',color:'white',fontWeight:'bold'}}>
              {lInit}
            </Box>
          </Box>
        );
        break;
      case 'scheduled':
        cellSx.backgroundColor='lightblue';
        break;
      case 'empty':
        cellSx.backgroundColor='white';
        break;
      default:
        cellSx.backgroundColor='white';
    }

    return (
      <Tooltip key={d.format()} title={ds.tooltip}>
        <TableCell align="center" sx={cellSx} onClick={()=>handleDayClick(d)}>
          {dayNumber}
          {cellContent}
        </TableCell>
      </Tooltip>
    );
  };

  let showPairSelection = false;
  if (!currentCycle) {
    showPairSelection = true;
  } else {
    const cycleMatches = results.filter(m=>m.cycleId===currentCycle.id && m.winner && m.loser);
    if (cycleMatches.length===3) {
      showPairSelection = true;
    }
  }

  const handleSaveNextCycle = async () => {
    if (!pair1Player1 || !pair1Player2 || !pair2Player1 || !pair2Player2) return;
    const chosen = [pair1Player1,pair1Player2,pair2Player1,pair2Player2];
    const uniqueChosen = new Set(chosen);
    if (uniqueChosen.size<4) {
      alert('Debes elegir 4 jugadores diferentes.');
      return;
    }

    const pairsText = `${pair1Player1} & ${pair1Player2} vs ${pair2Player1} & ${pair2Player2}`;
    let startDate = dayjs();
    if (cycles.length>0) {
      const lastC = cycles[cycles.length-1];
      const refDate = lastC.endDate?dayjs(lastC.endDate):dayjs();
      let found=false;
      let checkDate = refDate;
      for (let i=0;i<60;i++){
        checkDate=checkDate.add(1,'day');
        const dow=checkDate.day();
        if(dow===1||dow===4){
          startDate=checkDate;
          found=true;
          break;
        }
      }
      if(!found) startDate=refDate.add(1,'day');
    } else {
      let d = dayjs();
      let found=false;
      for(let i=0;i<60;i++){
        const dow=d.day();
        if(dow===1||dow===4){
          startDate=d;
          found=true;
          break;
        }
        d=d.add(1,'day');
      }
      if(!found) startDate=dayjs().add(1,'day');
    }

    await addDoc(collection(db,'cycles'),{
      startDate: startDate.format('YYYY-MM-DD'),
      currentPairs: pairsText
    });
    alert('Nuevo ciclo configurado con éxito.');
    setPair1Player1('');setPair1Player2('');setPair2Player1('');setPair2Player2('');
    loadData();
  };

  const handleCancelCurrentCycle = async () => {
    if (!currentCycle) {
      alert("No hay un ciclo activo para anular.");
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas anular el ciclo "${currentCycle.currentPairs}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'cycles', currentCycle.id));
      const associatedResults = results.filter((r) => r.cycleId === currentCycle.id);
      for (const result of associatedResults) {
        await deleteDoc(doc(db, 'results', result.id));
      }

      alert("El ciclo ha sido anulado exitosamente.");
      loadData();
    } catch (error) {
      console.error("Error al anular el ciclo:", error);
      alert("Ocurrió un error al intentar anular el ciclo. Por favor, inténtalo de nuevo.");
    }
  };

  let cycleProgress = null;
  if (currentCycle) {
    const cycleMatches = results.filter(m=>m.cycleId===currentCycle.id && m.winner && m.loser);
    const played = cycleMatches.length;
    cycleProgress = (
      <Box sx={{ mt:2 }}>
        <Typography variant="body2">Progreso del ciclo: {played} de 3 partidos jugados</Typography>
        <LinearProgress variant="determinate" value={(played/3)*100}/>
      </Box>
    );
  }

  const cycleHistory = cycles.map((c,i)=>{
    const cResults = results.filter(m=>m.cycleId===c.id && m.winner && m.loser).sort((a,b)=>dayjs(a.date).diff(dayjs(b.date)));
    const cNoMatches = noMatchDays.filter(n=> dayjs(n.date,'YYYY-MM-DD').isBetween(c.startDate,c.endDate,'day','[]'));
    let cycleResult = '';
    const pairs = c.currentPairs ? c.currentPairs.split('vs').map(x=>x.trim()) : [];
    const firstPair = pairs[0];
    const secondPair = pairs[1];

    const wins = cResults.filter(m=>{
      if (!c.currentPairs) return false;
      return m.winner===firstPair;
    }).length;

    if (cResults.length===3) {
      cycleResult = wins>=2?'Victoria':'Derrota';
    }

    return {
      cycleNumber: i+1,
      startDate: c.startDate,
      endDate: c.endDate,
      matches: cResults,
      noMatches: cNoMatches,
      result: cycleResult,
      currentPairs: c.currentPairs,
      firstPair,
      secondPair
    };
  });

  const startIndexCycles = (cyclesCurrentPage - 1) * cyclesPerPage;
  const endIndexCycles = startIndexCycles + cyclesPerPage;
  const paginatedCycles = cycleHistory.slice(startIndexCycles, endIndexCycles);

  const dayOfWeek = nextMatchDate ? nextMatchDate.day() : null;
  let nextMatchHour = '';
  if (dayOfWeek===1) nextMatchHour='20:00';
  else if (dayOfWeek===4) nextMatchHour='19:30';

  return (
    <Container>
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Información de las Partidas</Typography>
      </Box>

      {/* Partidas recurrentes */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Partida del Lunes</strong></Typography>
        <Typography variant="body1">Fecha: Lunes, <strong>20:00 - 21:30</strong></Typography>
        <Typography variant="body1">Lugar: <strong>Passing Padel</strong></Typography>
        <Typography variant="body1">Teléfono: <strong>722 18 91 91</strong></Typography>
        <Box sx={{ marginTop: '10px' }}>
          <iframe
            src="https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Mapa Passing Padel"
          ></iframe>
        </Box>
        <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
          <Button
            component="a"
            href={calendarLinkMonday}
            target="_blank"
            startIcon={<NotificationsActiveIcon sx={{ color: 'red' }} />}
            sx={{
              textTransform: 'none',
              backgroundColor: '#f0f0f0',
              color: '#333',
              '&:hover': { backgroundColor: '#ddd' }
            }}
          >
            Añadir la Partida del Lunes a Google Calendar
          </Button>
        </Box>
      </Box>

      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Partida del Jueves</strong></Typography>
        <Typography variant="body1">Fecha: Jueves, <strong>19:30 - 21:00</strong></Typography>
        <Typography variant="body1">Lugar: <strong>Passing Padel</strong></Typography>
        <Typography variant="body1">Teléfono: <strong>722 18 91 91</strong></Typography>
        <Box sx={{ marginTop: '10px' }}>
          <iframe
            src="https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Mapa Passing Padel"
          ></iframe>
        </Box>
        <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
          <Button
            component="a"
            href={calendarLinkThursday}
            target="_blank"
            startIcon={<NotificationsActiveIcon sx={{ color: 'red' }} />}
            sx={{
              textTransform: 'none',
              backgroundColor: '#f0f0f0',
              color: '#333',
              '&:hover': { backgroundColor: '#ddd' }
            }}
          >
            Añadir la Partida del Jueves a Google Calendar
          </Button>
        </Box>
      </Box>

      {previousNoMatchMessage && (
        <Typography variant="body1" sx={{ color:'red', mt:3 }}>{previousNoMatchMessage}</Typography>
      )}
      {nextMatchDate && (
        <Box sx={{ marginTop:'20px', padding:'10px', border:'1px solid #ccc', borderRadius:'8px' }}>
          <Typography variant="h6"><strong>Próximo Partido</strong></Typography>
          <Typography variant="body1">Fecha: <strong>{nextMatchDate.format('DD/MM/YYYY')}</strong></Typography>
          <Typography variant="body1">Parejas: <strong>{nextMatchPairs}</strong></Typography>
          <Typography variant="body1">{nextMatchInfo}</Typography>
          {currentCycle && (
            <Typography variant="body1" sx={{ mt:1 }}>
              Parejas en el ciclo en curso: <strong>{currentCycle.currentPairs}</strong>
            </Typography>
          )}
          {cycleProgress}
          {currentCycle && (!currentCycle.endDate || dayjs(currentCycle.endDate).isAfter(dayjs())) && (
            <Box sx={{ textAlign: 'right', mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelCurrentCycle}
                sx={{
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#d32f2f' },
                }}
              >
                Anular ciclo actual
              </Button>
            </Box>
          )}
        </Box>
      )}

      {showPairSelection && (
        <Box sx={{ marginTop:'20px', padding:'10px', border:'1px solid #ccc', borderRadius:'8px' }}>
          <Typography variant="h6">Configurar Próximo Ciclo</Typography>
          <Typography variant="body2">Selecciona 4 jugadores diferentes para las parejas del próximo ciclo.</Typography>
          <Grid container spacing={2} sx={{ mt:1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 1 - Jugador 1</InputLabel>
                <Select value={pair1Player1} onChange={(e)=>setPair1Player1(e.target.value)}>
                  {availablePlayers.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 1 - Jugador 2</InputLabel>
                <Select value={pair1Player2} onChange={(e)=>setPair1Player2(e.target.value)}>
                  {availablePlayers.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 2 - Jugador 1</InputLabel>
                <Select value={pair2Player1} onChange={(e)=>setPair2Player1(e.target.value)}>
                  {availablePlayers.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 2 - Jugador 2</InputLabel>
                <Select value={pair2Player2} onChange={(e)=>setPair2Player2(e.target.value)}>
                  {availablePlayers.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ textAlign:'right', mt:2 }}>
            <Button variant="contained" onClick={handleSaveNextCycle}>Guardar</Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mt:4 }}>
        <Button variant="outlined" onClick={handlePrevMonth}>Mes Anterior</Button>
        <Typography variant="body1">{dayjs().year(viewYear).month(viewMonth).format('MMMM YYYY')}</Typography>
        <Button variant="outlined" onClick={handleNextMonth}>Mes Siguiente</Button>
      </Box>

      <Box sx={{ marginTop:'20px' }}>
        <Typography variant="h6"><strong>Calendario</strong></Typography>
        <Typography variant="body2">Haz clic en un día para marcar "Día sin partido".</Typography>
        <Box sx={{ marginTop:'10px', overflowX:'auto' }}>
          <TableContainer component={Paper}>
            <TableBody>
              <TableRow>
                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>(
                  <TableCell key={d} align="center"><strong>{d}</strong></TableCell>
                ))}
              </TableRow>
              {(()=>{
                const startOfMonth = dayjs().year(viewYear).month(viewMonth).startOf('month');
                const endOfMonth = dayjs().year(viewYear).month(viewMonth).endOf('month');
                const weeks = [];
                let startDay = startOfMonth;
                while (startDay.day()!==1) {
                  startDay = startDay.subtract(1,'day');
                }
                let currentDay = startDay.clone();
                while (currentDay.isBefore(endOfMonth) || currentDay.isSame(endOfMonth,'day')) {
                  const weekDays = [];
                  for (let i=0; i<7; i++) {
                    weekDays.push(currentDay);
                    currentDay = currentDay.add(1,'day');
                  }
                  weeks.push(weekDays);
                }

                return weeks.map((week,wIndex)=>(
                  <TableRow key={wIndex}>
                    {week.map(day=>renderDayCell(day))}
                  </TableRow>
                ));
              })()}
            </TableBody>
          </TableContainer>
        </Box>
      </Box>

      <Box sx={{ mt:2 }}>
        <Typography variant="subtitle1"><strong>Leyenda:</strong></Typography>
        <Typography variant="body2">- Mitad superior verde y mitad inferior roja: Partido jugado (superior=ganador, inferior=perdedor, iniciales)</Typography>
        <Typography variant="body2">- Gris: Día sin partido</Typography>
        <Typography variant="body2">- Azul claro: Partido programado (lunes/jueves sin resultado)</Typography>
        <Typography variant="body2">- Blanco: Sin evento</Typography>
      </Box>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)}>
        <Box sx={styleModal}>
          <IconButton
            sx={{ position:'absolute', top:5, right:5, color:'red' }}
            onClick={()=>setModalOpen(false)}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6">Marcar como día sin partido</Typography>
          <Typography variant="body1" sx={{ mt:2 }}>
            {selectedDay ? `Día: ${selectedDay.format('DD/MM/YYYY')}` : ''}
          </Typography>
          <TextField
            fullWidth
            label="Motivo (opcional)"
            value={noMatchReason}
            onChange={(e)=>setNoMatchReason(e.target.value)}
            sx={{ mt:2 }}
          />
          <Box sx={{ textAlign:'right', mt:2 }}>
            <Button variant="contained" onClick={handleNoMatchSave}>
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>

      <Box sx={{ marginTop:'30px' }}>
        <Typography variant="h6"><strong>Historial de Ciclos</strong></Typography>
        {(()=>{
          const startIndexCycles = (cyclesCurrentPage - 1) * cyclesPerPage;
          const endIndexCycles = startIndexCycles + cyclesPerPage;
          const paginatedCycles = cycleHistory.slice(startIndexCycles, endIndexCycles);

          return (
            <>
              {paginatedCycles.map(ch=>{
                let winnerPairCycle='';
                if (ch.result==='Victoria') {
                  winnerPairCycle = ch.firstPair;
                } else if (ch.result==='Derrota') {
                  winnerPairCycle = ch.secondPair;
                }

                const dayOfWeek = nextMatchDate ? nextMatchDate.day() : null;
                let nextMatchHour = '';
                if (dayOfWeek===1) nextMatchHour='20:00';
                else if (dayOfWeek===4) nextMatchHour='19:30';

                return (
                  <Box key={ch.cycleNumber} sx={{ mt:2 }}>
                    <Typography variant="subtitle1">
                      {ch.cycleNumber}º ciclo
                      {' ('}
                      {dayjs(ch.startDate).format('DD/MM/YYYY')}
                      {' - '}
                      {ch.endDate ? dayjs(ch.endDate).format('DD/MM/YYYY') : 'En curso'}
                      {')'}
                    </Typography>
                    <Divider sx={{my:1}}/>
                    {ch.matches.map((m,i)=>(
                      <Typography variant="body2" key={m.id}>
                        <strong>{dayjs(m.date,'YYYY-MM-DD').format('DD/MM/YYYY')}</strong>: {m.pair1.player1} y {m.pair1.player2} vs {m.pair2.player1} y {m.pair2.player2} (Ganador: <strong>{m.winner}</strong>)
                      </Typography>
                    ))}
                    {ch.noMatches.map((nm)=>(
                      <Typography variant="body2" key={'nm-'+nm.id}>
                        <strong>{dayjs(nm.date,'YYYY-MM-DD').format('DD/MM/YYYY')}</strong>: Día sin partido{nm.reason?' (motivo: '+nm.reason+')':''}
                      </Typography>
                    ))}
                    {ch.result && (
                      <Typography variant="body2" sx={{ fontWeight:'bold', mt:1 }}>
                        Resultado del ciclo: Ganador: <strong>{winnerPairCycle}</strong>
                      </Typography>
                    )}
                    {(!ch.endDate || dayjs(ch.endDate).isAfter(dayjs())) && currentCycle && ch.cycleNumber===currentCycleNumber && nextMatchDate && (
                      <Box sx={{ mt:1 }}>
                        <Typography variant="body2" sx={{ fontWeight:'bold' }}>Próximo partido:</Typography>
                        <Typography variant="body2">
                          {nextMatchPairs}
                        </Typography>
                        <Typography variant="body2">
                          Fecha: {nextMatchDate.format('DD/MM/YYYY')}
                        </Typography>
                        {nextMatchHour && (
                          <Typography variant="body2">
                            Hora: {nextMatchHour}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          Lugar: Passing Padel
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
              {cycleHistory.length > cyclesPerPage && (
                <Pagination
                  count={Math.ceil(cycleHistory.length / cyclesPerPage)}
                  page={cyclesCurrentPage}
                  onChange={(e, value) => setCyclesCurrentPage(value)}
                  sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
                />
              )}
            </>
          );
        })()}
      </Box>

      <Box sx={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '30px',
            padding: '10px 20px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#333',
            },
          }}
          onClick={() => navigate('/')}
        >
          Volver a la pantalla principal
        </Button>
      </Box>
    </Container>
  );
};

export default MatchInfo;