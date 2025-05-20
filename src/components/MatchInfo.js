// MatchInfo.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Typography, Box, Button, IconButton, Tooltip, Modal,
  TextField, Paper, Grid, Divider, TableBody, TableRow, TableCell,
  Pagination, Select, MenuItem, FormControl, InputLabel, LinearProgress,
  CircularProgress, Alert
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import advancedFormat from 'dayjs/plugin/advancedFormat';


// Importa los servicios de Firebase
import * as firebaseService from '../services/firebaseService';

dayjs.locale('es');
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(advancedFormat);

// --- Constantes ---
const AVAILABLE_PLAYERS = ['Lucas', 'Bort', 'Martin', 'Ricardo'];
const CYCLES_PER_PAGE = 3;
const PADEL_LOCATION = "Passing Padel";
const PADEL_PHONE = "722 18 91 91";
const MAP_IFRAME_SRC = "https://maps.google.com/maps?q=Passing%20Padel&t=&z=13&ie=UTF8&iwloc=&output=embed";

const MODAL_STYLE = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  p: 4,
  width: { xs: '90%', sm: 400 },
  borderRadius: '8px',
  boxShadow: 24,
};

// --- Funciones de Utilidad ---
const getPairIdentifier = (pairString) => {
  if (!pairString || typeof pairString !== 'string') return '';
  const players = pairString.split(/\s*(?:&|vs|y)\s*/i).map(p => p.trim()).filter(Boolean).sort();
  return players.join(' & ');
};

const getInitialNewCyclePairStates = () => ({
  pair1Player1: '', pair1Player2: '',
  pair2Player1: '', pair2Player2: '',
});


