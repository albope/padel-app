// StatsCharts.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  IconButton,
  useMediaQuery,
  useTheme,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Card,
  CardContent,
  CardHeader, // Added
  Popover,
  Divider,
  Tooltip,
  Pagination,
  Skeleton, // Added
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
// Icons
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/InfoOutlined'; // Using Outlined version for consistency
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BarChartIcon from '@mui/icons-material/BarChart'; // Example for no data
// Utils
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
// import { TransitionGroup } from 'react-transition-group'; // Not explicitly used in this version's structure

dayjs.locale('es');

const exportChartAsImage = async (chartRef, chartName) => {
  if (!chartRef.current) return;
  const canvas = await html2canvas(chartRef.current, { backgroundColor: null }); // Ensure background is transparent or matches theme
  canvas.toBlob((blob) => {
    saveAs(blob, `${chartName}.png`);
  });
};

// Chart Options (minor adjustments possible for theme integration)
const baseChartOptions = (theme, yLabel, xLabel, isStacked = false, suggestedMax) => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      stacked: isStacked,
      title: { display: true, text: yLabel, font: { size: 12 }, color: theme.palette.text.secondary },
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
      ...(suggestedMax && { max: suggestedMax }),
    },
    x: {
      stacked: isStacked,
      title: { display: true, text: xLabel, font: { size: 12 }, color: theme.palette.text.secondary },
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
    },
  },
  plugins: {
    legend: {
      labels: { color: theme.palette.text.primary },
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      titleColor: theme.palette.text.primary,
      bodyColor: theme.palette.text.secondary,
      borderColor: theme.palette.divider,
      borderWidth: 1,
    }
  },
});

const pieChartBaseOptions = (theme) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { color: theme.palette.text.primary },
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      titleColor: theme.palette.text.primary,
      bodyColor: theme.palette.text.secondary,
      borderColor: theme.palette.divider,
      borderWidth: 1,
    }
  },
});


