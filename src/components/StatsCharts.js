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
  InputAdornment,
  Fade,
  Card,
  CardContent,
  Popover,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { TransitionGroup } from 'react-transition-group';

const StatsCharts = () => {
  const [players, setPlayers] = useState([
    { id: 'Lucas', name: 'Lucas' },
    { id: 'Bort', name: 'Bort' },
    { id: 'Martin', name: 'Martin' },
    { id: 'Ricardo', name: 'Ricardo' },
  ]);
  const [selectedPlayers, setSelectedPlayers] = useState(['Lucas', 'Bort', 'Martin', 'Ricardo']);
  const [startDate, setStartDate] = useState(dayjs().startOf('month')); // Primer día del mes actual
  const [endDate, setEndDate] = useState(dayjs().endOf('month')); // Último día del mes actual
  const [barChartData, setBarChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalSets: 0,
    topPlayer: '',
    topPlayerWins: 0,
  });
  const [stackedBarChartData, setStackedBarChartData] = useState(null);
  const [pairEfficiencyChartData, setPairEfficiencyChartData] = useState(null);
  const [trendInterval, setTrendInterval] = useState('Día'); // 'Día', 'Semana', 'Mes'
  const [recentMatches, setRecentMatches] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [matchHistory, setMatchHistory] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [insightsSelectedPeriod, setInsightsSelectedPeriod] = useState([]);
  const [insightsCurrentMonth, setInsightsCurrentMonth] = useState([]);
  const navigate = useNavigate();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Refs para exportar gráficos
  const chartRefs = {
    barChart: useRef(null),
    stackedBarChart: useRef(null),
    lineChart: useRef(null),
    pairEfficiencyChart: useRef(null),
    pieChart: useRef(null),
    monthlyChart: useRef(null),
  };

  // Estado para el Popover de Tooltips
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverContent, setPopoverContent] = useState('');

  const handlePopoverOpen = (event, content) => {
    setAnchorEl(event.currentTarget);
    setPopoverContent(content);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverContent('');
  };

  const openPopover = Boolean(anchorEl);

  // Obtener datos cuando cambian los filtros
  useEffect(() => {
    const fetchData = async () => {
      if (selectedPlayers.length === 0 || players.length === 0) {
        return;
      }

      // Preparar rango de fechas
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');

      // Obtener resultados dentro del rango de fechas
      const resultsCollection = collection(db, 'results');
      const resultsQuery = query(
        resultsCollection,
        where('date', '>=', start),
        where('date', '<=', end)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsData = resultsSnapshot.docs.map((doc) => doc.data());

      // Obtener resultados del mes actual
      const currentMonthStart = dayjs().startOf('month').format('YYYY-MM-DD');
      const currentMonthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
      const currentMonthQuery = query(
        resultsCollection,
        where('date', '>=', currentMonthStart),
        where('date', '<=', currentMonthEnd)
      );
      const currentMonthSnapshot = await getDocs(currentMonthQuery);
      const currentMonthResults = currentMonthSnapshot.docs.map((doc) => doc.data());

      // Filtrar resultados que involucran a los jugadores seleccionados
      const filteredResults = resultsData.filter((result) =>
        [result.pair1.player1, result.pair1.player2, result.pair2.player1, result.pair2.player2].some(
          (player) => selectedPlayers.includes(player)
        )
      );

      // Guardar el historial de partidos para la tabla
      setMatchHistory(filteredResults);

      // Aquí comienza el procesamiento de datos para generar los gráficos y estadísticas

      // Preparar datos para el Gráfico de Barras (Eficiencia del Jugador)
      const efficiencyData = {};
      selectedPlayers.forEach((playerId) => {
        efficiencyData[playerId] = {
          name: playerId,
          gamesWon: 0,
          gamesPlayed: 0,
          setsWon: 0,
          setsLost: 0,
          efficiencies: [],
        };
      });

      // Variables adicionales para nuevos insights
      let consecutiveWinsData = {}; // Para victorias consecutivas
      let winStreakData = {}; // Para rachas ganadoras de parejas

      filteredResults.forEach((result) => {
        const playersInGame = [
          result.pair1.player1,
          result.pair1.player2,
          result.pair2.player1,
          result.pair2.player2,
        ];

        // Contabilizar partidos jugados
        playersInGame.forEach((playerName) => {
          if (selectedPlayers.includes(playerName)) {
            efficiencyData[playerName].gamesPlayed += 1;
          }
        });

        // Determinar el ganador
        let pair1Wins = 0;
        let pair2Wins = 0;

        result.sets.forEach((set) => {
          if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
            pair1Wins += 1;
          } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
            pair2Wins += 1;
          }

          // Contabilizar sets ganados y perdidos
          [result.pair1.player1, result.pair1.player2].forEach((playerName) => {
            if (selectedPlayers.includes(playerName)) {
              if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
                efficiencyData[playerName].setsWon += 1;
              } else {
                efficiencyData[playerName].setsLost += 1;
              }
            }
          });
          [result.pair2.player1, result.pair2.player2].forEach((playerName) => {
            if (selectedPlayers.includes(playerName)) {
              if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
                efficiencyData[playerName].setsWon += 1;
              } else {
                efficiencyData[playerName].setsLost += 1;
              }
            }
          });
        });

        let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';
        let losingPair = pair1Wins > pair2Wins ? 'pair2' : 'pair1';

        [result[winningPair].player1, result[winningPair].player2].forEach((playerName) => {
          if (selectedPlayers.includes(playerName)) {
            efficiencyData[playerName].gamesWon += 1;

            // Actualizar racha de victorias
            if (!consecutiveWinsData[playerName]) {
              consecutiveWinsData[playerName] = { currentStreak: 1, maxStreak: 1 };
            } else {
              consecutiveWinsData[playerName].currentStreak += 1;
              if (consecutiveWinsData[playerName].currentStreak > consecutiveWinsData[playerName].maxStreak) {
                consecutiveWinsData[playerName].maxStreak = consecutiveWinsData[playerName].currentStreak;
              }
            }
          }
        });

        [result[losingPair].player1, result[losingPair].player2].forEach((playerName) => {
          if (selectedPlayers.includes(playerName)) {
            if (!consecutiveWinsData[playerName]) {
              consecutiveWinsData[playerName] = { currentStreak: 0, maxStreak: 0 };
            } else {
              consecutiveWinsData[playerName].currentStreak = 0;
            }
          }
        });

        // Actualizar datos para rachas ganadoras de parejas
        const winningPairKey = [result[winningPair].player1, result[winningPair].player2].sort().join(' & ');
        if (!winStreakData[winningPairKey]) {
          winStreakData[winningPairKey] = { currentStreak: 1, maxStreak: 1 };
        } else {
          winStreakData[winningPairKey].currentStreak += 1;
          if (winStreakData[winningPairKey].currentStreak > winStreakData[winningPairKey].maxStreak) {
            winStreakData[winningPairKey].maxStreak = winStreakData[winningPairKey].currentStreak;
          }
        }

        const losingPairKey = [result[losingPair].player1, result[losingPair].player2].sort().join(' & ');
        if (!winStreakData[losingPairKey]) {
          winStreakData[losingPairKey] = { currentStreak: 0, maxStreak: 0 };
        } else {
          winStreakData[losingPairKey].currentStreak = 0;
        }
      });

      // Preparar datos para el Gráfico de Barras (Eficiencia del Jugador)
      const barChartLabels = [];
      const barChartValues = [];
      const playerColors = {};

      Object.values(efficiencyData).forEach((playerData) => {
        barChartLabels.push(playerData.name);
        const efficiency =
          playerData.gamesPlayed > 0 ? (playerData.gamesWon / playerData.gamesPlayed) * 100 : 0;
        barChartValues.push(efficiency.toFixed(2));
        efficiencyData[playerData.name].efficiencies.push(efficiency);

        // Asignar color para jugadores seleccionados
        playerColors[playerData.name] = selectedPlayers.includes(playerData.name)
          ? 'rgba(75,192,192,0.6)'
          : 'rgba(192,192,192,0.6)';
      });

      setBarChartData({
        labels: barChartLabels,
        datasets: [
          {
            label: 'Eficiencia (%)',
            data: barChartValues,
            backgroundColor: barChartLabels.map((label) => playerColors[label]),
          },
        ],
      });

      // Preparar datos para el Gráfico de Barras Apiladas (Sets Ganados y Perdidos por Jugador)
      const stackedBarLabels = [];
      const setsWonData = [];
      const setsLostData = [];

      Object.values(efficiencyData).forEach((playerData) => {
        stackedBarLabels.push(playerData.name);
        setsWonData.push(playerData.setsWon);
        setsLostData.push(playerData.setsLost);
      });

      setStackedBarChartData({
        labels: stackedBarLabels,
        datasets: [
          {
            label: 'Sets Ganados',
            data: setsWonData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
          {
            label: 'Sets Perdidos',
            data: setsLostData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          },
        ],
      });

      // Preparar datos para el Gráfico de Rendimiento en Parejas
      const pairEfficiencyData = {};
      filteredResults.forEach((result) => {
        const pair1Key = [result.pair1.player1, result.pair1.player2].sort().join(' & ');
        const pair2Key = [result.pair2.player1, result.pair2.player2].sort().join(' & ');

        if (!pairEfficiencyData[pair1Key]) {
          pairEfficiencyData[pair1Key] = { gamesWon: 0, gamesPlayed: 0 };
        }
        if (!pairEfficiencyData[pair2Key]) {
          pairEfficiencyData[pair2Key] = { gamesWon: 0, gamesPlayed: 0 };
        }

        pairEfficiencyData[pair1Key].gamesPlayed += 1;
        pairEfficiencyData[pair2Key].gamesPlayed += 1;

        let pair1Wins = 0;
        let pair2Wins = 0;

        result.sets.forEach((set) => {
          if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
            pair1Wins += 1;
          } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
            pair2Wins += 1;
          }
        });

        if (pair1Wins > pair2Wins) {
          pairEfficiencyData[pair1Key].gamesWon += 1;
        } else {
          pairEfficiencyData[pair2Key].gamesWon += 1;
        }
      });

      const pairLabels = [];
      const pairEfficiencyValues = [];

      Object.keys(pairEfficiencyData).forEach((pairKey) => {
        const pairPlayers = pairKey.split(' & ');
        // Filtrar solo parejas con jugadores seleccionados
        if (pairPlayers.every((player) => selectedPlayers.includes(player))) {
          const data = pairEfficiencyData[pairKey];
          const efficiency = (data.gamesWon / data.gamesPlayed) * 100;
          pairLabels.push(pairKey);
          pairEfficiencyValues.push(efficiency.toFixed(2));
        }
      });

      setPairEfficiencyChartData({
        labels: pairLabels,
        datasets: [
          {
            label: 'Eficiencia (%)',
            data: pairEfficiencyValues,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
          },
        ],
      });

      // Preparar datos para el Gráfico de Pastel (Victorias por Parejas)
      const pairingWins = {};

      filteredResults.forEach((result) => {
        let pair1Wins = 0;
        let pair2Wins = 0;

        result.sets.forEach((set) => {
          if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
            pair1Wins += 1;
          } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
            pair2Wins += 1;
          }
        });

        let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';

        const winnerPairPlayers = [result[winningPair].player1, result[winningPair].player2];

        // Solo incluir si ambos jugadores están en selectedPlayers
        if (winnerPairPlayers.every((player) => selectedPlayers.includes(player))) {
          const pairKey = winnerPairPlayers.sort().join(' & ');
          pairingWins[pairKey] = (pairingWins[pairKey] || 0) + 1;
        }
      });

      const pieChartLabels = Object.keys(pairingWins);
      const pieChartValues = Object.values(pairingWins);

      setPieChartData({
        labels: pieChartLabels,
        datasets: [
          {
            data: pieChartValues,
            backgroundColor: pieChartLabels.map(
              () => `#${Math.floor(Math.random() * 16777215).toString(16)}`
            ),
          },
        ],
      });

      // Preparar datos para el Gráfico de Líneas (Tendencia de Eficiencia)
      const sortedResults = filteredResults.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

      const allDatesSet = new Set();
      sortedResults.forEach((result) => {
        if (trendInterval === 'Día') {
          allDatesSet.add(dayjs(result.date).format('YYYY-MM-DD'));
        } else if (trendInterval === 'Semana') {
          allDatesSet.add(dayjs(result.date).startOf('week').format('YYYY-MM-DD'));
        } else if (trendInterval === 'Mes') {
          allDatesSet.add(dayjs(result.date).startOf('month').format('YYYY-MM-DD'));
        }
      });
      let allDates = Array.from(allDatesSet).sort();

      const dateToResultsMap = {};
      sortedResults.forEach((result) => {
        let dateKey;
        if (trendInterval === 'Día') {
          dateKey = dayjs(result.date).format('YYYY-MM-DD');
        } else if (trendInterval === 'Semana') {
          dateKey = dayjs(result.date).startOf('week').format('YYYY-MM-DD');
        } else if (trendInterval === 'Mes') {
          dateKey = dayjs(result.date).startOf('month').format('YYYY-MM-DD');
        }

        if (!dateToResultsMap[dateKey]) {
          dateToResultsMap[dateKey] = [];
        }
        dateToResultsMap[dateKey].push(result);
      });

      allDates = Object.keys(dateToResultsMap).sort();

      const lineChartDatasets = selectedPlayers.map((playerId) => ({
        label: playerId,
        data: [],
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        fill: false,
      }));

      const cumulativeStats = {};
      selectedPlayers.forEach((playerId) => {
        cumulativeStats[playerId] = {
          gamesWon: 0,
          gamesPlayed: 0,
          lastEfficiency: 0,
        };
      });

      allDates.forEach((dateStr) => {
        const dateResults = dateToResultsMap[dateStr];

        selectedPlayers.forEach((playerId, index) => {
          let gamesWon = 0;
          let gamesPlayed = 0;

          dateResults.forEach((result) => {
            const playersInGame = [
              result.pair1.player1,
              result.pair1.player2,
              result.pair2.player1,
              result.pair2.player2,
            ];

            if (playersInGame.includes(playerId)) {
              gamesPlayed += 1;

              // Determinar el ganador
              let pair1Wins = 0;
              let pair2Wins = 0;

              result.sets.forEach((set) => {
                if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
                  pair1Wins += 1;
                } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
                  pair2Wins += 1;
                }
              });

              let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';

              if (
                result[winningPair].player1 === playerId ||
                result[winningPair].player2 === playerId
              ) {
                gamesWon += 1;
              }
            }
          });

          // Actualizar estadísticas acumuladas
          cumulativeStats[playerId].gamesPlayed += gamesPlayed;
          cumulativeStats[playerId].gamesWon += gamesWon;

          const efficiency =
            cumulativeStats[playerId].gamesPlayed > 0
              ? (cumulativeStats[playerId].gamesWon / cumulativeStats[playerId].gamesPlayed) * 100
              : cumulativeStats[playerId].lastEfficiency;

          cumulativeStats[playerId].lastEfficiency = efficiency;

          lineChartDatasets[index].data.push(efficiency.toFixed(2));
        });
      });

      const formattedDates = allDates.map((dateStr) => {
        if (trendInterval === 'Día') {
          return dayjs(dateStr).format('DD/MM/YYYY');
        } else if (trendInterval === 'Semana') {
          const startOfWeek = dayjs(dateStr).startOf('week').format('DD/MM/YYYY');
          const endOfWeek = dayjs(dateStr).endOf('week').format('DD/MM/YYYY');
          return `${startOfWeek} - ${endOfWeek}`;
        } else if (trendInterval === 'Mes') {
          return dayjs(dateStr).format('MM/YYYY');
        }
      });

      setLineChartData({
        labels: formattedDates,
        datasets: lineChartDatasets,
      });

      // Preparar datos para el Gráfico de Actividad Mensual
      const matchesPerMonth = {};

      filteredResults.forEach((result) => {
        const monthKey = dayjs(result.date).format('MMM YYYY');
        matchesPerMonth[monthKey] = (matchesPerMonth[monthKey] || 0) + 1;
      });

      // Convertir a arrays
      const monthlyLabels = Object.keys(matchesPerMonth).sort((a, b) =>
        dayjs(a, 'MMM YYYY').diff(dayjs(b, 'MMM YYYY'))
      );

      const monthlyValues = monthlyLabels.map((month) => matchesPerMonth[month]);

      setMonthlyChartData({
        labels: monthlyLabels,
        datasets: [
          {
            label: 'Partidos Jugados',
            data: monthlyValues,
            backgroundColor: 'rgba(153,102,255,0.6)',
          },
        ],
      });

      // Calcular datos del resumen
      let totalSets = 0;
      filteredResults.forEach((result) => {
        totalSets += result.sets.length;
      });

      let topPlayer = '';
      let topEfficiency = 0;
      let topPlayerWins = 0;

      Object.values(efficiencyData).forEach((playerData) => {
        const efficiency =
          playerData.gamesPlayed > 0 ? (playerData.gamesWon / playerData.gamesPlayed) * 100 : 0;

        if (efficiency > topEfficiency) {
          topEfficiency = efficiency;
          topPlayer = playerData.name;
          topPlayerWins = playerData.gamesWon;
        }
      });

      setSummaryData({
        totalSets,
        topPlayer,
        topPlayerWins,
      });

      // Generar insights para el período seleccionado
      const insightsListPeriod = [];

      if (topPlayer) {
        insightsListPeriod.push(
          `El jugador más eficiente en el período seleccionado es <strong>${topPlayer}</strong> con una eficiencia de <strong>${topEfficiency.toFixed(
            2
          )}%</strong>.`
        );
      } else {
        insightsListPeriod.push('No hay suficientes datos para determinar el jugador más eficiente.');
      }

      let mostSetsWonPlayer = '';
      let mostSetsWon = 0;

      Object.values(efficiencyData).forEach((playerData) => {
        if (playerData.setsWon > mostSetsWon) {
          mostSetsWon = playerData.setsWon;
          mostSetsWonPlayer = playerData.name;
        }
      });

      if (mostSetsWonPlayer) {
        insightsListPeriod.push(
          `Jugador con más sets ganados: <strong>${mostSetsWonPlayer}</strong>, con <strong>${mostSetsWon}</strong> sets.`
        );
      }

      let bestPlayerStreak = '';
      let bestPlayerStreakWins = 0;

      Object.entries(consecutiveWinsData).forEach(([playerName, streakData]) => {
        if (streakData.maxStreak > bestPlayerStreakWins) {
          bestPlayerStreakWins = streakData.maxStreak;
          bestPlayerStreak = playerName;
        }
      });

      if (bestPlayerStreak) {
        insightsListPeriod.push(
          `Jugador con más victorias consecutivas: <strong>${bestPlayerStreak}</strong>, con <strong>${bestPlayerStreakWins}</strong> victorias consecutivas.`
        );
      }

      setInsightsSelectedPeriod(insightsListPeriod);

      // Generar insights para el mes actual
      const insightsListCurrentMonth = [];

      const efficiencyDataCurrentMonth = {};
      selectedPlayers.forEach((playerId) => {
        efficiencyDataCurrentMonth[playerId] = {
          name: playerId,
          gamesWon: 0,
          gamesPlayed: 0,
        };
      });

      currentMonthResults.forEach((result) => {
        const playersInGame = [
          result.pair1.player1,
          result.pair1.player2,
          result.pair2.player1,
          result.pair2.player2,
        ];

        playersInGame.forEach((playerName) => {
          if (selectedPlayers.includes(playerName)) {
            efficiencyDataCurrentMonth[playerName].gamesPlayed += 1;
          }
        });

        let pair1Wins = 0;
        let pair2Wins = 0;

        result.sets.forEach((set) => {
          if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
            pair1Wins += 1;
          } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
            pair2Wins += 1;
          }
        });

        let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';

        [result[winningPair].player1, result[winningPair].player2].forEach((playerName) => {
          if (selectedPlayers.includes(playerName)) {
            efficiencyDataCurrentMonth[playerName].gamesWon += 1;
          }
        });
      });

      let topRecentPlayer = '';
      let topRecentEfficiency = 0;

      Object.values(efficiencyDataCurrentMonth).forEach((playerData) => {
        const efficiency =
          playerData.gamesPlayed > 0 ? (playerData.gamesWon / playerData.gamesPlayed) * 100 : 0;
        if (efficiency > topRecentEfficiency) {
          topRecentEfficiency = efficiency;
          topRecentPlayer = playerData.name;
        }
      });

      if (topRecentPlayer) {
        insightsListCurrentMonth.push(
          `El jugador más eficiente del mes actual es <strong>${topRecentPlayer}</strong> con una eficiencia de <strong>${topRecentEfficiency.toFixed(
            2
          )}%</strong>.`
        );
      } else {
        insightsListCurrentMonth.push(
          'No hay suficientes datos para determinar el jugador más eficiente del mes actual.'
        );
      }

      setInsightsCurrentMonth(insightsListCurrentMonth);
    };

    fetchData();
  }, [selectedPlayers, startDate, endDate, players, trendInterval]);

  // Manejo de eventos
  const handlePlayerChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedPlayers(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTrendIntervalChange = (event) => {
    setTrendInterval(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Función para exportar gráficos como imagen
  const exportChartAsImage = async (chartRef, chartName) => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    canvas.toBlob((blob) => {
      saveAs(blob, `${chartName}.png`);
    });
  };

  // Opciones para los gráficos
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Eficiencia (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Jugadores',
        },
      },
    },
  };

  const stackedBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Sets',
        },
        stacked: true,
      },
      x: {
        title: {
          display: true,
          text: 'Jugadores',
        },
        stacked: true,
      },
    },
  };

  const pairEfficiencyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Eficiencia (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Parejas',
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Eficiencia (%)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Fechas',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Partidos Jugados',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Meses',
        },
      },
    },
  };

  // Función para filtrar y buscar en la tabla de historial
  const filteredMatchHistory = matchHistory.filter((match) => {
    const search = searchText.toLowerCase();
    return (
      match.pair1.player1.toLowerCase().includes(search) ||
      match.pair1.player2.toLowerCase().includes(search) ||
      match.pair2.player1.toLowerCase().includes(search) ||
      match.pair2.player2.toLowerCase().includes(search)
    );
  });

  return (
    <Container maxWidth="lg" sx={{ marginTop: '20px' }}>
      {/* Encabezado "Estadísticas Avanzadas" */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center' }}>
        <Typography variant="h5">Estadísticas Avanzadas</Typography>
      </Box>

      {/* Date Range Pickers */}
      <Box sx={{ marginBottom: '20px', marginTop: '20px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3} md={2}>
            <DatePicker
              label="Fecha de Inicio"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              inputFormat="DD/MM/YYYY"
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <DatePicker
              label="Fecha Final"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              inputFormat="DD/MM/YYYY"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Navegación Simplificada con Tabs */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="fullWidth"
        aria-label="Tabs de navegación"
        sx={{
          marginBottom: '20px',
          '& .MuiTabs-indicator': {
            transition: 'all 0.3s',
          },
        }}
      >
        <Tab label="Resumen" />
        <Tab label="Gráficos" />
        <Tab label="Historial de Partidos" />
      </Tabs>

      {/* Popover para Tooltips */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Typography sx={{ p: 2 }}>{popoverContent}</Typography>
      </Popover>

      {/* Contenido de las Tabs */}
      <TransitionGroup>
        {tabIndex === 0 && (
          <Fade in timeout={500}>
            <Box sx={{ marginTop: '20px' }}>
              {/* Resumen */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  {/* Tooltip adaptado para móviles */}
                  <Box
                    sx={{
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      padding: '10px',
                      borderRadius: '8px',
                      position: 'relative',
                    }}
                  >
                    <Typography variant="h6">
                      Total de Sets Jugados
                      <IconButton
                        size="small"
                        onClick={(e) =>
                          handlePopoverOpen(
                            e,
                            'Número total de sets jugados en el rango seleccionado.'
                          )
                        }
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Typography>
                    <Typography variant="h4">{summaryData.totalSets}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      padding: '10px',
                      borderRadius: '8px',
                      position: 'relative',
                    }}
                  >
                    <Typography variant="h6">
                      Rendimiento Máximo
                      <IconButton
                        size="small"
                        onClick={(e) =>
                          handlePopoverOpen(
                            e,
                            'Jugador con el mayor porcentaje de victorias acumuladas dentro del rango de fechas seleccionado.'
                          )
                        }
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Typography>
                    <Typography variant="h4">{summaryData.topPlayer}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      border: '1px solid #ccc',
                      padding: '10px',
                      borderRadius: '8px',
                      position: 'relative',
                    }}
                  >
                    <Typography variant="h6">
                      Partidos Ganados
                      <IconButton
                        size="small"
                        onClick={(e) =>
                          handlePopoverOpen(
                            e,
                            `Cantidad de partidos ganados por el jugador con el mejor rendimiento: ${summaryData.topPlayer}.`
                          )
                        }
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Typography>
                    <Typography variant="h4">{summaryData.topPlayerWins}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Panel de Insights */}
              <Box sx={{ marginTop: '20px' }}>
                {/* Insights del período seleccionado */}
                <Typography variant="h6" gutterBottom>
                  Insights del Período Seleccionado ({startDate.format('DD/MM/YYYY')} -{' '}
                  {endDate.format('DD/MM/YYYY')})
                </Typography>
                <Divider sx={{ marginBottom: '10px' }} />
                {isSmallScreen ? (
                  <TransitionGroup>
                    {insightsSelectedPeriod.map((insight, index) => (
                      <Fade in timeout={500} key={index}>
                        <Card sx={{ marginBottom: '10px' }}>
                          <CardContent>
                            <Typography
                              variant="body1"
                              component="div"
                              dangerouslySetInnerHTML={{ __html: insight }}
                            />
                          </CardContent>
                        </Card>
                      </Fade>
                    ))}
                  </TransitionGroup>
                ) : (
                  <Paper sx={{ padding: '10px' }}>
                    <ul style={{ paddingLeft: '20px' }}>
                      {insightsSelectedPeriod.map((insight, index) => (
                        <li key={index}>
                          <Typography
                            variant="body1"
                            component="div"
                            dangerouslySetInnerHTML={{ __html: insight }}
                          />
                        </li>
                      ))}
                    </ul>
                  </Paper>
                )}

                {/* Insights del mes actual */}
                <Typography variant="h6" gutterBottom sx={{ marginTop: '20px' }}>
                  Insights del Mes Actual
                </Typography>
                <Divider sx={{ marginBottom: '10px' }} />
                {isSmallScreen ? (
                  <TransitionGroup>
                    {insightsCurrentMonth.map((insight, index) => (
                      <Fade in timeout={500} key={index}>
                        <Card sx={{ marginBottom: '10px' }}>
                          <CardContent>
                            <Typography
                              variant="body1"
                              component="div"
                              dangerouslySetInnerHTML={{ __html: insight }}
                            />
                          </CardContent>
                        </Card>
                      </Fade>
                    ))}
                  </TransitionGroup>
                ) : (
                  <Paper sx={{ padding: '10px' }}>
                    <ul style={{ paddingLeft: '20px' }}>
                      {insightsCurrentMonth.map((insight, index) => (
                        <li key={index}>
                          <Typography
                            variant="body1"
                            component="div"
                            dangerouslySetInnerHTML={{ __html: insight }}
                          />
                        </li>
                      ))}
                    </ul>
                  </Paper>
                )}
              </Box>
            </Box>
          </Fade>
        )}

        {/* TAB 1: Gráficos */}
        {tabIndex === 1 && (
          <Fade in timeout={500}>
            <Box sx={{ marginTop: '20px' }}>
              {/* Filtros */}
              <Box sx={{ marginBottom: '20px' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                      <InputLabel id="player-select-label">Seleccionar Jugadores</InputLabel>
                      <Select
                        labelId="player-select-label"
                        id="player-select"
                        multiple
                        value={selectedPlayers}
                        onChange={handlePlayerChange}
                        input={<OutlinedInput label="Seleccionar Jugadores" />}
                        renderValue={(selected) => selected.join(', ')}
                      >
                        {players.map((player) => (
                          <MenuItem key={player.id} value={player.id}>
                            <Checkbox checked={selectedPlayers.indexOf(player.id) > -1} />
                            <ListItemText primary={player.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <DatePicker
                      label="Fecha de Inicio"
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      inputFormat="DD/MM/YYYY"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3} md={2}>
                    <DatePicker
                      label="Fecha Final"
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                      inputFormat="DD/MM/YYYY"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Indicar periodo de tiempo */}
              <Typography variant="subtitle1" gutterBottom>
                Gráficos para el rango de fechas seleccionado:{' '}
                <strong>
                  {startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')}
                </strong>
              </Typography>

              {/* Gráficos */}
              <Grid container spacing={4}>
                {/* Gráfico de Barras: Eficiencia de los Jugadores */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Eficiencia de los Jugadores (%)
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handlePopoverOpen(
                          e,
                          'Este gráfico muestra la eficiencia de los jugadores seleccionados en términos de porcentaje de victorias.'
                        )
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Box sx={{ position: 'relative', height: isSmallScreen ? '300px' : '500px' }}>
                    {barChartData ? (
                      <>
                        <Box ref={chartRefs.barChart} sx={{ height: '100%' }}>
                          <Bar data={barChartData} options={barChartOptions} />
                        </Box>
                        <IconButton
                          onClick={() => exportChartAsImage(chartRefs.barChart, 'Eficiencia_Jugadores')}
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </>
                    ) : (
                      <p>No hay datos disponibles para el Gráfico de Barras.</p>
                    )}
                  </Box>
                </Grid>

                {/* Gráfico de Barras Apiladas: Sets Ganados y Perdidos */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Sets Ganados y Perdidos por Jugador
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handlePopoverOpen(
                          e,
                          'Este gráfico muestra el número de sets ganados y perdidos por cada jugador.'
                        )
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Box sx={{ position: 'relative', height: isSmallScreen ? '300px' : '500px' }}>
                    {stackedBarChartData ? (
                      <>
                        <Box ref={chartRefs.stackedBarChart} sx={{ height: '100%' }}>
                          <Bar data={stackedBarChartData} options={stackedBarChartOptions} />
                        </Box>
                        <IconButton
                          onClick={() =>
                            exportChartAsImage(chartRefs.stackedBarChart, 'Sets_Ganados_Perdidos')
                          }
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </>
                    ) : (
                      <p>No hay datos disponibles para el Gráfico de Barras Apiladas.</p>
                    )}
                  </Box>
                </Grid>

                {/* Gráfico de Tendencia de Eficiencia Acumulada */}
                <Grid item xs={12}>
                  {/* Mover el selector de intervalo de tendencia aquí */}
                  <FormControl fullWidth sx={{ marginBottom: '10px' }}>
                    <InputLabel id="trend-interval-label">Intervalo de Tendencia</InputLabel>
                    <Select
                      labelId="trend-interval-label"
                      id="trend-interval-select"
                      value={trendInterval}
                      onChange={handleTrendIntervalChange}
                      label="Intervalo de Tendencia"
                    >
                      <MenuItem value="Día">Día</MenuItem>
                      <MenuItem value="Semana">Semana</MenuItem>
                      <MenuItem value="Mes">Mes</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="h6" gutterBottom>
                    Tendencia de Eficiencia Acumulada
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handlePopoverOpen(
                          e,
                          'Este gráfico muestra la tendencia de eficiencia acumulada de los jugadores a lo largo del tiempo.'
                        )
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Box sx={{ position: 'relative', height: isSmallScreen ? '300px' : '500px' }}>
                    {lineChartData ? (
                      <>
                        <Box ref={chartRefs.lineChart} sx={{ height: '100%' }}>
                          <Line data={lineChartData} options={lineChartOptions} />
                        </Box>
                        <IconButton
                          onClick={() => exportChartAsImage(chartRefs.lineChart, 'Tendencia_Eficiencia')}
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </>
                    ) : (
                      <p>No hay datos disponibles para el Gráfico de Líneas.</p>
                    )}
                  </Box>
                </Grid>

                {/* Gráfico de Rendimiento en Parejas */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Rendimiento de las Parejas
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handlePopoverOpen(
                          e,
                          'Este gráfico muestra la eficiencia de cada pareja de jugadores.'
                        )
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Box sx={{ position: 'relative', height: isSmallScreen ? '300px' : '500px' }}>
                    {pairEfficiencyChartData ? (
                      <>
                        <Box ref={chartRefs.pairEfficiencyChart} sx={{ height: '100%' }}>
                          <Bar data={pairEfficiencyChartData} options={pairEfficiencyChartOptions} />
                        </Box>
                        <IconButton
                          onClick={() =>
                            exportChartAsImage(chartRefs.pairEfficiencyChart, 'Rendimiento_Parejas')
                          }
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </>
                    ) : (
                      <p>No hay datos disponibles para el Gráfico de Rendimiento en Parejas.</p>
                    )}
                  </Box>
                </Grid>

                {/* Gráfico de Pastel: Victorias por Parejas */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Victorias por Parejas
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handlePopoverOpen(
                          e,
                          'Este gráfico muestra la distribución de victorias entre las diferentes parejas.'
                        )
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Box sx={{ position: 'relative', height: isSmallScreen ? '300px' : '500px' }}>
                    {pieChartData ? (
                      <>
                        <Box ref={chartRefs.pieChart} sx={{ height: '100%' }}>
                          <Pie data={pieChartData} options={pieChartOptions} />
                        </Box>
                        <IconButton
                          onClick={() => exportChartAsImage(chartRefs.pieChart, 'Victorias_Parejas')}
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </>
                    ) : (
                      <p>No hay datos disponibles para el Gráfico de Pastel.</p>
                    )}
                  </Box>
                </Grid>

                {/* Gráfico Mensual: Partidos Jugados por Mes */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Partidos Jugados por Mes
                    <IconButton
                      size="small"
                      onClick={(e) =>
                        handlePopoverOpen(
                          e,
                          'Este gráfico muestra el número de partidos jugados en cada mes.'
                        )
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Box sx={{ position: 'relative', height: isSmallScreen ? '300px' : '500px' }}>
                    {monthlyChartData ? (
                      <>
                        <Box ref={chartRefs.monthlyChart} sx={{ height: '100%' }}>
                          <Bar data={monthlyChartData} options={monthlyChartOptions} />
                        </Box>
                        <IconButton
                          onClick={() => exportChartAsImage(chartRefs.monthlyChart, 'Partidos_Por_Mes')}
                          sx={{ position: 'absolute', top: 0, right: 0 }}
                        >
                          <FileDownloadIcon />
                        </IconButton>
                      </>
                    ) : (
                      <p>No hay datos disponibles para el Gráfico de Actividad Mensual.</p>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}

        {/* TAB 2: Historial de Partidos */}
        {tabIndex === 2 && (
          <Fade in timeout={500}>
            <Box sx={{ marginTop: '20px' }}>
              {/* Historial de Partidos */}
              <Typography variant="h6" gutterBottom>
                Historial de Partidos
              </Typography>

              {/* Barra de búsqueda */}
              <Box sx={{ marginBottom: '10px' }}>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Buscar por jugador..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {isSmallScreen ? (
                // Mostrar como tarjetas en móvil
                <Grid container spacing={2}>
                  {filteredMatchHistory
                    .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
                    .map((match, index) => {
                      // Determinar el ganador
                      let pair1Wins = 0;
                      let pair2Wins = 0;

                      match.sets.forEach((set) => {
                        if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
                          pair1Wins += 1;
                        } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
                          pair2Wins += 1;
                        }
                      });

                      let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';
                      const winnerPlayers = [
                        match[winningPair].player1,
                        match[winningPair].player2,
                      ].join(' & ');

                      return (
                        <Grid item xs={12} key={index}>
                          <Card>
                            <CardContent>
                              <Typography variant="subtitle1">
                                Fecha: {dayjs(match.date).format('DD/MM/YYYY')}
                              </Typography>
                              <Typography variant="body1">
                                Pareja 1: {match.pair1.player1} & {match.pair1.player2}
                              </Typography>
                              <Typography variant="body1">
                                Pareja 2: {match.pair2.player1} & {match.pair2.player2}
                              </Typography>
                              <Typography variant="body1">
                                Ganadores: <strong>{winnerPlayers}</strong>
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                </Grid>
              ) : (
                // Mostrar como tabla en escritorio
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Pareja 1</TableCell>
                        <TableCell>Pareja 2</TableCell>
                        <TableCell>Ganadores</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMatchHistory
                        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
                        .map((match, index) => {
                          // Determinar el ganador
                          let pair1Wins = 0;
                          let pair2Wins = 0;

                          match.sets.forEach((set) => {
                            if (parseInt(set.pair1Score) > parseInt(set.pair2Score)) {
                              pair1Wins += 1;
                            } else if (parseInt(set.pair2Score) > parseInt(set.pair1Score)) {
                              pair2Wins += 1;
                            }
                          });

                          let winningPair = pair1Wins > pair2Wins ? 'pair1' : 'pair2';
                          const winnerPlayers = [
                            match[winningPair].player1,
                            match[winningPair].player2,
                          ].join(' & ');

                          return (
                            <TableRow key={index}>
                              <TableCell>{dayjs(match.date).format('DD/MM/YYYY')}</TableCell>
                              <TableCell>
                                {match.pair1.player1} & {match.pair1.player2}
                              </TableCell>
                              <TableCell>
                                {match.pair2.player1} & {match.pair2.player2}
                              </TableCell>
                              <TableCell>
                                <strong>{winnerPlayers}</strong>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Fade>
        )}
      </TransitionGroup>

      {/* Botón de Volver a Página Principal */}
      <Box sx={{ marginTop: '20px', textAlign: 'center' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '&:hover': {
              backgroundColor: '#333',
            },
          }}
          onClick={() => navigate('/')}
        >
          Volver a Página Principal
        </Button>
      </Box>
    </Container>
  );
};

export default StatsCharts;