const MatchInfo = () => {
  const navigate = useNavigate();

  // --- Estados ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userMessage, setUserMessage] = useState({ type: '', text: '' });
  const [cycles, setCycles] = useState([]);
  const [noMatchDays, setNoMatchDays] = useState([]);
  const [results, setResults] = useState([]);
  const [viewDate, setViewDate] = useState(dayjs());
  const [currentCycle, setCurrentCycle] = useState(null);
  const [currentCycleNumber, setCurrentCycleNumber] = useState(0);
  const [nextMatchDetails, setNextMatchDetails] = useState({
    date: null, pairsText: '', infoText: '', previousNoMatchMessage: '', hour: '',
  });
  const [noMatchModal, setNoMatchModal] = useState({ open: false, selectedDay: null, reason: '' });
  const [manualWinnerModal, setManualWinnerModal] = useState({
    open: false, cycle: null, winnerPair: '', firstPair: '', secondPair: ''
  });
  const [newCyclePairs, setNewCyclePairs] = useState(getInitialNewCyclePairStates());
  const [cyclesCurrentPage, setCyclesCurrentPage] = useState(1);

  // --- Lógica de Carga y Procesamiento de Datos ---
  const processFetchedData = useCallback((fetchedCycles, fetchedNoMatchDays, fetchedResults) => {
    const sortedCycles = [...fetchedCycles].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)))
      .map(c => ({
        ...c,
        currentPairs: c.currentPairs ? c.currentPairs.replace(/\sy\s/gi, ' & ') : '',
      }));

    let processedResults = fetchedResults.map(r => {
      let p1Sets = 0, p2Sets = 0;
      if (r.sets?.length) {
        r.sets.forEach(s => {
          const score1 = parseInt(s.pair1Score, 10);
          const score2 = parseInt(s.pair2Score, 10);
          if (score1 > score2) p1Sets++;
          else if (score2 > score1) p2Sets++;
        });
      }
      const p1Name = getPairIdentifier(`${r.pair1?.player1 || ''} & ${r.pair1?.player2 || ''}`);
      const p2Name = getPairIdentifier(`${r.pair2?.player1 || ''} & ${r.pair2?.player2 || ''}`);
      let winner = '', loser = '';
      if (p1Sets > p2Sets) { winner = p1Name; loser = p2Name; }
      else if (p2Sets > p1Sets) { winner = p2Name; loser = p1Name; }

      let cycleIdForResult = null;
      const resultDate = dayjs(r.date);
      for (const cycle of sortedCycles) {
        const start = dayjs(cycle.startDate);
        const end = cycle.endDate ? dayjs(cycle.endDate) : null;
        if ((resultDate.isSame(start, 'day') || resultDate.isAfter(start)) &&
          (!end || resultDate.isBefore(end, 'day') || resultDate.isSame(end, 'day'))) {
          cycleIdForResult = cycle.id;
          break;
        }
      }
      return { ...r, winner, loser, cycleId: cycleIdForResult };
    });

    sortedCycles.forEach(c => {
      const cycleMatches = processedResults
        .filter(m => m.cycleId === c.id && m.winner && m.loser)
        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
      cycleMatches.forEach((m, i) => { m.matchNumberInCycle = i + 1; });
    });

    return { finalCycles: sortedCycles, finalResults: processedResults, finalNoMatchDays: fetchedNoMatchDays };
  }, []);

  const determineCurrentCycleAndNextMatch = useCallback((processedCycles) => {
    const now = dayjs();
    let activeCycle = null;
    let activeCycleNum = 0;
    for (let i = 0; i < processedCycles.length; i++) {
      const c = processedCycles[i];
      if (!c.endDate || dayjs(c.endDate).isAfter(now)) {
        activeCycle = c;
        activeCycleNum = i + 1;
        break;
      }
    }
    setCurrentCycle(activeCycle);
    setCurrentCycleNumber(activeCycleNum);
  }, []);

  const loadAllData = useCallback(async (calledByUserAction = false) => {
    if (!calledByUserAction) setIsLoading(true);
    setError(null);
    if (calledByUserAction) setUserMessage({ type: '', text: '' });

    try {
      const { cycles: fetchedCycles, noMatchDays: fetchedNoMatch, results: fetchedResults } = await firebaseService.getAllMatchData();
      let { finalCycles, finalResults, finalNoMatchDays } = processFetchedData(fetchedCycles, fetchedNoMatch, fetchedResults);
      let cyclesWereUpdated = false;

      for (const cycle of finalCycles) {
        if (cycle.endDate) continue;
        const cycleMatchesChronological = finalResults
          .filter(m => m.cycleId === cycle.id && m.winner && m.loser)
          .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

        if (cycleMatchesChronological.length >= 2) {
          const firstPairName = cycle.currentPairs ? getPairIdentifier(cycle.currentPairs.split("vs")[0]) : null;
          const secondPairName = cycle.currentPairs ? getPairIdentifier(cycle.currentPairs.split("vs")[1]) : null;
          if (firstPairName && secondPairName) {
            const firstPairWins = cycleMatchesChronological.filter(m => m.winner === firstPairName).length;
            const secondPairWins = cycleMatchesChronological.filter(m => m.winner === secondPairName).length;
            if (firstPairWins >= 2 || secondPairWins >= 2) {
              const winningMatches = firstPairWins >= 2 ?
                cycleMatchesChronological.filter(m => m.winner === firstPairName) :
                cycleMatchesChronological.filter(m => m.winner === secondPairName);
              if (winningMatches.length >= 2) {
                const closingMatchDate = dayjs(winningMatches[1].date).format('YYYY-MM-DD');
                if (cycle.endDate !== closingMatchDate) {
                  await firebaseService.updateCycle(cycle.id, { endDate: closingMatchDate });
                  cycle.endDate = closingMatchDate;
                  cyclesWereUpdated = true;
                }
                continue;
              }
            }
          }
        }
        if (!cycle.endDate && cycleMatchesChronological.length >= 3) {
          const thirdMatch = cycleMatchesChronological[2];
          if (thirdMatch?.winner) {
            const closingMatchDate = dayjs(thirdMatch.date).format('YYYY-MM-DD');
            if (cycle.endDate !== closingMatchDate) {
              await firebaseService.updateCycle(cycle.id, { endDate: closingMatchDate });
              cycle.endDate = closingMatchDate;
              cyclesWereUpdated = true;
            }
          }
        }
      }

      setCycles(cyclesWereUpdated ? [...finalCycles] : finalCycles);
      setResults(finalResults);
      setNoMatchDays(finalNoMatchDays);

    } catch (err) {
      console.error("Error loading data:", err);
      setError("Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.");
    } finally {
      if (!calledByUserAction) setIsLoading(false);
    }
  }, [processFetchedData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (!isLoading) {
      determineCurrentCycleAndNextMatch(cycles, results, noMatchDays);
    }
  }, [cycles, results, noMatchDays, isLoading, determineCurrentCycleAndNextMatch]);

  const updateNextMatchDisplayLogic = useCallback((activeCycle, allCycles, allResultsData, allNoMatchData) => {
    if (!activeCycle) return;

    if (activeCycle.endDate && dayjs(activeCycle.endDate).isBefore(dayjs())) {
      setNextMatchDetails(prev => ({
        ...prev, date: null,
        infoText: `${currentCycleNumber}º ciclo (Finalizado el ${dayjs(activeCycle.endDate).format('DD/MM/YYYY')})`,
        previousNoMatchMessage: 'El ciclo ha finalizado.', hour: ''
      }));
      return;
    }

    const cycleResultsData = allResultsData
      .filter(m => m.cycleId === activeCycle.id && m.winner && m.loser)
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    let fWins = 0, sWins = 0;
    if (activeCycle.currentPairs) {
      const pairs = activeCycle.currentPairs.split('vs').map(p => getPairIdentifier(p.trim()));
      if (pairs.length === 2) {
        fWins = cycleResultsData.filter(m => m.winner === pairs[0]).length;
        sWins = cycleResultsData.filter(m => m.winner === pairs[1]).length;
      }
    }
    if (((fWins >= 2 || sWins >= 2) && cycleResultsData.length >= 2) || cycleResultsData.length >= 3) {
      const message = cycleResultsData.length >= 3 ? 'El ciclo actual ha finalizado (3 partidos).' : 'El ciclo actual ha finalizado (2 victorias).';
      setNextMatchDetails(prev => ({ ...prev, date: null, previousNoMatchMessage: message, hour: '', infoText: prev.infoText }));
      return;
    }

    let lastMatchDateInCycle = cycleResultsData.length > 0 ? dayjs(cycleResultsData[cycleResultsData.length - 1].date) : null;

    let searchStartDate = dayjs(activeCycle.startDate);
    if (lastMatchDateInCycle) {
      searchStartDate = lastMatchDateInCycle.add(1, 'day');
    }
    if (searchStartDate.isBefore(dayjs(), 'day')) {
      searchStartDate = dayjs();
    }

    let referenceDateForLoop = searchStartDate.clone().subtract(1, 'day');

    let validDateFound = null;
    for (let i = 0; i < 90; i++) {
      referenceDateForLoop = referenceDateForLoop.add(1, 'day');
      const dow = referenceDateForLoop.day();
      if (dow === 1 || dow === 4) {
        const isNoMatch = allNoMatchData.some(n => dayjs(n.date, 'YYYY-MM-DD').isSame(referenceDateForLoop, 'day'));
        if (!isNoMatch) {
          validDateFound = referenceDateForLoop;
          break;
        }
      }
    }

    if (!validDateFound) {
      setNextMatchDetails(prev => ({ ...prev, date: null, pairsText: activeCycle.currentPairs || "Parejas por definir", previousNoMatchMessage: 'No se encontró próximo partido para el ciclo actual en los próximos 3 meses.', hour: '', infoText: `Ciclo ${currentCycleNumber}º en curso.` }));
      return;
    }

    let msg = '';
    for (let i = 1; i <= 3; i++) {
      const checkDate = validDateFound.subtract(i, 'day');
      const prevNoMatchDay = allNoMatchData.find(n => dayjs(n.date).isSame(checkDate, 'day'));
      if (prevNoMatchDay) {
        msg = `Hubo un día sin partido el ${dayjs(prevNoMatchDay.date).format('DD/MM')}${prevNoMatchDay.reason ? ' (' + prevNoMatchDay.reason + ')' : ''}. `;
        break;
      }
    }

    setNextMatchDetails(prev => ({
      ...prev,
      date: validDateFound,
      pairsText: activeCycle.currentPairs || "Parejas por definir",
      previousNoMatchMessage: msg,
      hour: validDateFound.day() === 1 ? '20:00' : '19:30',
      infoText: `Ciclo ${currentCycleNumber}º en curso. (${allCycles.length} ciclos en total)`
    }));

  }, [currentCycleNumber]);

  useEffect(() => {
    if (currentCycle && !isLoading) {
      updateNextMatchDisplayLogic(currentCycle, cycles, results, noMatchDays);
    } else if (!currentCycle && !isLoading) {
      const baseInfoText = cycles.length > 0 ? 'Todos los ciclos han finalizado.' : 'No hay ciclos registrados.';
      const basePrevMsg = cycles.length > 0 ? 'Puede configurar un nuevo ciclo.' : 'Configure el primer ciclo.';
      setNextMatchDetails({ date: null, pairsText: '', infoText: baseInfoText, previousNoMatchMessage: basePrevMsg, hour: '' });
    }
  }, [currentCycle, cycles, results, noMatchDays, isLoading, updateNextMatchDisplayLogic]);

  // --- Manejadores de Eventos ---
  const handleModalClose = (modalSetter) => {
    modalSetter(prev => ({ ...prev, open: false, selectedDay: null, reason: '', cycle: null, winnerPair: '' }));
  };

  const handleNoMatchSave = async () => {
    if (!noMatchModal.selectedDay) return;
    const dateStr = noMatchModal.selectedDay.format('YYYY-MM-DD');
    setIsLoading(true);
    try {
      await firebaseService.addNoMatchDay({ date: dateStr, reason: noMatchModal.reason || '', noMatch: true });
      setUserMessage({ type: 'success', text: 'Día sin partido guardado.' });
      handleModalClose(setNoMatchModal);
      await loadAllData(true);
    } catch (err) {
      console.error("Error saving no match day:", err);
      setUserMessage({ type: 'error', text: 'Error al guardar día sin partido.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoMatchDelete = async (dayToDelete) => {
    const found = noMatchDays.find(n => dayjs(n.date, 'YYYY-MM-DD').isSame(dayToDelete, 'day'));
    if (found?.id) {
      setIsLoading(true);
      try {
        await firebaseService.deleteNoMatchDay(found.id);
        setUserMessage({ type: 'success', text: 'Día sin partido eliminado.' });
        await loadAllData(true);
      } catch (err) {
        console.error("Error deleting no match day:", err);
        setUserMessage({ type: 'error', text: 'Error al eliminar día sin partido.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveNextCycle = async () => {
    const { pair1Player1, pair1Player2, pair2Player1, pair2Player2 } = newCyclePairs;
    if (!pair1Player1 || !pair1Player2 || !pair2Player1 || !pair2Player2) {
      setUserMessage({ type: 'error', text: 'Todos los jugadores deben ser seleccionados.' });
      return;
    }
    const chosen = [pair1Player1, pair1Player2, pair2Player1, pair2Player2];
    if (new Set(chosen).size < 4) {
      setUserMessage({ type: 'error', text: 'Debes elegir 4 jugadores diferentes.' });
      return;
    }

    const pairsText = `${pair1Player1} & ${pair1Player2} vs ${pair2Player1} & ${pair2Player2}`;
    let newCycleStartDate = dayjs();
    if (cycles.length > 0) {
      const lastCycle = cycles[cycles.length - 1];
      newCycleStartDate = lastCycle.endDate ? dayjs(lastCycle.endDate).add(1, 'day') : dayjs().add(1, 'day');
    }

    while (newCycleStartDate.day() !== 1 && newCycleStartDate.day() !== 4) {
      newCycleStartDate = newCycleStartDate.add(1, 'day');
    }

    setIsLoading(true);
    try {
      await firebaseService.addCycle({ startDate: newCycleStartDate.format('YYYY-MM-DD'), currentPairs: pairsText, endDate: null });
      setUserMessage({ type: 'success', text: 'Nuevo ciclo configurado con éxito.' });
      setNewCyclePairs(getInitialNewCyclePairStates());
      await loadAllData(true);
    } catch (err) {
      console.error("Error saving new cycle:", err);
      setUserMessage({ type: 'error', text: 'Error al configurar nuevo ciclo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelCurrentCycle = async () => {
    if (!currentCycle?.id) {
      setUserMessage({ type: 'error', text: 'No hay un ciclo activo para anular.' });
      return;
    }
    if (!window.confirm(`¿Estás seguro de ANULAR el ciclo "${currentCycle.currentPairs}" y TODOS sus partidos? Esta acción no se puede deshacer.`)) return;

    setIsLoading(true);
    try {
      const associatedResults = results.filter(r => r.cycleId === currentCycle.id);
      for (const result of associatedResults) {
        if (result.id) await firebaseService.deleteResult(result.id);
      }
      await firebaseService.deleteCycle(currentCycle.id);
      setUserMessage({ type: 'success', text: 'Ciclo anulado exitosamente.' });
      await loadAllData(true);
    } catch (err) {
      console.error("Error cancelling cycle:", err);
      setUserMessage({ type: 'error', text: 'Error al anular el ciclo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualWinnerSave = async () => {
    if (!manualWinnerModal.cycle?.id || !manualWinnerModal.winnerPair) {
      setUserMessage({ type: 'error', text: 'Debes seleccionar un ciclo y una pareja ganadora.' });
      return;
    }
    setIsLoading(true);
    try {
      const endDateToSet = manualWinnerModal.cycle.endDate || dayjs().format('YYYY-MM-DD');
      await firebaseService.updateCycle(manualWinnerModal.cycle.id, {
        endDate: endDateToSet,
      });
      setUserMessage({ type: 'success', text: `Ganador manual guardado y ciclo cerrado/actualizado.` });
      handleModalClose(setManualWinnerModal);
      await loadAllData(true);
    } catch (err) {
      console.error("Error saving manual winner:", err);
      setUserMessage({ type: 'error', text: 'Error al guardar ganador manual.' });
    } finally {
      setIsLoading(false);
    }
  };


  // --- Valores Memoizados para UI ---
  const calendarLinks = useMemo(() => {
    const createLink = (textSuffix, dayOfWeekISO, timeStart, timeEnd) => {
      try {
        let date = dayjs();
        const targetIsoDay = parseInt(dayOfWeekISO, 10);

        if (isNaN(targetIsoDay) || targetIsoDay < 1 || targetIsoDay > 7) {
          console.error("calendarLinks: Invalid dayOfWeekISO:", dayOfWeekISO, ". Must be 1-7.");
          return "#error-invalid-day";
        }

        let attempts = 0;
        // Day.js isoWeekday(): 1 (Lunes) a 7 (Domingo)
        while (date.isoWeekday() !== targetIsoDay && attempts < 14) {
          date = date.add(1, 'day');
          attempts++;
        }

        if (attempts >= 14) { // Seguridad por si algo va mal en el bucle
          console.error("calendarLinks: Could not find target day for", textSuffix, "from", dayjs().format(), "targetISO", targetIsoDay);
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

    try {
      const mondayLink = createLink('Lunes', 1, '200000', '213000'); // ISO 1 = Lunes
      const thursdayLink = createLink('Jueves', 4, '193000', '210000'); // ISO 4 = Jueves

      if (typeof mondayLink !== 'string' || typeof thursdayLink !== 'string' || mondayLink.startsWith("#error") || thursdayLink.startsWith("#error")) {
        console.error("calendarLinks: Fallback due to link creation issue.", { mondayLink, thursdayLink });
        return { monday: "#fallbackLink", thursday: "#fallbackLink" };
      }
      return {
        monday: mondayLink,
        thursday: thursdayLink,
      };
    } catch (e) {
      console.error("calendarLinks: General error in useMemo:", e);
      return {
        monday: "#generalErrorLinkM",
        thursday: "#generalErrorLinkTh"
      };
    }
  }, []); // PADEL_LOCATION es constante global, no necesita ser dependencia

  const cycleProgressDisplay = useMemo(() => {
    if (!currentCycle || currentCycle.endDate) return { played: 0, percentage: 0, text: "Ciclo no activo o finalizado." };
    const cycleMatches = results.filter(m => m.cycleId === currentCycle.id && m.winner && m.loser);
    const played = cycleMatches.length;
    let targetGames = 3;
    if (played >= 2 && currentCycle.currentPairs) {
      const pairs = currentCycle.currentPairs.split('vs').map(p => getPairIdentifier(p.trim()));
      if (pairs.length === 2) {
        const winsP1 = cycleMatches.filter(m => m.winner === pairs[0]).length;
        const winsP2 = cycleMatches.filter(m => m.winner === pairs[1]).length;
        if (winsP1 >= 2 || winsP2 >= 2) targetGames = played;
      }
    }
    const percentage = targetGames > 0 ? (played / Math.min(targetGames, 3)) * 100 : 0;
    return {
      played, percentage,
      text: `Progreso: ${played} de ${Math.min(targetGames, 3)} ${played === 1 ? 'partido' : 'partidos'}`
    };
  }, [currentCycle, results]);

  const lastClosedCycleInfo = useMemo(() => {
    const closed = cycles.filter(c => c.endDate && dayjs(c.endDate).isBefore(dayjs()));
    if (!closed.length) return null;

    const lastOne = closed.sort((a, b) => dayjs(b.endDate).diff(dayjs(a.endDate)))[0];
    const closedResults = results.filter(m => m.cycleId === lastOne.id && m.winner && m.loser);

    if (!lastOne.currentPairs) return { ...lastOne, winnerDisplay: 'Parejas no disponibles' };
    const pairs = lastOne.currentPairs.split('vs').map(p => getPairIdentifier(p.trim()));
    if (pairs.length < 2) return { ...lastOne, winnerDisplay: 'Parejas mal configuradas' };

    const fWins = closedResults.filter(m => m.winner === pairs[0]).length;
    const sWins = closedResults.filter(m => m.winner === pairs[1]).length;
    let winner = 'Datos no concluyentes';

    if (fWins >= 2) {
      winner = pairs[0];
    } else if (sWins >= 2) {
      winner = pairs[1];
    } else if (closedResults.length >= 3) {
      if (fWins > sWins) winner = pairs[0];
      else if (sWins > fWins) winner = pairs[1];
      // Si hay empate en victorias con 3 partidos, sigue siendo 'Datos no concluyentes'
    } else if (closedResults.length > 0) { // Menos de 3 partidos, pero el ciclo está cerrado
      if (fWins > sWins && fWins > 0) winner = pairs[0]; // Ganó el que tiene más, si es > 0
      else if (sWins > fWins && sWins > 0) winner = pairs[1];
      // Si fWins === sWins (ej. 0-0 o 1-1), sigue 'Datos no concluyentes'
    }
    // Esta condición debe ir después de las comprobaciones de victorias
    if (closedResults.length === 0) { // Si después de todo, no hubo partidos
      winner = 'Sin partidos jugados';
    }

    return { ...lastOne, winnerDisplay: winner };
  }, [cycles, results]);

  const cycleHistoryDisplay = useMemo(() => {
    return cycles
      .map((c, i) => {
        const cResults = results.filter(m => m.cycleId === c.id && m.winner && m.loser)
          .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
        const cNoMatches = noMatchDays.filter(n => {
          const start = dayjs(c.startDate); const end = c.endDate ? dayjs(c.endDate) : null;
          const nmDate = dayjs(n.date);
          return nmDate.isBetween(start, end || dayjs().add(100, 'years'), 'day', '[]');
        }).sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));

        let state = 'En curso'; let winner = 'Aún no determinado';
        const pairs = c.currentPairs ? c.currentPairs.split('vs').map(p => getPairIdentifier(p.trim())) : [];
        const fPairName = pairs[0] || ''; const sPairName = pairs[1] || '';

        if (c.endDate && dayjs(c.endDate).isBefore(dayjs())) {
          state = 'Cerrado';
          const fWins = cResults.filter(m => m.winner === fPairName).length;
          const sWins = cResults.filter(m => m.winner === sPairName).length;
          if (fWins >= 2) winner = fPairName;
          else if (sWins >= 2) winner = sPairName;
          else if (cResults.length >= 3) {
            if (fWins > sWins) winner = fPairName; else if (sWins > fWins) winner = sPairName;
            else winner = 'Datos no concluyentes';
          } else if (cResults.length > 0) {
            if (fWins > sWins) winner = fPairName; else if (sWins > fWins) winner = sPairName;
            else winner = 'Datos no concluyentes';
          }
          else if (cResults.length === 0) winner = 'Sin partidos jugados';
          // else winner = 'Datos no concluyentes'; // Ya es el valor por defecto
        } else if (c.endDate) {
          state = 'Programado para finalizar';
        }

        return {
          ...c,
          cycleNumberDisplay: i + 1,
          matchesPlayed: cResults,
          noMatchDaysInCycle: cNoMatches,
          firstPairName: fPairName,
          secondPairName: sPairName,
          calculatedWinner: winner,
          statusText: state,
        };
      })
      .sort((a, b) => {
        if (a.statusText === 'En curso' && b.statusText !== 'En curso') return -1;
        if (b.statusText === 'En curso' && a.statusText !== 'En curso') return 1;
        return dayjs(b.startDate).diff(dayjs(a.startDate));
      });
  }, [cycles, results, noMatchDays]);

  const paginatedCycleHistory = useMemo(() => {
    const startIndex = (cyclesCurrentPage - 1) * CYCLES_PER_PAGE;
    return cycleHistoryDisplay.slice(startIndex, startIndex + CYCLES_PER_PAGE);
  }, [cycleHistoryDisplay, cyclesCurrentPage]);

  const showNewCycleConfig = useMemo(() => {
    if (!currentCycle) return true;
    if (currentCycle.endDate && dayjs(currentCycle.endDate).isBefore(dayjs())) return true;

    const cycleMatches = results.filter(m => m.cycleId === currentCycle.id && m.winner && m.loser);
    if (cycleMatches.length >= 3) return true;

    if (currentCycle.currentPairs && cycleMatches.length >= 2) {
      const pairs = currentCycle.currentPairs.split('vs').map(p => getPairIdentifier(p.trim()));
      if (pairs.length === 2) {
        const fWins = cycleMatches.filter(m => m.winner === pairs[0]).length;
        const sWins = cycleMatches.filter(m => m.winner === pairs[1]).length;
        if (fWins >= 2 || sWins >= 2) return true;
      }
    }
    return false;
  }, [currentCycle, results]);

  const getPairInitials = useCallback((pairName) => {
    if (!pairName) return '';
    return pairName.split('&').map(s => s.trim().charAt(0).toUpperCase()).join('&');
  }, []);

  const generalNextPlayableDay = useMemo(() => {
    let lastPlayedDateOverall = null;
    if (results && results.length > 0) {
      const sortedResultsByDate = [...results]
        .filter(r => r.date)
        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
      if (sortedResultsByDate.length > 0) {
        lastPlayedDateOverall = dayjs(sortedResultsByDate[0].date);
      }
    }

    let searchStartDate = dayjs();
    if (lastPlayedDateOverall && lastPlayedDateOverall.isSameOrAfter(searchStartDate, 'day')) {
      searchStartDate = lastPlayedDateOverall.add(1, 'day');
    }

    let dateIterator = searchStartDate.clone().subtract(1, 'day');

    for (let i = 0; i < 90; i++) {
      dateIterator = dateIterator.add(1, 'day');
      const dow = dateIterator.day();
      if (dow === 1 || dow === 4) {
        const isNoMatch = noMatchDays.some(nmd => dayjs(nmd.date).isSame(dateIterator, 'day'));
        if (!isNoMatch) {
          return dateIterator;
        }
      }
    }
    return null;
  }, [results, noMatchDays]);

  const getCalendarDayInfo = useCallback((dayToStyle) => {
    if (!dayToStyle || typeof dayToStyle.isSame !== 'function') {
      console.error("getCalendarDayInfo recibió un dayToStyle inválido:", dayToStyle);
      return { type: 'empty', tooltip: 'Error de fecha', style: { backgroundColor: 'red', color: 'white' } };
    }

    const isNextMatchOfCycle = nextMatchDetails.date && dayToStyle.isSame(nextMatchDetails.date, 'day');
    const isGeneralNextPlayable = !isNextMatchOfCycle && generalNextPlayableDay && dayToStyle.isSame(generalNextPlayableDay, 'day');

    if (isNextMatchOfCycle) {
      return {
        type: 'nextMatchCycle',
        tooltip: `Próximo partido del ciclo: ${nextMatchDetails.pairsText || 'Parejas por definir'}`,
        style: { backgroundColor: 'primary.main', fontWeight: 'bold', border: '2px solid #1068b8', color: 'white' }
      };
    }
    if (isGeneralNextPlayable) {
      return {
        type: 'generalNextPlayable',
        tooltip: `Próximo Lunes/Jueves disponible`,
        style: { backgroundColor: 'info.light', fontWeight: 'normal', border: '2px solid #64b5f6', color: 'black' }
      };
    }

    const noMatch = noMatchDays.find(nmd => dayjs(nmd.date, 'YYYY-MM-DD').isSame(dayToStyle, 'day'));
    if (noMatch) return {
      type: 'noMatch', tooltip: `Día sin partido${noMatch.reason ? ` (${noMatch.reason})` : ''}`,
      style: { backgroundColor: 'grey.400', color: 'common.white', border: '1px solid #ccc' },
    };

    const dayRes = results.find(r => dayjs(r.date, 'YYYY-MM-DD').isSame(dayToStyle, 'day') && r.winner);
    if (dayRes) {
      const sets = dayRes.sets?.map(s => `${s.pair1Score}-${s.pair2Score}`).join(', ') || 'N/A';
      return {
        type: 'played', winner: dayRes.winner, loser: dayRes.loser,
        tooltip: `${dayRes.winner} ganaron a ${dayRes.loser} (${sets}). ${dayRes.matchNumberInCycle || ''}º partido.`,
        style: { background: 'linear-gradient(to bottom, green 50%, red 50%)', color: 'white', border: '1px solid #ccc' },
      };
    }

    const dow = dayToStyle.day();
    if ((dow === 1 || dow === 4) && dayToStyle.isSameOrAfter(dayjs(), 'day')) {
      return { type: 'scheduledRegular', tooltip: 'Día de partido (L/J)', style: { backgroundColor: '#e3f2fd', border: '1px solid #ccc' } };
    }

    return { type: 'empty', tooltip: 'Sin evento', style: { backgroundColor: 'background.paper', border: '1px solid #eee' } };
  }, [noMatchDays, results, nextMatchDetails.date, nextMatchDetails.pairsText, generalNextPlayableDay]);


  // --- Renderizado ---
  if (isLoading && !cycles.length && !results.length && !noMatchDays.length) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress size={60} /><Typography sx={{ ml: 2 }}>Cargando datos...</Typography></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <Paper elevation={3} sx={{ backgroundColor: 'black', color: 'white', p: 2, textAlign: 'center', my: 2 }}>
        <Typography variant="h5" component="h1">Información de Partidas de Pádel</Typography>
      </Paper>

      {isLoading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1301 }} />}
      {error && <Alert severity="error" sx={{ my: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {userMessage.text && <Alert severity={userMessage.type || 'info'} sx={{ my: 2 }} onClose={() => setUserMessage({ type: '', text: '' })}>{userMessage.text}</Alert>}

      <Grid container spacing={3} sx={{ my: 2 }}>
        {[
          { day: "Lunes", time: "20:00 - 21:30", calendarLink: calendarLinks.monday, title: "Partida del Lunes" },
          { day: "Jueves", time: "19:30 - 21:00", calendarLink: calendarLinks.thursday, title: "Partida del Jueves" }
        ].map(info => (
          <Grid item xs={12} md={6} key={info.day}>
            <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{info.title}</Typography>
              <Typography>Día: {info.day}, <strong>{info.time}</strong></Typography>
              <Typography>Lugar: <strong>{PADEL_LOCATION}</strong> (Tel: {PADEL_PHONE})</Typography>
              <Box sx={{ flexGrow: 1, mt: 1, mb: 1 }}>
                <iframe
                  src={MAP_IFRAME_SRC}
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '4px', minHeight: '180px' }}
                  allowFullScreen
                  loading="lazy"
                  title={`Mapa ${PADEL_LOCATION} ${info.day}`}>
                </iframe>
              </Box>
              <Box sx={{ textAlign: 'center', mt: 'auto' }}>
                <Button component="a" href={info.calendarLink} target="_blank" rel="noopener noreferrer" startIcon={<NotificationsActiveIcon />} variant="outlined" size="small">
                  Añadir a Google Calendar
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Typography variant="h4" component="h2" sx={{ textAlign: 'center', my: 3, fontWeight: 'bold' }}>Ciclos de Partidas</Typography>

      {nextMatchDetails.previousNoMatchMessage && (
        <Alert severity="info" sx={{ my: 2 }}>{nextMatchDetails.previousNoMatchMessage}</Alert>
      )}

      {currentCycle && !currentCycle.endDate && nextMatchDetails.date && (
        <Paper elevation={2} sx={{ my: 2, p: 2, borderLeft: '5px solid', borderColor: 'secondary.main' }}>
          <Typography variant="h6" component="h3">
            <strong>Próximo Partido del Ciclo Actual ({currentCycleNumber}º Ciclo)</strong>
          </Typography>
          <Typography>Parejas del ciclo: <strong>{currentCycle.currentPairs}</strong></Typography>
          <Typography>Fecha: <strong>{nextMatchDetails.date.format('dddd, DD [de] MMMM [de] YYYY')}</strong></Typography> {/* CORREGIDO: YYYY para año completo */}
          {nextMatchDetails.hour && <Typography>Hora: <strong>{nextMatchDetails.hour}</strong></Typography>}
          <Typography>Lugar: <strong>{PADEL_LOCATION}</strong></Typography>
          <Typography>Parejas para el partido: <strong>{nextMatchDetails.pairsText}</strong></Typography>
          {cycleProgressDisplay && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">{cycleProgressDisplay.text}</Typography>
              <LinearProgress variant="determinate" value={cycleProgressDisplay.percentage} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button variant="contained" color="error" size="small" onClick={handleCancelCurrentCycle}>
              Anular Ciclo Actual
            </Button>
          </Box>
        </Paper>
      )}

      {(!currentCycle || (currentCycle?.endDate && dayjs(currentCycle.endDate).isBefore(dayjs()))) && (
        <Paper elevation={1} sx={{ my: 2, p: 2, backgroundColor: 'grey.100', textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {lastClosedCycleInfo ? `Último ciclo (${lastClosedCycleInfo.currentPairs || 'N/A'}) finalizado el ${dayjs(lastClosedCycleInfo.endDate).format('DD/MM/YY')}.` : (cycles.length > 0 ? "Todos los ciclos han finalizado." : "No hay ciclos activos.")}
          </Typography>
          {lastClosedCycleInfo && <Typography>Ganador: <strong>{lastClosedCycleInfo.winnerDisplay || 'No determinado'}</strong></Typography>}
          <Typography sx={{ mt: 1 }}>Puede configurar el próximo ciclo más abajo.</Typography>
        </Paper>
      )}

      {showNewCycleConfig && (<Paper elevation={2} sx={{ my: 3, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>Configurar Próximo Ciclo</Typography>
        <Grid container spacing={2}>
          {Object.keys(newCyclePairs).map((key, index) => (
            <Grid item xs={12} sm={6} key={key}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>{`P${Math.floor(index / 2) + 1} - J${index % 2 + 1}`}</InputLabel>
                <Select name={key} value={newCyclePairs[key]} label={`P${Math.floor(index / 2) + 1} - J${index % 2 + 1}`}
                  onChange={(e) => setNewCyclePairs(prev => ({ ...prev, [e.target.name]: e.target.value }))}>
                  <MenuItem value=""><em>-- Seleccionar --</em></MenuItem>
                  {AVAILABLE_PLAYERS.map(p => (
                    <MenuItem key={p} value={p} disabled={Object.values(newCyclePairs).includes(p) && newCyclePairs[key] !== p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ textAlign: 'right', mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSaveNextCycle}>Guardar Nuevo Ciclo</Button>
        </Box>
      </Paper>)}

      <Divider sx={{ my: 3 }} />
      <Paper elevation={1} sx={{ my: 3, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>Calendario</Typography>
        <Grid container spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
          <Grid item><Button variant="outlined" onClick={() => setViewDate(prev => prev.subtract(1, 'month'))} size="small">Mes Ant.</Button></Grid>
          <Grid item xs sx={{ textAlign: 'center' }}><Typography variant="h6">{viewDate.format('MMMM YYYY')}</Typography></Grid> {/* CORREGIDO: YYYY */}
          <Grid item><Button variant="outlined" onClick={() => setViewDate(prev => prev.add(1, 'month'))} size="small">Mes Sig.</Button></Grid>
        </Grid>
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <th key={d} style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>{d}</th>)}</tr>
            </thead>
            <tbody>
              {(() => {
                const monthStart = viewDate.startOf('month');
                const calendarStart = monthStart.startOf('isoWeek');
                const weeksArray = [];
                let currentDayIter = calendarStart.clone();
                for (let w = 0; w < 6; w++) {
                  const weekDays = [];
                  for (let d = 0; d < 7; d++) {
                    weekDays.push(currentDayIter.clone());
                    currentDayIter = currentDayIter.add(1, 'day');
                  }
                  weeksArray.push(weekDays);
                }
                return weeksArray.map((week, wIdx) => (
                  <TableRow key={`week-${wIdx}`}>
                    {week.map((day, dayIdx) => {
                      if (!day || typeof day.isSame !== 'function') {
                        console.error("Calendario: 'day' es inválido.", { day, wIdx, dayIdx });
                        return <TableCell key={`error-day-${wIdx}-${dayIdx}`}>Error Día</TableCell>;
                      }

                      const dayInfo = getCalendarDayInfo(day);
                      if (!dayInfo || typeof dayInfo.type === 'undefined') {
                        console.error("Calendario: 'dayInfo' es inválido.", { dayInfo, forDay: day.format("YYYY-MM-DD") });
                        return <TableCell key={`error-info-${wIdx}-${dayIdx}`}>Error Info</TableCell>;
                      }

                      const isCurrentMonth = day.isSame(viewDate, 'month');
                      const isToday = day.isSame(dayjs(), 'day');

                      return (
                        <Tooltip
                          key={day.format('YYYYMMDD')}
                          placement="top"
                          arrow
                          title={
                            <Box sx={{ p: 1 }}>
                              <Typography variant="caption" display="block">{day.format('dddd, D MMM')}</Typography>
                              <Typography variant="body2">{dayInfo.tooltip}</Typography>
                              {isCurrentMonth &&
                                (dayInfo.type === 'scheduledRegular' ||
                                  dayInfo.type === 'generalNextPlayable' ||
                                  dayInfo.type === 'nextMatchCycle' ||
                                  (dayInfo.type === 'empty' && (day.day() === 1 || day.day() === 4))) &&
                                <Button size="small" sx={{ textTransform: 'none', mt: 0.5, color: 'white', display: 'block' }} onClick={() => { setNoMatchModal({ open: true, selectedDay: day, reason: '' }) }}>Marcar sin partido</Button>
                              }
                              {dayInfo.type === 'noMatch' &&
                                <Button size="small" sx={{ textTransform: 'none', mt: 0.5, color: 'yellow', display: 'block' }} onClick={() => handleNoMatchDelete(day)}>Desmarcar</Button>
                              }
                            </Box>
                          }
                        >
                          <TableCell
                            align="center"
                            sx={{
                              ...dayInfo.style,
                              height: { xs: 50, sm: 60 },
                              p: 0,
                              opacity: isCurrentMonth ? 1 : 0.35, // Ligeramente más opaco para días fuera del mes
                              cursor: 'pointer',
                              '&:hover': { boxShadow: 3, transform: 'scale(1.05)' },
                              transition: 'transform 0.1s ease-in-out',
                              position: 'relative' // Asegurar que TableCell es el contexto de posicionamiento
                            }}
                          >
                            {/* CAMBIOS APLICADOS AL SIGUIENTE TYPOGRAPHY */}
                            <Typography
                              variant={isCurrentMonth && isToday ? "subtitle2" : "caption"}
                              sx={{
                                position: 'absolute', top: 2, right: 4,
                                fontWeight: isToday ? 'bold' : 'normal',
                                color: isToday
                                  ? 'primary.contrastText'
                                  : isCurrentMonth
                                    ? (dayInfo.style.backgroundColor && (dayInfo.style.backgroundColor === 'primary.main' || dayInfo.style.backgroundColor === 'info.light' || dayInfo.style.backgroundColor === 'grey.400') ? 'white' : 'text.primary')
                                    : 'text.disabled',
                                backgroundColor: isToday ? 'primary.dark' : 'transparent',
                                borderRadius: isToday ? '50%' : '0',
                                padding: isToday ? '1px 5px' : '0',
                                lineHeight: 1.2,
                                zIndex: 1, // Para asegurar que esté por encima del color de fondo de la celda
                                // Mostrar el número solo si es del mes actual y no es un día con contenido de resultado (played)
                                // o un día 'noMatch' donde el color de fondo es suficiente.
                                // Si es hoy, siempre se muestra.
                                visibility: isCurrentMonth && (dayInfo.type === 'played' || dayInfo.type === 'noMatch') && !isToday ? 'hidden' : 'visible',
                              }}
                            >
                              {isCurrentMonth ? day.date() : ''}
                            </Typography>
                            {/* FIN DE CAMBIOS AL TYPOGRAPHY */}
                            {dayInfo.type === 'played' && isCurrentMonth && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', zIndex: 0 }}> {/* Asegurar que esto esté detrás del número si es necesario */}
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.1 }}>{getPairInitials(dayInfo.winner)}</Typography>
                                <Divider sx={{ width: '50%', bgcolor: 'rgba(255,255,255,0.3)', my: 0.1 }} />
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.1 }}>{getPairInitials(dayInfo.loser)}</Typography>
                              </Box>
                            )}
                          </TableCell>
                        </Tooltip>
                      );
                    })}
                  </TableRow>
                ));
              })()}
            </tbody>
          </table>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1.5 }, justifyContent: 'center', fontSize: '0.75rem' }}>
          {[
            { label: 'Jugado (G/P)', style: { background: 'linear-gradient(to bottom, green 50%, red 50%)', color: 'white' } },
            { label: 'Próx. Partido Ciclo', style: { backgroundColor: 'primary.main', color: 'white' } },
            { label: 'Próx. L/J General', style: { backgroundColor: 'info.light', color: 'black' } },
            { label: 'Día Partido (L/J)', style: { backgroundColor: '#e3f2fd' } },
            { label: 'Sin Partido', style: { backgroundColor: 'grey.400', color: 'white' } }
          ].map(item => <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', m: 0.2, p: '2px 4px' }}><Box sx={{ width: 12, height: 12, mr: 0.5, ...item.style, borderRadius: '2px' }} />{item.label}</Box>)}
        </Box>
      </Paper>

      <Modal open={noMatchModal.open} onClose={() => handleModalClose(setNoMatchModal)}>
        <Paper sx={MODAL_STYLE}>
          <IconButton onClick={() => handleModalClose(setNoMatchModal)} sx={{ position: 'absolute', top: 8, right: 8 }}><CloseIcon /></IconButton>
          <Typography variant="h6">Marcar Día Sin Partido</Typography>
          <Typography sx={{ mt: 1 }}>Día: {noMatchModal.selectedDay?.format('dddd, DD/MM/YYYY')}</Typography>
          <TextField fullWidth label="Motivo (opcional)" value={noMatchModal.reason} onChange={e => setNoMatchModal(p => ({ ...p, reason: e.target.value }))} margin="normal" multiline rows={2} />
          <Box sx={{ textAlign: 'right', mt: 2 }}><Button onClick={() => handleModalClose(setNoMatchModal)} sx={{ mr: 1 }}>Cancelar</Button><Button variant="contained" onClick={handleNoMatchSave}>Guardar</Button></Box>
        </Paper>
      </Modal>

      <Divider sx={{ my: 3 }} />
      <Paper elevation={1} sx={{ my: 3, p: 2 }}>
        <Typography variant="h6" component="h3" gutterBottom>Historial de Ciclos</Typography>
        {!paginatedCycleHistory.length && cycles.length > 0 && <Typography sx={{ textAlign: 'center', my: 2 }}>No hay más ciclos en esta página.</Typography>}
        {!cycles.length && <Typography sx={{ textAlign: 'center', my: 2 }}>Aún no hay ciclos registrados.</Typography>}
        {paginatedCycleHistory.map(ch => (
          <Paper key={ch.id} elevation={2} sx={{ p: 1.5, mb: 1.5, borderLeft: `5px solid ${ch.statusText === 'En curso' ? 'secondary.main' : (ch.statusText === 'Cerrado' ? 'success.main' : 'grey.500')}` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {ch.cycleNumberDisplay}º Ciclo ({dayjs(ch.startDate).format('DD/MM/YY')} - {ch.endDate ? dayjs(ch.endDate).format('DD/MM/YY') : 'En curso'})
              {ch.statusText === 'En curso' && <Typography component="span" variant="caption" color="secondary.dark" sx={{ ml: 1, fontWeight: 'bold' }}>(ACTUAL)</Typography>}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>Parejas: {ch.currentPairs || "No definidas"}</Typography>
            <Divider sx={{ my: 0.5 }} />
            {ch.matchesPlayed?.length > 0 && <Typography variant="caption" display="block">Partidos:</Typography>}
            {ch.matchesPlayed.map(m => <Typography variant="body2" key={m.id} sx={{ fontSize: '0.85rem' }}>{dayjs(m.date).format('DD/MM')}: {m.winner} ganaron a {m.loser} ({m.sets?.map(s => `${s.pair1Score}-${s.pair2Score}`).join(', ') || 'N/A'})</Typography>)}
            {ch.noMatchDaysInCycle?.length > 0 && <Typography variant="caption" display="block" sx={{ mt: ch.matchesPlayed.length ? 0.5 : 0 }}>Días sin partido:</Typography>}
            {ch.noMatchDaysInCycle.map(nm => <Typography variant="body2" key={nm.id} sx={{ fontSize: '0.85rem' }}>{dayjs(nm.date).format('DD/MM')}: {nm.reason || 'Sin motivo'}</Typography>)}
            {(ch.matchesPlayed?.length === 0 && ch.noMatchDaysInCycle?.length === 0) && <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Sin actividad registrada.</Typography>}
            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
              Estado: {ch.statusText}
              {ch.statusText === 'Cerrado' && ch.calculatedWinner && ` - Ganador: ${ch.calculatedWinner}`}
            </Typography>
            {ch.statusText === 'Cerrado' && ch.calculatedWinner === 'Datos no concluyentes' && (
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Button variant="outlined" size="small" color="info" sx={{ textTransform: 'none' }}
                  onClick={() => setManualWinnerModal({ open: true, cycle: ch, winnerPair: '', firstPair: ch.firstPairName, secondPair: ch.secondPairName })}>
                  Determinar Ganador Manualmente
                </Button>
              </Box>
            )}
          </Paper>
        ))}
        {cycleHistoryDisplay.length > CYCLES_PER_PAGE && (
          <Pagination count={Math.ceil(cycleHistoryDisplay.length / CYCLES_PER_PAGE)} page={cyclesCurrentPage} onChange={(e, v) => setCyclesCurrentPage(v)} color="primary" sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />
        )}
      </Paper>

      <Modal open={manualWinnerModal.open} onClose={() => handleModalClose(setManualWinnerModal)}>
        <Paper sx={MODAL_STYLE}>
          <IconButton onClick={() => handleModalClose(setManualWinnerModal)} sx={{ position: 'absolute', top: 8, right: 8 }}><CloseIcon /></IconButton>
          <Typography variant="h6">Seleccionar Ganador del Ciclo Manualmente</Typography>
          <Typography sx={{ mt: 1 }}>Ciclo: {manualWinnerModal.cycle?.currentPairs} ({manualWinnerModal.cycle ? dayjs(manualWinnerModal.cycle.startDate).format('DD/MM/YY') : ''})</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Pareja Ganadora</InputLabel>
            <Select value={manualWinnerModal.winnerPair} label="Pareja Ganadora" onChange={e => setManualWinnerModal(p => ({ ...p, winnerPair: e.target.value }))}>
              <MenuItem value=""><em>-- Seleccionar --</em></MenuItem>
              {manualWinnerModal.firstPair && <MenuItem value={manualWinnerModal.firstPair}>{manualWinnerModal.firstPair}</MenuItem>}
              {manualWinnerModal.secondPair && <MenuItem value={manualWinnerModal.secondPair}>{manualWinnerModal.secondPair}</MenuItem>}
            </Select>
          </FormControl>
          <Box sx={{ textAlign: 'right', mt: 3 }}><Button onClick={() => handleModalClose(setManualWinnerModal)} sx={{ mr: 1 }}>Cancelar</Button><Button variant="contained" onClick={handleManualWinnerSave} disabled={!manualWinnerModal.winnerPair}>Guardar y Cerrar Ciclo</Button></Box>
        </Paper>
      </Modal>

      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Button variant="contained" sx={{ bgcolor: 'black', color: 'white', borderRadius: '20px', px: 3, '&:hover': { bgcolor: 'grey.800' } }} onClick={() => navigate('/')}>
          Volver a Pantalla Principal
        </Button>
      </Box>
    </Container>
  );
};

export default MatchInfo;