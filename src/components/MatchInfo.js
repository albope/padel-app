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
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

const availablePlayers = ['Lucas', 'Bort', 'Martin', 'Ricardo'];

const cyclesPerPage = 3;

const getPairIdentifier = (pairString) => {
  // pairString formato "Jugador1 & Jugador2"
  const players = pairString.split('&').map(p => p.trim()).sort();
  return players.join(' & ');
};

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

  const [viewYear, setViewYear] = useState(2024);
  const [viewMonth, setViewMonth] = useState(11);

  const [pair1Player1, setPair1Player1] = useState('');
  const [pair1Player2, setPair1Player2] = useState('');
  const [pair2Player1, setPair2Player1] = useState('');
  const [pair2Player2, setPair2Player2] = useState('');

  const [cyclesCurrentPage, setCyclesCurrentPage] = useState(1);

  // Modal para determinar ganador manualmente
  const [manualWinnerModalOpen, setManualWinnerModalOpen] = useState(false);
  const [manualWinnerPair, setManualWinnerPair] = useState('');
  const [manualWinnerCycle, setManualWinnerCycle] = useState(null);
  const [manualFirstPair, setManualFirstPair] = useState('');
  const [manualSecondPair, setManualSecondPair] = useState('');

  const recalculateCycleForResults = (loadedCycles, loadedResults) => {
    for (const r of loadedResults) {
      r.cycleId = null;
      const resultDate = dayjs(r.date);
      for (const c of loadedCycles) {
        const start = dayjs(c.startDate);
        const end = c.endDate ? dayjs(c.endDate) : null;
        if (end) {
          if ((resultDate.isSame(start, 'day') || resultDate.isAfter(start)) &&
            (resultDate.isBefore(end, 'day') || resultDate.isSame(end, 'day'))) {
            r.cycleId = c.id;
            break;
          }
        } else {
          if (resultDate.isSame(start, 'day') || resultDate.isAfter(start)) {
            r.cycleId = c.id;
            break;
          }
        }
      }
    }
  };

  // *** FUNCIÓN CORREGIDA ***
  const handleCycleAutoClose = async (cycle, cycleMatches) => {
    if (!cycle || cycle.endDate) return;

    // Condición 1: Se han jugado dos partidos con el mismo ganador
    if (cycleMatches.length >= 2) {
      const firstMatch = cycleMatches[0];
      const secondMatch = cycleMatches[1];

      if (firstMatch && secondMatch && firstMatch.winner && secondMatch.winner) {
        if (firstMatch.winner === secondMatch.winner) {
          const secondMatchDate = dayjs(secondMatch.date);
          const cycleRef = doc(db, 'cycles', cycle.id);
          await updateDoc(cycleRef, {
            endDate: secondMatchDate.format('YYYY-MM-DD')
          });
          return; // Cerramos el ciclo si cumplen esta condición y salimos
        }
      }
    }

    // Condición 2: Se han jugado tres partidos en total, independientemente de quién haya ganado
    if (cycleMatches.length >= 3) {
      const thirdMatch = cycleMatches[2];
      if (thirdMatch && thirdMatch.winner) {
        const thirdMatchDate = dayjs(thirdMatch.date);
        const cycleRef = doc(db, 'cycles', cycle.id);
        await updateDoc(cycleRef, {
          endDate: thirdMatchDate.format('YYYY-MM-DD')
        });
      }
    }
  };

  const recalculateMatchNumbers = async (loadedCycles, loadedResults) => {
    for (const c of loadedCycles) {
      const cycleMatches = loadedResults.filter(m => m.cycleId === c.id && m.winner && m.loser)
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      cycleMatches.forEach((m, i) => {
        m.matchNumberInCycle = i + 1;
      });

      await handleCycleAutoClose(c, cycleMatches);
    }
  };

  const updateNextMatch = (current, loadedCycles, loadedResults, loadedNoMatch) => {
    const cycleResults = loadedResults.filter(m => m.cycleId === current.id && m.winner && m.loser)
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    let lastMatchDate = null;
    cycleResults.forEach(m => {
      const d = dayjs(m.date, 'YYYY-MM-DD');
      if (!lastMatchDate || d.isAfter(lastMatchDate)) {
        lastMatchDate = d;
      }
    });

    let firstPair = '', secondPair = '';
    let fWins = 0, sWins = 0;
    if (current.currentPairs) {
      const cp = current.currentPairs.replace(/\sy\s/gi, ' & ');
      const pairs = cp.split('vs').map(p => p.trim());
      firstPair = getPairIdentifier(pairs[0]);
      secondPair = getPairIdentifier(pairs[1]);

      fWins = cycleResults.filter(m => m.winner === firstPair).length;
      sWins = cycleResults.filter(m => m.winner === secondPair).length;
    }

    // Si ya hay 2 partidos
    if (cycleResults.length === 2) {
      if (fWins === 2 || sWins === 2) {
        setNextMatchDate(null);
        setPreviousNoMatchMessage('El ciclo ha finalizado después de dos partidos.');
        return;
      }
    }

    let nextDate = current.startDate ? dayjs(current.startDate) : dayjs();
    if (lastMatchDate) {
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
      const lastNoMatch = recentNoMatch.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))[0];
      const reasonText = lastNoMatch.reason ? ` (motivo: ${lastNoMatch.reason})` : '';
      setPreviousNoMatchMessage(`El partido del ${dayjs(lastNoMatch.date).format('DD/MM')} no se jugó${reasonText}. Próximo partido: ${nextDate.format('DD/MM/YYYY')}`);
    } else {
      setPreviousNoMatchMessage('');
    }
  };

  const calculateCycleProgress = (current, loadedResults) => {
    if (!current) return 0;
    const cycleMatches = loadedResults.filter(m => m.cycleId === current.id && m.winner && m.loser);
    return cycleMatches.length;
  };

  const loadData = async () => {
    const cyclesSnap = await getDocs(collection(db, 'cycles'));
    const loadedCycles = [];
    cyclesSnap.forEach(docu => {
      loadedCycles.push({ id: docu.id, ...docu.data() });
    });
    loadedCycles.sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));

    // Normalizar currentPairs
    for (const c of loadedCycles) {
      if (c.currentPairs) {
        c.currentPairs = c.currentPairs.replace(/\sy\s/gi, ' & ');
      }
    }

    setCycles(loadedCycles);

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
      let pair1SetsWon = 0;
      let pair2SetsWon = 0;
      if (r.sets && r.sets.length > 0) {
        r.sets.forEach(s => {
          const p1Score = parseInt(s.pair1Score, 10);
          const p2Score = parseInt(s.pair2Score, 10);
          if (p1Score > p2Score) pair1SetsWon++;
          else if (p2Score > p1Score) pair2SetsWon++;
        });
      }

      const p1Name = getPairIdentifier(`${r.pair1.player1} & ${r.pair1.player2}`);
      const p2Name = getPairIdentifier(`${r.pair2.player1} & ${r.pair2.player2}`);

      let winner = '', loser = '';
      if (pair1SetsWon > pair2SetsWon) {
        winner = p1Name; loser = p2Name;
      } else if (pair2SetsWon > pair1SetsWon) {
        winner = p2Name; loser = p1Name;
      }

      loadedResults.push({
        id: docu.id,
        ...r,
        winner,
        loser
      });
    });

    await recalculateCycleForResults(loadedCycles, loadedResults);
    await recalculateMatchNumbers(loadedCycles, loadedResults);

    setResults(loadedResults);

    if (current) {
      updateNextMatch(current, loadedCycles, loadedResults, loadedNoMatch);
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

  const getSetsString = (sets) => {
    if (!sets) return '';
    return sets.map(s => `${s.pair1Score}-${s.pair2Score}`).join(', ');
  };

  const getMatchTooltip = (match) => {
    const setsDetail = getSetsString(match.sets);
    const matchOrdinalText = match.matchNumberInCycle ? `${match.matchNumberInCycle}º partido del ciclo` : '';
    return `${match.winner} ganaron contra ${match.loser} (${setsDetail}) en ${match.location}. ${matchOrdinalText}.`;
  };

  const renderTooltipContent = (ds, d) => (
    <Box>
      <Typography variant="body2">{ds.tooltip}</Typography>
      <Button
        variant="text"
        sx={{ mt: 1, textTransform:'none' }}
        onClick={() => {
          setSelectedDay(d);
          setModalOpen(true);
        }}
      >
        Marcar día sin partido
      </Button>
    </Box>
  );

  const getDayStyle = (d) => {
    const nm = noMatchDays.find(n => dayjs(n.date, 'YYYY-MM-DD').isSame(d, 'day'));
    if (nm) {
      return { type: 'noMatch', tooltip: `Día sin partido${nm.reason ? ' (motivo: ' + nm.reason + ')' : ''}` };
    }

    const dayResult = results.filter(m => m.date === d.format('YYYY-MM-DD') && m.winner && m.loser);
    if (dayResult && dayResult.length > 0) {
      const match = dayResult[0];
      const tooltip = getMatchTooltip(match);
      return { type: 'played', winner: match.winner, loser: match.loser, tooltip };
    }

    const dow = d.day();
    if (dow === 1 || dow === 4) {
      return { type: 'scheduled', tooltip: 'Partido programado' };
    }

    return { type: 'empty', tooltip: 'Sin evento' };
  };

  const getInitials = (pairName) => {
    const names = pairName.split('&').map(s => s.trim());
    return names.map(n => n.charAt(0)).join('&');
  };

  const renderDayCell = (d) => {
    const ds = getDayStyle(d);
    const dayNumber = d.month() === viewMonth ? d.date() : '';
    let cellContent = null;
    let cellSx = { cursor: 'pointer', width: '40px', height: '40px', position: 'relative', p: 0 };

    if (!dayNumber) {
      return <TableCell key={d.format()} sx={{ backgroundColor: 'white' }}></TableCell>;
    }

    switch (ds.type) {
      case 'noMatch':
        cellSx.backgroundColor = 'grey';
        break;
      case 'played':
        cellSx.background = 'linear-gradient(to bottom, green 50%, red 50%)';
        const wInit = getInitials(ds.winner);
        const lInit = getInitials(ds.loser);
        cellContent = (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
              {wInit}
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
              {lInit}
            </Box>
          </Box>
        );
        break;
      case 'scheduled':
        cellSx.backgroundColor = 'lightblue';
        break;
      case 'empty':
        cellSx.backgroundColor = 'white';
        break;
      default:
        cellSx.backgroundColor = 'white';
    }

    return (
      <Tooltip
        key={d.format()}
        title={renderTooltipContent(ds, d)}
        enterTouchDelay={50}
        leaveTouchDelay={3000}
      >
        <TableCell align="center" sx={cellSx}>
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
    const cycleMatches = results.filter(m => m.cycleId === currentCycle.id && m.winner && m.loser);
    if (cycleMatches.length === 3 || (currentCycle.endDate && cycleMatches.length >= 1)) {
      showPairSelection = true;
    }
  }

  const handleSaveNextCycle = async () => {
    if (!pair1Player1 || !pair1Player2 || !pair2Player1 || !pair2Player2) return;
    const chosen = [pair1Player1, pair1Player2, pair2Player1, pair2Player2];
    const uniqueChosen = new Set(chosen);
    if (uniqueChosen.size < 4) {
      alert('Debes elegir 4 jugadores diferentes.');
      return;
    }

    const pairsText = `${pair1Player1} & ${pair1Player2} vs ${pair2Player1} & ${pair2Player2}`;
    let startDate = dayjs();
    if (cycles.length > 0) {
      const lastC = cycles[cycles.length - 1];
      const refDate = lastC.endDate ? dayjs(lastC.endDate) : dayjs();
      let found = false;
      let checkDate = refDate;
      for (let i = 0; i < 60; i++) {
        checkDate = checkDate.add(1, 'day');
        const dow = checkDate.day();
        if (dow === 1 || dow === 4) {
          startDate = checkDate;
          found = true;
          break;
        }
      }
      if (!found) startDate = refDate.add(1, 'day');
    } else {
      let d = dayjs();
      let found = false;
      for (let i = 0; i < 60; i++) {
        const dow = d.day();
        if (dow === 1 || dow === 4) {
          startDate = d;
          found = true;
          break;
        }
        d = d.add(1, 'day');
      }
      if (!found) startDate = dayjs().add(1, 'day');
    }

    await addDoc(collection(db, 'cycles'), {
      startDate: startDate.format('YYYY-MM-DD'),
      currentPairs: pairsText
    });
    alert('Nuevo ciclo configurado con éxito.');
    setPair1Player1(''); setPair1Player2(''); setPair2Player1(''); setPair2Player2('');
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
    const played = calculateCycleProgress(currentCycle, results);
    cycleProgress = (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Progreso del ciclo: {played} de 3 partidos jugados</Typography>
        <LinearProgress variant="determinate" value={(played / 3) * 100} />
      </Box>
    );
  }

  const closedCycles = cycles.filter(c => c.endDate);
  let lastClosedCycle = null;
  let lastClosedCycleWinner = '';
  if (closedCycles.length > 0) {
    lastClosedCycle = closedCycles[closedCycles.length - 1];
    const closedResults = results.filter(m => m.cycleId === lastClosedCycle.id && m.winner && m.loser);

    if (lastClosedCycle.currentPairs) {
      const cp = lastClosedCycle.currentPairs;
      const pairs = cp.split('vs').map(p => p.trim());
      const fPair = getPairIdentifier(pairs[0]);
      const sPair = getPairIdentifier(pairs[1]);

      const fWins = closedResults.filter(m => m.winner === fPair).length;
      const sWins = closedResults.filter(m => m.winner === sPair).length;

      if (fWins >= 2) {
        lastClosedCycleWinner = fPair;
      } else if (sWins >= 2) {
        lastClosedCycleWinner = sPair;
      } else if (fWins === 1 && sWins === 0) {
        lastClosedCycleWinner = fPair;
      } else if (sWins === 1 && fWins === 0) {
        lastClosedCycleWinner = sPair;
      } else if (closedResults.length === 0) {
        lastClosedCycleWinner = 'Sin partidos jugados';
      } else {
        lastClosedCycleWinner = 'Datos no concluyentes';
      }
    } else {
      lastClosedCycleWinner = 'Datos no concluyentes';
    }
  }

  const cycleHistory = cycles.map((c, i) => {
    const cResults = results.filter(m => m.cycleId === c.id && m.winner && m.loser).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    const cNoMatches = noMatchDays.filter(n => {
      const start = dayjs(c.startDate);
      const end = c.endDate ? dayjs(c.endDate) : null;
      const nmDate = dayjs(n.date, 'YYYY-MM-DD');
      if (end) {
        return (nmDate.isAfter(start) || nmDate.isSame(start, 'day')) && (nmDate.isBefore(end, 'day') || nmDate.isSame(end, 'day'));
      } else {
        return nmDate.isAfter(start) || nmDate.isSame(start, 'day');
      }
    });

    let cycleState = 'En curso';
    let winnerPairCycle = '';

    const cp = c.currentPairs ? c.currentPairs : '';
    const pairs = cp ? cp.split('vs').map(p => p.trim()) : [];
    const fPair = pairs[0] ? getPairIdentifier(pairs[0]) : '';
    const sPair = pairs[1] ? getPairIdentifier(pairs[1]) : '';

    const fWins = cResults.filter(m => m.winner === fPair).length;
    const sWins = cResults.filter(m => m.winner === sPair).length;

    if (c.endDate) {
      cycleState = 'Cerrado';
      if (cp) {
        if (fWins >= 2) {
          winnerPairCycle = fPair;
        } else if (sWins >= 2) {
          winnerPairCycle = sPair;
        } else if (fWins === 1 && sWins === 0) {
          winnerPairCycle = fPair;
        } else if (sWins === 1 && fWins === 0) {
          winnerPairCycle = sPair;
        } else if (cResults.length === 0) {
          winnerPairCycle = 'Sin partidos jugados';
        } else {
          winnerPairCycle = 'Datos no concluyentes';
        }
      } else {
        winnerPairCycle = 'Datos no concluyentes';
      }
    } else {
      // en curso
      if (cResults.length === 0) {
        winnerPairCycle = 'Sin partidos jugados';
      }
    }

    return {
      cycleNumber: i + 1,
      startDate: c.startDate,
      endDate: c.endDate,
      matches: cResults,
      noMatches: cNoMatches,
      currentPairs: cp,
      firstPair: fPair,
      secondPair: sPair,
      winnerPairCycle,
      cycleState
    };
  });

  const sortedCycles = [...cycleHistory].sort((a, b) => {
    if (a.cycleState === 'En curso' && b.cycleState !== 'En curso') return -1;
    if (b.cycleState === 'En curso' && a.cycleState !== 'En curso') return 1;
    return dayjs(b.startDate).diff(dayjs(a.startDate));
  });

  const startIndex = (cyclesCurrentPage - 1) * cyclesPerPage;
  const paginatedCycles = sortedCycles.slice(startIndex, startIndex + cyclesPerPage);

  const dayOfWeek = nextMatchDate ? nextMatchDate.day() : null;
  let matchHour = '';
  if (dayOfWeek === 1) matchHour = '20:00';
  else if (dayOfWeek === 4) matchHour = '19:30';

  // Función para guardar ganador manual
  const handleManualWinnerSave = async () => {
    if (!manualWinnerCycle || !manualWinnerPair) {
      alert('Debes seleccionar un ganador.');
      return;
    }

    // Actualizar el ciclo en Firebase: Si no tiene endDate, poner endDate hoy
    const cycleRef = doc(db, 'cycles', manualWinnerCycle.id);
    const endDate = manualWinnerCycle.endDate ? manualWinnerCycle.endDate : dayjs().format('YYYY-MM-DD');
    await updateDoc(cycleRef, {
      endDate
      // El currentPairs se mantiene igual, ya que no cambia.
    });

    // Luego recargar datos
    setManualWinnerModalOpen(false);
    setManualWinnerPair('');
    setManualWinnerCycle(null);
    setManualFirstPair('');
    setManualSecondPair('');
    loadData();
  };

  return (
    <Container>
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center', marginTop: '20px' }}>
        <Typography variant="h5">Información de las Partidas</Typography>
      </Box>

      {/* Sección de información de las partidas recurrentes */}
      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold' }}>
          Partida del Lunes
        </Typography>
        <Typography variant="body1">Fecha: Lunes, <strong>20:00 - 21:30</strong></Typography>
        <Typography variant="body1">Lugar: <strong>Passing Padel</strong></Typography>
        <Typography variant="body1">Teléfono: <strong>722 18 91 91</strong></Typography>
        <iframe
          src="https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="300"
          style={{ border: 0, marginTop: '10px' }}
          allowFullScreen=""
          loading="lazy"
          title="Mapa Passing Padel"
        ></iframe>
        <Box sx={{ textAlign: 'center', marginTop: '10px' }}>
          <Button
            component="a"
            href={calendarLinkMonday}
            target="_blank"
            startIcon={<NotificationsActiveIcon />}
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

        <Typography variant="h6" sx={{ color: 'black', fontWeight: 'bold', marginTop: '20px' }}>
          Partida del Jueves
        </Typography>
        <Typography variant="body1">Fecha: Jueves, <strong>19:30 - 21:00</strong></Typography>
        <Typography variant="body1">Lugar: <strong>Passing Padel</strong></Typography>
        <Typography variant="body1">Teléfono: <strong>722 18 91 91</strong></Typography>
        <iframe
          src="https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="300"
          style={{ border: 0, marginTop: '10px' }}
          allowFullScreen=""
          loading="lazy"
          title="Mapa Passing Padel"
        ></iframe>
        <Box sx={{ textAlign: 'center', marginTop: '10px' }}>
          <Button
            component="a"
            href={calendarLinkThursday}
            target="_blank"
            startIcon={<NotificationsActiveIcon />}
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

      {/* Título "Ciclos de Partidas" */}
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          marginTop: '30px',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}
      >
        Ciclos de Partidas
      </Typography>

      {previousNoMatchMessage && (
        <Typography variant="body1" sx={{ color: 'red', mt: 3 }}>{previousNoMatchMessage}</Typography>
      )}
      {nextMatchDate && currentCycle && !currentCycle.endDate && (
        <Box sx={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <Typography variant="h6"><strong>Próximo Partido</strong></Typography>
          <Typography variant="body1">Fecha: <strong>{nextMatchDate.format('DD/MM/YYYY')}</strong></Typography>
          {matchHour && (
            <Typography variant="body1">Hora: <strong>{matchHour}</strong></Typography>
          )}
          <Typography variant="body1">Lugar: <strong>Passing Padel</strong></Typography>
          <Typography variant="body1">Parejas: <strong>{nextMatchPairs}</strong></Typography>
          <Typography variant="body1">{nextMatchInfo}</Typography>
          {currentCycle && (
            <Typography variant="body1" sx={{ mt: 1 }}>
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

      {/* Último ciclo cerrado y su ganador */}
      {!currentCycle && lastClosedCycle && lastClosedCycleWinner && lastClosedCycleWinner !== 'Sin partidos jugados' && lastClosedCycleWinner !== 'Datos no concluyentes' && (
        <Box sx={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <Typography variant="body1">
            Último ciclo cerrado: Ganador - <strong>{lastClosedCycleWinner}</strong>
          </Typography>
        </Box>
      )}

      {showPairSelection && (
        <Box sx={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <Typography variant="h6">Configurar Próximo Ciclo</Typography>
          <Typography variant="body2">Selecciona 4 jugadores diferentes para las parejas del próximo ciclo.</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 1 - Jugador 1</InputLabel>
                <Select value={pair1Player1} onChange={(e) => setPair1Player1(e.target.value)}>
                  {availablePlayers.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 1 - Jugador 2</InputLabel>
                <Select value={pair1Player2} onChange={(e) => setPair1Player2(e.target.value)}>
                  {availablePlayers.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 2 - Jugador 1</InputLabel>
                <Select value={pair2Player1} onChange={(e) => setPair2Player1(e.target.value)}>
                  {availablePlayers.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pareja 2 - Jugador 2</InputLabel>
                <Select value={pair2Player2} onChange={(e) => setPair2Player2(e.target.value)}>
                  {availablePlayers.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ textAlign:'right', mt:2 }}>
            <Button variant="contained" onClick={handleSaveNextCycle}>Guardar</Button>
          </Box>
        </Box>
      )}

      <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ mt: 4 }}>
        <Grid item xs={4} sm={3} md={2}>
          <Button variant="outlined" fullWidth onClick={handlePrevMonth}>Mes Anterior</Button>
        </Grid>
        <Grid item xs={4} sm={6} md={4} sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {dayjs().year(viewYear).month(viewMonth).format('MMMM YYYY')}
          </Typography>
        </Grid>
        <Grid item xs={4} sm={3} md={2}>
          <Button variant="outlined" fullWidth onClick={handleNextMonth}>Mes Siguiente</Button>
        </Grid>
      </Grid>

      <Box sx={{ marginTop: '20px' }}>
        <Typography variant="h6"><strong>Calendario</strong></Typography>
        <Typography variant="body2">Toca un día para mostrar opciones. Luego pulsa "Marcar día sin partido" en el tooltip.</Typography>
        <Box sx={{ marginTop: '10px', overflowX: 'auto' }}>
          <Paper>
            <TableBody>
              <TableRow>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <TableCell key={d} align="center"><strong>{d}</strong></TableCell>
                ))}
              </TableRow>
              {(() => {
                const startOfMonth = dayjs().year(viewYear).month(viewMonth).startOf('month');
                const endOfMonth = dayjs().year(viewYear).month(viewMonth).endOf('month');
                const weeks = [];
                let startDay = startOfMonth;
                while (startDay.day() !== 1) {
                  startDay = startDay.subtract(1, 'day');
                }
                let currentDay = startDay.clone();
                while (currentDay.isBefore(endOfMonth) || currentDay.isSame(endOfMonth, 'day')) {
                  const weekDays = [];
                  for (let i = 0; i < 7; i++) {
                    weekDays.push(currentDay);
                    currentDay = currentDay.add(1, 'day');
                  }
                  weeks.push(weekDays);
                }

                return weeks.map((week, wIndex) => (
                  <TableRow key={wIndex}>
                    {week.map(day => renderDayCell(day))}
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Paper>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1"><strong>Leyenda:</strong></Typography>
        <Typography variant="body2">- Mitad superior verde y mitad inferior roja: Partido jugado (superior=ganador, inferior=perdedor, iniciales)</Typography>
        <Typography variant="body2">- Gris: Día sin partido</Typography>
        <Typography variant="body2">- Azul claro: Partido programado (lunes/jueves sin resultado)</Typography>
        <Typography variant="body2">- Blanco: Sin evento</Typography>
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={styleModal}>
          <IconButton
            sx={{ position: 'absolute', top: 5, right: 5, color: 'red' }}
            onClick={() => setModalOpen(false)}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6">Marcar como día sin partido</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {selectedDay ? `Día: ${selectedDay.format('DD/MM/YYYY')}` : ''}
          </Typography>
          <TextField
            fullWidth
            label="Motivo (opcional)"
            value={noMatchReason}
            onChange={(e) => setNoMatchReason(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box sx={{ textAlign:'right', mt:2 }}>
            <Button variant="contained" onClick={handleNoMatchSave}>
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>

      <Box sx={{ marginTop: '30px' }}>
        <Typography variant="h6"><strong>Historial de Ciclos</strong></Typography>
        {(() => {
          const startIndex = (cyclesCurrentPage - 1) * cyclesPerPage;
          const paginatedCycles = sortedCycles.slice(startIndex, startIndex + cyclesPerPage);

          const dayOfWeek = nextMatchDate ? nextMatchDate.day() : null;
          let nextMatchHour = '';
          if (dayOfWeek === 1) nextMatchHour = '20:00';
          else if (dayOfWeek === 4) nextMatchHour = '19:30';

          return (
            <>
              {paginatedCycles.map(ch => {
                const lastMatch = ch.matches.length > 0 ? ch.matches[ch.matches.length - 1] : null;
                const datosNoConcluyentes = (ch.winnerPairCycle === 'Datos no concluyentes');

                return (
                  <Box
                    key={ch.cycleNumber}
                    sx={{
                      padding: '10px',
                      border: ch.cycleState === 'En curso' ? '2px solid #2196f3' : '1px solid #ccc',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      marginBottom: '10px'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color:'red' }}>
                      {ch.cycleNumber}º ciclo ({dayjs(ch.startDate).format('DD/MM/YYYY')} - {ch.endDate ? dayjs(ch.endDate).format('DD/MM/YYYY') : 'En curso'})
                      {ch.cycleState === 'En curso' && (
                        <span style={{ color: '#1976d2', marginLeft: '8px' }}>Ciclo actual</span>
                      )}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {ch.matches.map((m, i) => (
                      <Typography variant="body2" key={m.id}>
                        <strong>{dayjs(m.date, 'YYYY-MM-DD').format('DD/MM/YYYY')}</strong>: {m.pair1.player1} & {m.pair1.player2} vs {m.pair2.player1} & {m.pair2.player2} (Ganador: <strong>{m.winner}</strong>)
                      </Typography>
                    ))}
                    {ch.noMatches.map((nm) => (
                      <Typography variant="body2" key={'nm-' + nm.id}>
                        <strong>{dayjs(nm.date, 'YYYY-MM-DD').format('DD/MM/YYYY')}</strong>: Día sin partido{nm.reason ? ' (motivo: ' + nm.reason + ')' : ''}
                      </Typography>
                    ))}
                    {ch.cycleState === 'Cerrado' && (
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                        Ciclo Cerrado: Ganador: <strong>{ch.winnerPairCycle}</strong>
                      </Typography>
                    )}
                    {ch.cycleState === 'En curso' && !ch.endDate && ch.matches.length === 0 && (
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                        En curso: Sin partidos jugados
                      </Typography>
                    )}
                    {ch.cycleState === 'En curso' && !ch.endDate && ch.matches.length > 0 && (
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                        En curso
                      </Typography>
                    )}

                    {/* Mostrar botón para determinar ganador manualmente SOLO si ciclo cerrado y datos no concluyentes */}
                    {ch.cycleState === 'Cerrado' && ch.winnerPairCycle === 'Datos no concluyentes' && (
                      <Box sx={{ marginTop: '10px', textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>¿No se puede determinar el ganador?</Typography>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setManualWinnerCycle(manualWinnerCycle.id);
                            setManualFirstPair(ch.firstPair);
                            setManualSecondPair(ch.secondPair);
                            setManualWinnerModalOpen(true);
                          }}
                          sx={{
                            textTransform: 'none',
                            mt:1,
                            borderColor:'#2196f3',
                            color:'#2196f3'
                          }}
                        >
                          Determinar ganador manualmente
                        </Button>
                      </Box>
                    )}

                    {(!ch.endDate || dayjs(ch.endDate).isAfter(dayjs())) && currentCycle && ch.cycleNumber === currentCycleNumber && nextMatchDate && (
                      <Box sx={{ mt: 1 }}>
                        {lastMatch && (
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Último resultado del ciclo: {lastMatch.winner} ganaron contra {lastMatch.loser} el {dayjs(lastMatch.date, 'YYYY-MM-DD').format('DD/MM/YYYY')}
                          </Typography>
                        )}
                        {nextMatchDate && !ch.endDate && (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Próximo partido:</Typography>
                            <Typography variant="body2">
                              {nextMatchPairs}
                            </Typography>
                            <Typography variant="body2">
                              Fecha: <strong>{nextMatchDate.format('DD/MM/YYYY')}</strong>
                            </Typography>
                            {nextMatchHour && (
                              <Typography variant="body2">
                                Hora: <strong>{nextMatchHour}</strong>
                              </Typography>
                            )}
                            <Typography variant="body2">
                              Lugar: <strong>Passing Padel</strong>
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
              {sortedCycles.length > cyclesPerPage && (
                <Pagination
                  count={Math.ceil(sortedCycles.length / cyclesPerPage)}
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

      <Modal open={manualWinnerModalOpen} onClose={() => setManualWinnerModalOpen(false)}>
        <Box sx={styleModal}>
          <IconButton
            sx={{ position: 'absolute', top: 5, right: 5, color: 'red' }}
            onClick={() => setManualWinnerModalOpen(false)}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6">Seleccionar Ganador del Ciclo</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Elige la pareja ganadora:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Pareja Ganadora</InputLabel>
            <Select
              value={manualWinnerPair}
              onChange={(e) => setManualWinnerPair(e.target.value)}
              label="Pareja Ganadora"
            >
              <MenuItem value={manualFirstPair}>{manualFirstPair}</MenuItem>
              <MenuItem value={manualSecondPair}>{manualSecondPair}</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ textAlign:'right', mt:2 }}>
            <Button variant="contained" onClick={handleManualWinnerSave}>
              Guardar
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default MatchInfo;