const StatsCharts = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Dynamic Chart Options based on Theme
  const barChartOptions = baseChartOptions(theme, 'Eficiencia (%)', 'Jugadores', false, 100);
  const stackedBarChartOptions = baseChartOptions(theme, 'Número de Sets', 'Jugadores', true);
  const pairEfficiencyChartOptions = baseChartOptions(theme, 'Eficiencia (%)', 'Parejas', false, 100);
  const lineChartOptions = baseChartOptions(theme, 'Eficiencia (%)', 'Fechas', false, 100);
  const pieChartOptions = pieChartBaseOptions(theme);
  const monthlyChartOptions = baseChartOptions(theme, 'Partidos Jugados', 'Meses');


  const [players] = useState([
    { id: 'Lucas', name: 'Lucas' },
    { id: 'Bort', name: 'Bort' },
    { id: 'Martin', name: 'Martin' },
    { id: 'Ricardo', name: 'Ricardo' },
  ]);
  const [selectedPlayers, setSelectedPlayers] = useState(['Lucas', 'Bort', 'Martin', 'Ricardo']);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));

  const [barChartData, setBarChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [stackedBarChartData, setStackedBarChartData] = useState(null);
  const [pairEfficiencyChartData, setPairEfficiencyChartData] = useState(null);

  const [summaryData, setSummaryData] = useState({
    totalSets: 0,
    topPlayers: [],
    topPlayerWins: 0,
  });

  const [trendInterval, setTrendInterval] = useState('Día');
  const [matchHistory, setMatchHistory] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const [insightsSelectedPeriod, setInsightsSelectedPeriod] = useState([]);
  const [insightsCurrentMonth, setInsightsCurrentMonth] = useState([]);

  const [anchorElPopover, setAnchorElPopover] = useState(null);
  const [popoverContent, setPopoverContent] = useState('');

  const [loadingData, setLoadingData] = useState(true); // For skeletons

  // Chart Colors from Theme
  const chartPalette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.success.light,
    theme.palette.warning.light,
  ];

  const handlePopoverOpen = (event, content) => {
    setAnchorElPopover(event.currentTarget);
    setPopoverContent(content);
  };

  const handlePopoverClose = () => {
    setAnchorElPopover(null);
    setPopoverContent('');
  };
  const openPopover = Boolean(anchorElPopover);

  const chartRefs = {
    barChart: useRef(null),
    stackedBarChart: useRef(null),
    lineChart: useRef(null),
    pairEfficiencyChart: useRef(null),
    pieChart: useRef(null),
    monthlyChart: useRef(null),
  };

  const [searchPlayerFilter, setSearchPlayerFilter] = useState('');
  const [searchPairFilter, setSearchPairFilter] = useState('');
  const [lastMonthResults, setLastMonthResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const renderInsight = (insight) => {
    let showDiffTooltip = insight.includes('Diferencia promedio de sets');
    let showAjustadoTooltip = insight.includes('Partido más ajustado');

    return (
      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <span dangerouslySetInnerHTML={{ __html: insight }}></span>
        {showDiffTooltip && (
          <IconButton
            size="small"
            onClick={(e) => handlePopoverOpen(e, 'Representa la diferencia promedio entre sets ganados y perdidos por un jugador en el período seleccionado.')}
            sx={{ ml: 0.5, verticalAlign: 'middle' }}
          >
            <InfoIcon fontSize="inherit" />
          </IconButton>
        )}
        {showAjustadoTooltip && (
          <IconButton
            size="small"
            onClick={(e) => handlePopoverOpen(e, 'Es el partido con la menor diferencia total de puntos entre los sets, considerando la ponderación por el número de sets jugados.')}
            sx={{ ml: 0.5, verticalAlign: 'middle' }}
          >
            <InfoIcon fontSize="inherit" />
          </IconButton>
        )}
      </Typography>
    );
  };

  useEffect(() => {
    const fetchLastMonth = async () => {
      const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
      const resultsCollection = collection(db, 'results');
      const lastMonthQuery = query(resultsCollection, where('date', '>=', lastMonthStart), where('date', '<=', lastMonthEnd));
      const lastMonthSnapshot = await getDocs(lastMonthQuery);
      setLastMonthResults(lastMonthSnapshot.docs.map((doc) => doc.data()));
    };
    fetchLastMonth();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      if (selectedPlayers.length === 0 || players.length === 0) {
        setLoadingData(false);
        return;
      }
      // ... (TODA LA LÓGICA DE CÁLCULO DE DATOS EXISTENTE, con las siguientes modificaciones para colores) ...
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');

      const resultsCollection = collection(db, 'results');
      const resultsQuery = query(resultsCollection, where('date', '>=', start), where('date', '<=', end));
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsData = resultsSnapshot.docs.map((doc) => doc.data());

      const currentMonthStart = dayjs().startOf('month').format('YYYY-MM-DD');
      const currentMonthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
      const currentMonthQuery = query(
        resultsCollection,
        where('date', '>=', currentMonthStart),
        where('date', '<=', currentMonthEnd)
      );
      const currentMonthSnapshot = await getDocs(currentMonthQuery);
      const currentMonthResults = currentMonthSnapshot.docs.map((doc) => doc.data());

      const filteredResults = resultsData.filter((result) =>
        [result.pair1.player1, result.pair1.player2, result.pair2.player1, result.pair2.player2].some((p) =>
          selectedPlayers.includes(p)
        )
      );
      setMatchHistory(filteredResults);

      const efficiencyData = {};
      selectedPlayers.forEach((p) => {
        efficiencyData[p] = { name: p, gamesWon: 0, gamesPlayed: 0, setsWon: 0, setsLost: 0, efficiencies: [] };
      });

      let consecutiveWinsData = {};
      let winStreakData = {};
      const pairMatchesCount = {};
      let bestScore = Infinity;
      let bestMatches = [];

      filteredResults.forEach((result) => {
        const playersInGame = [
          result.pair1.player1, result.pair1.player2,
          result.pair2.player1, result.pair2.player2,
        ];
        const pair1Key = [result.pair1.player1, result.pair1.player2].sort().join(' & ');
        const pair2Key = [result.pair2.player1, result.pair2.player2].sort().join(' & ');
        pairMatchesCount[pair1Key] = (pairMatchesCount[pair1Key] || 0) + 1;
        pairMatchesCount[pair2Key] = (pairMatchesCount[pair2Key] || 0) + 1;

        playersInGame.forEach((pl) => {
          if (selectedPlayers.includes(pl)) {
            efficiencyData[pl].gamesPlayed += 1;
          }
        });

        let pair1Wins = 0, pair2Wins = 0, matchDifference = 0;
        const setsCount = result.sets.length;
        result.sets.forEach((set) => {
          const s1 = parseInt(set.pair1Score, 10), s2 = parseInt(set.pair2Score, 10);
          if (s1 > s2) pair1Wins++; else if (s2 > s1) pair2Wins++;
          [result.pair1.player1, result.pair1.player2].forEach((pl) => {
            if (selectedPlayers.includes(pl)) { if (s1 > s2) efficiencyData[pl].setsWon++; else efficiencyData[pl].setsLost++; }
          });
          [result.pair2.player1, result.pair2.player2].forEach((pl) => {
            if (selectedPlayers.includes(pl)) { if (s2 > s1) efficiencyData[pl].setsWon++; else efficiencyData[pl].setsLost++; }
          });
          matchDifference += Math.abs(s1 - s2);
        });

        let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';
        let losingPair = (winningPair === 'pair1') ? 'pair2' : 'pair1';

        [result[winningPair].player1, result[winningPair].player2].forEach((pl) => {
          if (selectedPlayers.includes(pl)) {
            efficiencyData[pl].gamesWon += 1;
            if (!consecutiveWinsData[pl]) consecutiveWinsData[pl] = { currentStreak: 1, maxStreak: 1 };
            else {
              consecutiveWinsData[pl].currentStreak += 1;
              if (consecutiveWinsData[pl].currentStreak > consecutiveWinsData[pl].maxStreak) consecutiveWinsData[pl].maxStreak = consecutiveWinsData[pl].currentStreak;
            }
          }
        });
        [result[losingPair].player1, result[losingPair].player2].forEach((pl) => {
          if (selectedPlayers.includes(pl)) {
            if (!consecutiveWinsData[pl]) consecutiveWinsData[pl] = { currentStreak: 0, maxStreak: 0 };
            else consecutiveWinsData[pl].currentStreak = 0;
          }
        });

        const winningPairKey = [result[winningPair].player1, result[winningPair].player2].sort().join(' & ');
        if (!winStreakData[winningPairKey]) winStreakData[winningPairKey] = { currentStreak: 1, maxStreak: 1 };
        else {
          winStreakData[winningPairKey].currentStreak += 1;
          if (winStreakData[winningPairKey].currentStreak > winStreakData[winningPairKey].maxStreak) winStreakData[winningPairKey].maxStreak = winStreakData[winningPairKey].currentStreak;
        }
        const losingPairKey = [result[losingPair].player1, result[losingPair].player2].sort().join(' & ');
        if (!winStreakData[losingPairKey]) winStreakData[losingPairKey] = { currentStreak: 0, maxStreak: 0 };
        else winStreakData[losingPairKey].currentStreak = 0;

        const score = matchDifference / setsCount;
        if (score < bestScore) {
          bestScore = score; bestMatches = [{ match: result, setsCount, difference: matchDifference, score }];
        } else if (Math.abs(score - bestScore) < 0.0001) {
          const bestCurrentSetsCount = bestMatches[0].setsCount;
          if (setsCount > bestCurrentSetsCount) { bestMatches = [{ match: result, setsCount, difference: matchDifference, score }]; }
          else if (setsCount === bestCurrentSetsCount) { bestMatches.push({ match: result, setsCount, difference: matchDifference, score }); }
        }
      });

      const barChartLabels = [], barChartValues = [];
      let topEfficiency = 0, allPlayersEfficiency = {};
      Object.values(efficiencyData).forEach((p, index) => {
        const eff = p.gamesPlayed > 0 ? (p.gamesWon / p.gamesPlayed) * 100 : 0;
        barChartLabels.push(p.name); barChartValues.push(eff.toFixed(2));
        allPlayersEfficiency[p.name] = eff;
        if (eff > topEfficiency) topEfficiency = eff;
      });
      const maxEffPlayers = Object.keys(allPlayersEfficiency).filter(pl => allPlayersEfficiency[pl] === topEfficiency);
      let firstTopWins = 0;
      if (maxEffPlayers.length > 0) firstTopWins = efficiencyData[maxEffPlayers[0]].gamesWon;

      setBarChartData({
        labels: barChartLabels,
        datasets: [{
          label: 'Eficiencia (%)',
          data: barChartValues,
          backgroundColor: barChartLabels.map((_, index) => chartPalette[index % chartPalette.length]),
        }],
      });

      const stackedBarLabels = [], setsWonData = [], setsLostData = [];
      Object.values(efficiencyData).forEach((pl) => {
        stackedBarLabels.push(pl.name); setsWonData.push(pl.setsWon); setsLostData.push(pl.setsLost);
      });
      setStackedBarChartData({
        labels: stackedBarLabels,
        datasets: [
          { label: 'Sets Ganados', data: setsWonData, backgroundColor: theme.palette.success.light },
          { label: 'Sets Perdidos', data: setsLostData, backgroundColor: theme.palette.error.light },
        ],
      });

      const pairEfficiencyDataMap = {};
      filteredResults.forEach((res) => {
        const p1 = [res.pair1.player1, res.pair1.player2].sort().join(' & ');
        const p2 = [res.pair2.player1, res.pair2.player2].sort().join(' & ');
        if (!pairEfficiencyDataMap[p1]) pairEfficiencyDataMap[p1] = { gamesWon: 0, gamesPlayed: 0 };
        if (!pairEfficiencyDataMap[p2]) pairEfficiencyDataMap[p2] = { gamesWon: 0, gamesPlayed: 0 };
        pairEfficiencyDataMap[p1].gamesPlayed++; pairEfficiencyDataMap[p2].gamesPlayed++;
        let p1w = 0, p2w = 0;
        res.sets.forEach((s) => { const s1 = parseInt(s.pair1Score, 10), s2 = parseInt(s.pair2Score, 10); if (s1 > s2) p1w++; else if (s2 > s1) p2w++; });
        if (p1w > p2w) pairEfficiencyDataMap[p1].gamesWon++; else pairEfficiencyDataMap[p2].gamesWon++;
      });
      const pairLabels = [], pairEfficiencyValues = [];
      Object.keys(pairEfficiencyDataMap).forEach((pairKey) => {
        const pairPlayers = pairKey.split(' & ');
        if (pairPlayers.every((pl) => selectedPlayers.includes(pl))) {
          const d = pairEfficiencyDataMap[pairKey]; const eff = d.gamesPlayed > 0 ? (d.gamesWon / d.gamesPlayed) * 100 : 0;
          pairLabels.push(pairKey); pairEfficiencyValues.push(eff.toFixed(2));
        }
      });
      setPairEfficiencyChartData({
        labels: pairLabels,
        datasets: [{ label: 'Eficiencia (%)', data: pairEfficiencyValues, backgroundColor: chartPalette[2 % chartPalette.length] /* Example specific color */ }],
      });

      const pairingWins = {};
      filteredResults.forEach((res) => {
        let p1w = 0, p2w = 0;
        res.sets.forEach((s) => { const s1 = parseInt(s.pair1Score, 10), s2 = parseInt(s.pair2Score, 10); if (s1 > s2) p1w++; else if (s2 > s1) p2w++; });
        const wPair = p1w > p2w ? 'pair1' : 'pair2'; const wp = [res[wPair].player1, res[wPair].player2];
        if (wp.every(pl => selectedPlayers.includes(pl))) { const key = wp.sort().join(' & '); pairingWins[key] = (pairingWins[key] || 0) + 1; }
      });
      const pieChartLabels = Object.keys(pairingWins); const pieChartValues = Object.values(pairingWins);
      setPieChartData({
        labels: pieChartLabels,
        datasets: [{ data: pieChartValues, backgroundColor: pieChartLabels.map((_, index) => chartPalette[index % chartPalette.length]) }],
      });

      const sortedByDate = filteredResults.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      const allDatesSetLine = new Set();
      sortedByDate.forEach((r) => {
        if (trendInterval === 'Día') allDatesSetLine.add(dayjs(r.date).format('YYYY-MM-DD'));
        else if (trendInterval === 'Semana') allDatesSetLine.add(dayjs(r.date).startOf('week').format('YYYY-MM-DD'));
        else if (trendInterval === 'Mes') allDatesSetLine.add(dayjs(r.date).startOf('month').format('YYYY-MM-DD'));
      });
      const allDatesLine = Array.from(allDatesSetLine).sort();
      const dateToResultsMapLine = {};
      sortedByDate.forEach((r) => {
        let dKey;
        if (trendInterval === 'Día') dKey = dayjs(r.date).format('YYYY-MM-DD');
        else if (trendInterval === 'Semana') dKey = dayjs(r.date).startOf('week').format('YYYY-MM-DD');
        else dKey = dayjs(r.date).startOf('month').format('YYYY-MM-DD');
        if (!dateToResultsMapLine[dKey]) dateToResultsMapLine[dKey] = []; dateToResultsMapLine[dKey].push(r);
      });
      const lineChartDatasets = selectedPlayers.map((pid, index) => ({
        label: pid, data: [], borderColor: chartPalette[index % chartPalette.length], fill: false, tension: 0.1
      }));
      const cumulativeStats = {}; selectedPlayers.forEach((pid) => { cumulativeStats[pid] = { gamesWon: 0, gamesPlayed: 0, lastEfficiency: 0 }; });
      allDatesLine.forEach((dStr) => {
        const dResults = dateToResultsMapLine[dStr] || []; // Ensure dResults is an array
        selectedPlayers.forEach((pid, idx) => {
          let gw = 0, gp = 0;
          dResults.forEach((rr) => {
            const pGame = [rr.pair1.player1, rr.pair1.player2, rr.pair2.player1, rr.pair2.player2];
            if (pGame.includes(pid)) {
              gp++; let p1w = 0, p2w = 0;
              rr.sets.forEach((ss) => { const s1 = parseInt(ss.pair1Score, 10), s2 = parseInt(ss.pair2Score, 10); if (s1 > s2) p1w++; else if (s2 > s1) p2w++; });
              const wPair = p1w > p2w ? 'pair1' : 'pair2';
              if (rr[wPair].player1 === pid || rr[wPair].player2 === pid) gw++;
            }
          });
          cumulativeStats[pid].gamesPlayed += gp; cumulativeStats[pid].gamesWon += gw;
          const eff = cumulativeStats[pid].gamesPlayed > 0 ? (cumulativeStats[pid].gamesWon / cumulativeStats[pid].gamesPlayed) * 100 : cumulativeStats[pid].lastEfficiency;
          cumulativeStats[pid].lastEfficiency = eff; lineChartDatasets[idx].data.push(eff.toFixed(2));
        });
      });
      const formattedDates = allDatesLine.map((dStr) => {
        if (trendInterval === 'Día') return dayjs(dStr).format('DD/MM');
        else if (trendInterval === 'Semana') { const sw = dayjs(dStr).startOf('week').format('DD/MM'); const ew = dayjs(dStr).endOf('week').format('DD/MM'); return `${sw}-${ew}`; }
        else { return dayjs(dStr).format('MMM YY'); }
      });
      setLineChartData({ labels: formattedDates, datasets: lineChartDatasets });

      const matchesPerMonth = {};
      filteredResults.forEach((r) => { const mk = dayjs(r.date).format('MMM \'YY'); matchesPerMonth[mk] = (matchesPerMonth[mk] || 0) + 1; });
      const monthlyLabels = Object.keys(matchesPerMonth).sort((a, b) => dayjs(a, 'MMM \'YY').diff(dayjs(b, 'MMM \'YY')));
      const monthlyValues = monthlyLabels.map((m) => matchesPerMonth[m]);
      setMonthlyChartData({
        labels: monthlyLabels,
        datasets: [{ label: 'Partidos Jugados', data: monthlyValues, backgroundColor: chartPalette[3 % chartPalette.length] }]
      });

      let totalSets = 0; filteredResults.forEach((r) => { totalSets += r.sets.length; });
      setSummaryData({ totalSets, topPlayers: maxEffPlayers, topPlayerWins: firstTopWins });

      let maxSetsLost = 0; let playersMaxSetsLost = [];
      Object.values(efficiencyData).forEach((p) => {
        if (p.setsLost > maxSetsLost) { maxSetsLost = p.setsLost; playersMaxSetsLost = [p.name]; }
        else if (p.setsLost === maxSetsLost && maxSetsLost > 0) { playersMaxSetsLost.push(p.name); }
      });
      let maxSetsWon = 0; let playersMaxSetsWon = [];
      Object.values(efficiencyData).forEach((p) => {
        if (p.setsWon > maxSetsWon) { maxSetsWon = p.setsWon; playersMaxSetsWon = [p.name]; }
        else if (p.setsWon === maxSetsWon && maxSetsWon > 0) { playersMaxSetsWon.push(p.name); }
      });
      let maxStreak = 0; let playersMaxStreak = [];
      Object.entries(consecutiveWinsData).forEach(([pl, st]) => {
        if (st.maxStreak > maxStreak) { maxStreak = st.maxStreak; playersMaxStreak = [pl]; }
        else if (st.maxStreak === maxStreak && maxStreak > 0) { playersMaxStreak.push(pl); }
      });
      let maxMatches = 0; let mostActivePairs = [];
      Object.entries(pairMatchesCount).forEach(([pairKey, cnt]) => {
        if (cnt > maxMatches) { maxMatches = cnt; mostActivePairs = [pairKey]; }
        else if (cnt === maxMatches && maxMatches > 0) { mostActivePairs.push(pairKey); }
      });
      let diffInsights = [];
      maxEffPlayers.forEach((pl) => {
        const p = efficiencyData[pl]; const diff = (p.setsWon - p.setsLost) / (p.gamesPlayed || 1);
        const sign = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        diffInsights.push(`Diferencia promedio de sets para ${pl}: ${sign}.`);
      });

      // Efficiency This Month vs Last Month
      const efficiencyThisMonth = {}; selectedPlayers.forEach((p) => { efficiencyThisMonth[p] = { gamesWon: 0, gamesPlayed: 0 } });
      currentMonthResults.forEach((r) => {
        const pGame = [r.pair1.player1, r.pair1.player2, r.pair2.player1, r.pair2.player2]; let p1w = 0, p2w = 0;
        r.sets.forEach((s) => { const s1 = parseInt(s.pair1Score, 10), s2 = parseInt(s.pair2Score, 10); if (s1 > s2) p1w++; else if (s2 > s1) p2w++; });
        const wPair = p1w > p2w ? 'pair1' : 'pair2';
        pGame.forEach(pl => { if (selectedPlayers.includes(pl)) efficiencyThisMonth[pl].gamesPlayed++; });
        [r[wPair].player1, r[wPair].player2].forEach(pl => { if (selectedPlayers.includes(pl)) efficiencyThisMonth[pl].gamesWon++; });
      });
      const effThisMonth = {}; Object.keys(efficiencyThisMonth).forEach(pl => { const d = efficiencyThisMonth[pl]; effThisMonth[pl] = d.gamesPlayed > 0 ? (d.gamesWon / d.gamesPlayed) * 100 : 0; });

      const efficiencyLastMonth = {}; selectedPlayers.forEach((p) => { efficiencyLastMonth[p] = { gamesWon: 0, gamesPlayed: 0 } });
      lastMonthResults.forEach((r) => {
        const pGame = [r.pair1.player1, r.pair1.player2, r.pair2.player1, r.pair2.player2]; let p1w = 0, p2w = 0;
        r.sets.forEach((s) => { const s1 = parseInt(s.pair1Score, 10), s2 = parseInt(s.pair2Score, 10); if (s1 > s2) p1w++; else if (s2 > s1) p2w++; });
        const wPair = p1w > p2w ? 'pair1' : 'pair2';
        pGame.forEach(pl => { if (selectedPlayers.includes(pl)) efficiencyLastMonth[pl].gamesPlayed++; });
        [r[wPair].player1, r[wPair].player2].forEach(pl => { if (selectedPlayers.includes(pl)) efficiencyLastMonth[pl].gamesWon++; });
      });
      const effLastMonth = {}; Object.keys(efficiencyLastMonth).forEach(pl => { const d = efficiencyLastMonth[pl]; effLastMonth[pl] = d.gamesPlayed > 0 ? (d.gamesWon / d.gamesPlayed) * 100 : 0; });

      let maxImprovement = 0; let playersMaxImprovement = [];
      Object.keys(effThisMonth).forEach(pl => {
        const improvement = effThisMonth[pl] - effLastMonth[pl];
        if (improvement > maxImprovement) { maxImprovement = improvement; playersMaxImprovement = [pl]; }
        else if (Math.abs(improvement - maxImprovement) < 0.0001 && improvement > 0) { playersMaxImprovement.push(pl); }
      });

      const currentMonthPairs = {};
      currentMonthResults.forEach((r) => {
        const p1 = [r.pair1.player1, r.pair1.player2].sort().join(' & '); const p2 = [r.pair2.player1, r.pair2.player2].sort().join(' & ');
        if (!currentMonthPairs[p1]) currentMonthPairs[p1] = { currentStreak: 0, maxStreak: 0, lastWin: false }; if (!currentMonthPairs[p2]) currentMonthPairs[p2] = { currentStreak: 0, maxStreak: 0, lastWin: false };
        let p1w = 0, p2w = 0; r.sets.forEach((s) => { const s1 = parseInt(s.pair1Score, 10), s2 = parseInt(s.pair2Score, 10); if (s1 > s2) p1w++; else if (s2 > s1) p2w++; });
        const wp = p1w > p2w ? p1 : p2; const lp = wp === p1 ? p2 : p1;
        if (currentMonthPairs[wp].lastWin === false) { currentMonthPairs[wp].currentStreak = 1; currentMonthPairs[wp].lastWin = true; } else { currentMonthPairs[wp].currentStreak += 1; }
        if (currentMonthPairs[wp].currentStreak > currentMonthPairs[wp].maxStreak) currentMonthPairs[wp].maxStreak = currentMonthPairs[wp].currentStreak;
        currentMonthPairs[lp].lastWin = false; currentMonthPairs[lp].currentStreak = 0;
      });
      let maxPairStreakMonth = 0; let pairsMaxStreakMonth = [];
      Object.entries(currentMonthPairs).forEach(([pairKey, d]) => {
        if (d.maxStreak > maxPairStreakMonth) { maxPairStreakMonth = d.maxStreak; pairsMaxStreakMonth = [pairKey]; }
        else if (d.maxStreak === maxPairStreakMonth && maxPairStreakMonth > 0) { pairsMaxStreakMonth.push(pairKey); }
      });

      const boldNames = (arr) => arr.map(n => `<strong>${n}</strong>`).join(', ');
      const insightsPeriod = [];
      if (playersMaxSetsLost.length > 0 && maxSetsLost > 0) insightsPeriod.push(`Jugador(es) con más sets perdidos: ${boldNames(playersMaxSetsLost)} (${maxSetsLost} sets).`);
      if (playersMaxSetsWon.length > 0 && maxSetsWon > 0) insightsPeriod.push(`Jugador(es) con más sets ganados: ${boldNames(playersMaxSetsWon)} (${maxSetsWon} sets).`);
      if (playersMaxStreak.length > 0 && maxStreak > 0) insightsPeriod.push(`Racha de victorias (individual): ${boldNames(playersMaxStreak)} (${maxStreak} seguidas).`);
      if (mostActivePairs.length > 0 && maxMatches > 0) insightsPeriod.push(`Pareja(s) más activa(s): ${boldNames(mostActivePairs)} (${maxMatches} partidos).`);
      diffInsights.forEach(d => { const match = d.match(/para (.+?):/); if (match && match[1]) { const plName = match[1]; const boldD = d.replace(plName, `<strong>${plName}</strong>`); insightsPeriod.push(boldD); } else { insightsPeriod.push(d); } });
      if (bestMatches.length > 0 && bestScore < Infinity) { bestMatches.forEach((bm) => { const m = bm.match; const p1 = `${m.pair1.player1} & ${m.pair1.player2}`; const p2 = `${m.pair2.player1} & ${m.pair2.player2}`; const setsDesc = m.sets.map(s => `${s.pair1Score}-${s.pair2Score}`).join(', '); insightsPeriod.push(`Partido más ajustado: <strong>${p1}</strong> vs <strong>${p2}</strong> (${setsDesc}).`); }); }
      if (maxEffPlayers.length > 0 && topEfficiency > 0) insightsPeriod.push(`Jugador(es) más eficiente(s): ${boldNames(maxEffPlayers)} (${topEfficiency.toFixed(2)}%).`); else insightsPeriod.push('No hay suficientes datos para el jugador más eficiente.');
      setInsightsSelectedPeriod(insightsPeriod);

      const insightsMonth = [];
      if (playersMaxImprovement.length > 0 && maxImprovement > 0) insightsMonth.push(`Mayor mejora en eficiencia: ${boldNames(playersMaxImprovement)} (+${maxImprovement.toFixed(2)}% vs mes anterior).`); else insightsMonth.push('Sin mejora significativa en eficiencia vs mes anterior.');
      if (pairsMaxStreakMonth.length > 0 && maxPairStreakMonth > 0) insightsMonth.push(`Racha de victorias (pareja, mes actual): ${boldNames(pairsMaxStreakMonth)} (${maxPairStreakMonth} seguidas).`);
      setInsightsCurrentMonth(insightsMonth);


      // --- FIN LÓGICA ---
      setLoadingData(false);
    }; // Fin fetchData

    fetchData();
  }, [selectedPlayers, startDate, endDate, players, trendInterval, lastMonthResults, theme]); // theme as dependency for chartPalette

  const handlePlayerChange = (event) => setSelectedPlayers(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value);
  const handleTrendIntervalChange = (event) => setTrendInterval(event.target.value);
  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const filteredMatchHistory = matchHistory.filter((match) => {
    let passPlayer = true;
    if (searchPlayerFilter && searchPlayerFilter !== '') {
      const p = searchPlayerFilter.toLowerCase();
      const pInGame = [match.pair1.player1, match.pair1.player2, match.pair2.player1, match.pair2.player2].map(x => x.toLowerCase());
      if (!pInGame.includes(p)) passPlayer = false;
    }
    let passPair = true;
    if (searchPairFilter && searchPairFilter !== '') {
      const pairKey = searchPairFilter.toLowerCase();
      const p1 = [match.pair1.player1.toLowerCase(), match.pair1.player2.toLowerCase()].sort().join(' & ');
      const p2 = [match.pair2.player1.toLowerCase(), match.pair2.player2.toLowerCase()].sort().join(' & ');
      if (p1 !== pairKey && p2 !== pairKey) passPair = false;
    }
    return passPlayer && passPair;
  });

  const totalHistoryPages = Math.ceil(filteredMatchHistory.length / itemsPerPage);
  const handleHistoryPageChange = (event, value) => setCurrentPage(value);


  const renderChartCard = (title, chartRef, chartData, ChartComponent, chartOptions, popoverText, chartNameForExport) => (
    <Paper elevation={2} sx={{ p: theme.spacing(2), height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="h3">
          {title}
          <Tooltip title={popoverText} placement="top">
            <IconButton size="small" sx={{ ml: 0.5 }}><InfoIcon fontSize="inherit" /></IconButton>
          </Tooltip>
        </Typography>
        {chartData && (
          <Tooltip title="Descargar gráfico">
            <IconButton onClick={() => exportChartAsImage(chartRef, chartNameForExport)} size="small">
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: isSmallScreen ? '280px' : '380px' /* Ensure enough space */ }} ref={chartRef}>
        {loadingData ? (
          <Skeleton variant="rectangular" width="100%" height="100%" />
        ) : chartData && chartData.labels && chartData.labels.length > 0 ? (
          <ChartComponent data={chartData} options={chartOptions} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.palette.text.secondary }}>
            <BarChartIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>No hay datos para mostrar.</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: theme.spacing(4), mb: theme.spacing(4) }}>
      {/* INICIO: Título Modificado */}
      <Paper elevation={3} sx={{
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
        padding: theme.spacing(1.5, 3), // Ajustado ligeramente el padding vertical para h4/h5
        textAlign: 'center',
        mb: theme.spacing(4), // mb: 4 como en el ejemplo
        borderRadius: 2 // borderRadius: 2 como en el ejemplo
      }}>
        <Typography
          variant={isSmallScreen ? "h5" : "h4"} // Usa isSmallScreen para la responsividad
          component="h1"
          sx={{ fontWeight: 'bold' }}
        >
          Estadísticas Avanzadas
        </Typography>
      </Paper>
      <Popover
        open={openPopover}
        anchorEl={anchorElPopover}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { p: 2, maxWidth: 300, backgroundColor: theme.palette.background.default } }}
      >
        <Typography variant="body2">{popoverContent}</Typography>
      </Popover>

      <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth" indicatorColor="primary" textColor="primary" sx={{ mb: theme.spacing(3), borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Resumen" />
        <Tab label="Gráficos Detallados" />
        <Tab label="Historial de Partidos" />
      </Tabs>

      {tabIndex === 0 && (
        <Fade in timeout={500}>
          <Box sx={{ mt: theme.spacing(1) }}> {/* Adjusted margin top */}
            <Paper elevation={0} variant="outlined" sx={{ p: theme.spacing(2), mb: theme.spacing(3), backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800] }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>Seleccionar Periodo</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker label="Fecha de Inicio" value={startDate} onChange={(date) => setStartDate(date)} views={['year', 'month']} format="MM/YYYY" slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker label="Fecha Final" value={endDate} onChange={(date) => setEndDate(date)} views={['year', 'month']} format="MM/YYYY" slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={3} sx={{ mb: theme.spacing(3) }}>
              {[
                { title: "Total Sets Jugados", value: summaryData.totalSets, icon: <AssessmentIcon fontSize="large" color="primary" />, popover: "Número total de sets jugados en el rango seleccionado." },
                { title: "Rendimiento Máximo", value: summaryData.topPlayers.map(p => `<strong>${p}</strong>`).join(', ') || "N/A", icon: <EmojiEventsIcon fontSize="large" color="secondary" />, popover: "Jugador(es) con el mayor porcentaje de victorias.", isHtml: true },
                { title: "Victorias del Top", value: summaryData.topPlayerWins, icon: <DoneAllIcon fontSize="large" color="success" />, popover: `Partidos ganados por: ${summaryData.topPlayers.join(', ') || 'N/A'}.` }
              ].map(item => (
                <Grid item xs={12} sm={6} md={4} key={item.title}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
                    <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                      <Box sx={{ mb: 1.5, color: item.icon.props.color + ".main" }}>{item.icon}</Box>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {item.title}
                        <Tooltip title={item.popover} placement="top">
                          <IconButton size="small" sx={{ ml: 0.5, verticalAlign: 'middle' }}><InfoIcon fontSize="inherit" /></IconButton>
                        </Tooltip>
                      </Typography>
                      {loadingData ? <Skeleton width="60%" sx={{ margin: 'auto', height: 40 }} /> :
                        item.isHtml ? <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: item.value }} />
                          : <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>{item.value}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader title={`Insights del Período (${startDate.format('DD/MM/YY')} - ${endDate.format('DD/MM/YY')})`} titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                  <Divider />
                  <CardContent>
                    {loadingData ? Array(3).fill(0).map((_, i) => <Skeleton key={i} height={30} sx={{ mb: 1 }} />) :
                      insightsSelectedPeriod.length > 0 ? insightsSelectedPeriod.map((insight, index) => <React.Fragment key={index}>{renderInsight(insight)}</React.Fragment>)
                        : <Typography color="textSecondary">No hay insights para este período.</Typography>}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader title="Insights del Mes Actual" titleTypographyProps={{ variant: 'h6' }} sx={{ pb: 1 }} />
                  <Divider />
                  <CardContent>
                    {loadingData ? Array(2).fill(0).map((_, i) => <Skeleton key={i} height={30} sx={{ mb: 1 }} />) :
                      insightsCurrentMonth.length > 0 ? insightsCurrentMonth.map((insight, index) => <React.Fragment key={index}>{renderInsight(insight)}</React.Fragment>)
                        : <Typography color="textSecondary">No hay insights para el mes actual.</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {tabIndex === 1 && (
        <Fade in timeout={500}>
          <Box sx={{ mt: theme.spacing(1) }}>
            <Paper elevation={0} variant='outlined' sx={{ p: theme.spacing(2), mb: theme.spacing(3), backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800] }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="player-select-label">Seleccionar Jugadores</InputLabel>
                    <Select labelId="player-select-label" multiple value={selectedPlayers} onChange={handlePlayerChange} input={<OutlinedInput label="Seleccionar Jugadores" />} renderValue={(selected) => selected.join(', ')}>
                      {players.map((player) => (<MenuItem key={player.id} value={player.id}> <Checkbox checked={selectedPlayers.indexOf(player.id) > -1} /> <ListItemText primary={player.name} /> </MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker label="Fecha de Inicio" value={startDate} onChange={(date) => setStartDate(date)} views={['year', 'month']} format="MM/YYYY" slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker label="Fecha Final" value={endDate} onChange={(date) => setEndDate(date)} views={['year', 'month']} format="MM/YYYY" slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="trend-interval-label">Intervalo Tendencia</InputLabel>
                    <Select labelId="trend-interval-label" value={trendInterval} onChange={handleTrendIntervalChange} label="Intervalo Tendencia">
                      <MenuItem value="Día">Día</MenuItem> <MenuItem value="Semana">Semana</MenuItem> <MenuItem value="Mes">Mes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
            <Typography variant="caption" display="block" color="textSecondary" gutterBottom sx={{ textAlign: 'right', mb: 2 }}>
              Rango activo: {startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>{renderChartCard("Eficiencia Jugadores (%)", chartRefs.barChart, barChartData, Bar, barChartOptions, "Eficiencia de victorias de jugadores seleccionados.", "Eficiencia_Jugadores")}</Grid>
              <Grid item xs={12} md={6}>{renderChartCard("Sets Ganados/Perdidos", chartRefs.stackedBarChart, stackedBarChartData, Bar, stackedBarChartOptions, "Sets ganados y perdidos por jugador.", "Sets_Jugador")}</Grid>
              <Grid item xs={12} md={6}>{renderChartCard("Eficiencia Parejas (%)", chartRefs.pairEfficiencyChart, pairEfficiencyChartData, Bar, pairEfficiencyChartOptions, "Eficiencia de victorias de parejas formadas por jugadores seleccionados.", "Eficiencia_Parejas")}</Grid>
              <Grid item xs={12} md={6}>{renderChartCard("Victorias por Pareja", chartRefs.pieChart, pieChartData, Pie, pieChartOptions, "Distribución de victorias entre parejas.", "Victorias_Pareja")}</Grid>
              <Grid item xs={12} md={6}>{renderChartCard("Tendencia Eficiencia Acumulada", chartRefs.lineChart, lineChartData, Line, lineChartOptions, "Evolución de la eficiencia acumulada de jugadores.", "Tendencia_Eficiencia")}</Grid>
              <Grid item xs={12} md={6}>{renderChartCard("Partidos por Mes", chartRefs.monthlyChart, monthlyChartData, Bar, monthlyChartOptions, "Número de partidos jugados cada mes.", "Partidos_Mes")}</Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {tabIndex === 2 && (
        <Fade in timeout={500}>
          <Box sx={{ mt: theme.spacing(1) }}>
            <Paper elevation={0} variant='outlined' sx={{ p: theme.spacing(2), mb: theme.spacing(3), backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800] }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField label="Buscar Jugador" variant="outlined" fullWidth size="small" value={searchPlayerFilter} onChange={(e) => setSearchPlayerFilter(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="pair-filter-label">Buscar Pareja</InputLabel>
                    <Select labelId="pair-filter-label" value={searchPairFilter} onChange={(e) => setSearchPairFilter(e.target.value)} label="Buscar Pareja">
                      <MenuItem value="">(Todas)</MenuItem>
                      {(() => { const allPairsSet = new Set(); matchHistory.forEach(m => { const p1 = [m.pair1.player1, m.pair1.player2].sort().join(' & '); const p2 = [m.pair2.player1, m.pair2.player2].sort().join(' & '); allPairsSet.add(p1); allPairsSet.add(p2); }); return Array.from(allPairsSet).sort().map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>); })()}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>Historial de Partidos</Typography>
            <TableContainer component={Paper} elevation={2}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[700] }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell> <TableCell sx={{ fontWeight: 'bold' }}>Pareja 1</TableCell> <TableCell sx={{ fontWeight: 'bold' }}>Pareja 2</TableCell> <TableCell sx={{ fontWeight: 'bold' }}>Ganadores</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingData ? Array(itemsPerPage).fill(0).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton /></TableCell><TableCell><Skeleton /></TableCell><TableCell><Skeleton /></TableCell><TableCell><Skeleton /></TableCell>
                    </TableRow>
                  )) : filteredMatchHistory.length > 0 ? (
                    filteredMatchHistory.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
                      .slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage)
                      .map((match, index) => {
                        let p1Wins = 0, p2Wins = 0;
                        match.sets.forEach(s => { const s1 = parseInt(s.pair1Score, 10), s2 = parseInt(s.pair2Score, 10); if (s1 > s2) p1Wins++; else if (s2 > s1) p2Wins++; });
                        const wPair = p1Wins > p2Wins ? 'pair1' : 'pair2';
                        const wPlayers = `${match[wPair].player1} & ${match[wPair].player2}`;
                        return (
                          <TableRow key={match.id || index} hover>
                            <TableCell>{dayjs(match.date).format('DD/MM/YYYY')}</TableCell>
                            <TableCell>{match.pair1.player1} & {match.pair1.player2}</TableCell>
                            <TableCell>{match.pair2.player1} & {match.pair2.player2}</TableCell>
                            <TableCell><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{wPlayers}</Typography></TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow><TableCell colSpan={4} align="center"><Typography color="textSecondary" sx={{ py: 3 }}>No hay partidos que mostrar.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {totalHistoryPages > 1 && !loadingData && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: theme.spacing(2) }}>
                <Pagination count={totalHistoryPages} page={currentPage} onChange={handleHistoryPageChange} color="primary" />
              </Box>
            )}
          </Box>
        </Fade>
      )}

      <Box sx={{ mt: theme.spacing(5), textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{
            backgroundColor: theme.palette.common.black, // Botón negro
            color: theme.palette.common.white,           // Texto blanco
            borderRadius: '30px',
            padding: '10px 30px',
            textTransform: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            '&:hover': {
              backgroundColor: theme.palette.grey[800], // Hover gris oscuro
            },
          }}
        >
          Volver a la Pantalla Principal
        </Button>
      </Box>
    </Container>
  );
};

export default StatsCharts;