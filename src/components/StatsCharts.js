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
  Tooltip,
  Pagination,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Idioma español
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { TransitionGroup } from 'react-transition-group';

dayjs.locale('es');

// Función para exportar gráficos como imagen
const exportChartAsImage = async (chartRef, chartName) => {
  if (!chartRef.current) return;
  const canvas = await html2canvas(chartRef.current);
  canvas.toBlob((blob) => {
    saveAs(blob, `${chartName}.png`);
  });
};

// Opciones de los gráficos
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Eficiencia (%)' } },
    x: { title: { display: true, text: 'Jugadores' } },
  },
};

const stackedBarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Número de Sets' }, stacked: true },
    x: { title: { display: true, text: 'Jugadores' }, stacked: true },
  },
};

const pairEfficiencyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Eficiencia (%)' } },
    x: { title: { display: true, text: 'Parejas' } },
  },
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, max: 100, title: { display: true, text: 'Eficiencia (%)' } },
    x: { title: { display: true, text: 'Fechas' } },
  },
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: 'bottom' } },
};

const monthlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Partidos Jugados' } },
    x: { title: { display: true, text: 'Meses' } },
  },
};

const StatsCharts = () => {
  const [players] = useState([
    { id: 'Lucas', name: 'Lucas' },
    { id: 'Bort', name: 'Bort' },
    { id: 'Martin', name: 'Martin' },
    { id: 'Ricardo', name: 'Ricardo' },
  ]);
  const [selectedPlayers, setSelectedPlayers] = useState(['Lucas', 'Bort', 'Martin', 'Ricardo']);

  // Estado para rango de fechas principal (mes-año)
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));

  // Estados para gráficos
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

  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Popover para Tooltips
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

  // Refs para exportar gráficos
  const chartRefs = {
    barChart: useRef(null),
    stackedBarChart: useRef(null),
    lineChart: useRef(null),
    pairEfficiencyChart: useRef(null),
    pieChart: useRef(null),
    monthlyChart: useRef(null),
  };

  // Filtros en Historial
  const [searchPlayerFilter, setSearchPlayerFilter] = useState('');
  const [searchPairFilter, setSearchPairFilter] = useState('');

  // Resultados del mes anterior
  const [lastMonthResults, setLastMonthResults] = useState([]);

  // Paginación Historial
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Renderizar insights con tooltips especiales
  const renderInsight = (insight) => {
    let showDiffTooltip = false;
    let showAjustadoTooltip = false;

    if (insight.includes('Diferencia promedio de sets')) {
      showDiffTooltip = true;
    }
    if (insight.includes('Partido más ajustado')) {
      showAjustadoTooltip = true;
    }

    return (
      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
        <span dangerouslySetInnerHTML={{ __html: insight }}></span>
        {showDiffTooltip && (
          <IconButton
            size="small"
            onClick={(e) =>
              handlePopoverOpen(
                e,
                'Representa la diferencia promedio entre sets ganados y perdidos por un jugador en el período seleccionado.'
              )
            }
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        )}
        {showAjustadoTooltip && (
          <IconButton
            size="small"
            onClick={(e) =>
              handlePopoverOpen(
                e,
                'Es el partido con la menor diferencia total de puntos entre los sets, considerando la ponderación por el número de sets jugados.'
              )
            }
          >
            <InfoIcon fontSize="small" />
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
      const lastMonthQuery = query(
        resultsCollection,
        where('date', '>=', lastMonthStart),
        where('date', '<=', lastMonthEnd)
      );
      const lastMonthSnapshot = await getDocs(lastMonthQuery);
      const lResults = lastMonthSnapshot.docs.map((doc) => doc.data());
      setLastMonthResults(lResults);
    };
    fetchLastMonth();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPlayers.length === 0 || players.length === 0) return;

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
          result.pair1.player1,
          result.pair1.player2,
          result.pair2.player1,
          result.pair2.player2,
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

        let pair1Wins = 0;
        let pair2Wins = 0;
        let matchDifference = 0;
        const setsCount = result.sets.length;

        result.sets.forEach((set) => {
          const s1 = parseInt(set.pair1Score, 10);
          const s2 = parseInt(set.pair2Score, 10);
          if (s1 > s2) pair1Wins++;
          else if (s2 > s1) pair2Wins++;

          [result.pair1.player1, result.pair1.player2].forEach((pl) => {
            if (selectedPlayers.includes(pl)) {
              if (s1 > s2) efficiencyData[pl].setsWon++;
              else efficiencyData[pl].setsLost++;
            }
          });
          [result.pair2.player1, result.pair2.player2].forEach((pl) => {
            if (selectedPlayers.includes(pl)) {
              if (s2 > s1) efficiencyData[pl].setsWon++;
              else efficiencyData[pl].setsLost++;
            }
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
              if (consecutiveWinsData[pl].currentStreak > consecutiveWinsData[pl].maxStreak)
                consecutiveWinsData[pl].maxStreak = consecutiveWinsData[pl].currentStreak;
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
          if (winStreakData[winningPairKey].currentStreak > winStreakData[winningPairKey].maxStreak)
            winStreakData[winningPairKey].maxStreak = winStreakData[winningPairKey].currentStreak;
        }

        const losingPairKey = [result[losingPair].player1, result[losingPair].player2].sort().join(' & ');
        if (!winStreakData[losingPairKey]) winStreakData[losingPairKey] = { currentStreak: 0, maxStreak: 0 };
        else winStreakData[losingPairKey].currentStreak = 0;

        const score = matchDifference / setsCount;

        if (score < bestScore) {
          bestScore = score;
          bestMatches = [{ match: result, setsCount, difference: matchDifference, score }];
        } else if (Math.abs(score - bestScore) < 0.0001) {
          const bestCurrentSetsCount = bestMatches[0].setsCount;
          if (setsCount > bestCurrentSetsCount) {
            bestMatches = [{ match: result, setsCount, difference: matchDifference, score }];
          } else if (setsCount === bestCurrentSetsCount) {
            bestMatches.push({ match: result, setsCount, difference: matchDifference, score });
          }
        }
      });

      // Preparar datos para gráficos
      const barChartLabels = [];
      const barChartValues = [];
      const playerColors = {};
      let topEfficiency = 0;
      let allPlayersEfficiency = {};

      Object.values(efficiencyData).forEach((p) => {
        const eff = p.gamesPlayed > 0 ? (p.gamesWon / p.gamesPlayed) * 100 : 0;
        barChartLabels.push(p.name);
        barChartValues.push(eff.toFixed(2));
        playerColors[p.name] = selectedPlayers.includes(p.name)
          ? 'rgba(75,192,192,0.6)'
          : 'rgba(192,192,192,0.6)';
        allPlayersEfficiency[p.name] = eff;
        if (eff > topEfficiency) {
          topEfficiency = eff;
        }
      });

      const maxEffPlayers = Object.keys(allPlayersEfficiency).filter(pl => allPlayersEfficiency[pl] === topEfficiency);
      let firstTopWins = 0;
      if (maxEffPlayers.length > 0) {
        firstTopWins = efficiencyData[maxEffPlayers[0]].gamesWon;
      }

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

      // Sets ganados/perdidos
      const stackedBarLabels = [];
      const setsWonData = [];
      const setsLostData = [];
      Object.values(efficiencyData).forEach((pl) => {
        stackedBarLabels.push(pl.name);
        setsWonData.push(pl.setsWon);
        setsLostData.push(pl.setsLost);
      });

      setStackedBarChartData({
        labels: stackedBarLabels,
        datasets: [
          { label: 'Sets Ganados', data: setsWonData, backgroundColor: 'rgba(54,162,235,0.6)' },
          { label: 'Sets Perdidos', data: setsLostData, backgroundColor: 'rgba(255,99,132,0.6)' },
        ],
      });

      // Rendimiento en parejas
      const pairEfficiencyDataMap = {};
      filteredResults.forEach((res) => {
        const p1 = [res.pair1.player1, res.pair1.player2].sort().join(' & ');
        const p2 = [res.pair2.player1, res.pair2.player2].sort().join(' & ');
        if (!pairEfficiencyDataMap[p1]) pairEfficiencyDataMap[p1] = { gamesWon: 0, gamesPlayed: 0 };
        if (!pairEfficiencyDataMap[p2]) pairEfficiencyDataMap[p2] = { gamesWon: 0, gamesPlayed: 0 };
        pairEfficiencyDataMap[p1].gamesPlayed++;
        pairEfficiencyDataMap[p2].gamesPlayed++;

        let p1w=0,p2w=0;
        res.sets.forEach((s)=>{
          const s1=parseInt(s.pair1Score,10), s2=parseInt(s.pair2Score,10);
          if(s1>s2)p1w++;else if(s2>s1)p2w++;
        });
        if(p1w>p2w) pairEfficiencyDataMap[p1].gamesWon++;
        else pairEfficiencyDataMap[p2].gamesWon++;
      });

      const pairLabels = [];
      const pairEfficiencyValues = [];
      Object.keys(pairEfficiencyDataMap).forEach((pairKey) => {
        const pairPlayers = pairKey.split(' & ');
        if (pairPlayers.every((pl) => selectedPlayers.includes(pl))) {
          const d = pairEfficiencyDataMap[pairKey];
          const eff = (d.gamesWon/d.gamesPlayed)*100;
          pairLabels.push(pairKey);
          pairEfficiencyValues.push(eff.toFixed(2));
        }
      });

      setPairEfficiencyChartData({
        labels: pairLabels,
        datasets: [
          { label: 'Eficiencia (%)', data: pairEfficiencyValues, backgroundColor: 'rgba(255,159,64,0.6)' },
        ],
      });

      // Pastel victorias parejas
      const pairingWins = {};
      filteredResults.forEach((res)=>{
        let p1w=0,p2w=0;
        res.sets.forEach((s)=>{
          const s1=parseInt(s.pair1Score,10), s2=parseInt(s.pair2Score,10);
          if(s1>s2)p1w++;else if(s2>s1)p2w++;
        });
        const wPair=p1w>p2w?'pair1':'pair2';
        const wp=[res[wPair].player1,res[wPair].player2];
        if(wp.every(pl=>selectedPlayers.includes(pl))){
          const key=wp.sort().join(' & ');
          pairingWins[key]=(pairingWins[key]||0)+1;
        }
      });

      const pieChartLabels = Object.keys(pairingWins);
      const pieChartValues = Object.values(pairingWins);

      setPieChartData({
        labels:pieChartLabels,
        datasets:[
          {
            data:pieChartValues,
            backgroundColor: pieChartLabels.map(()=> `#${Math.floor(Math.random()*16777215).toString(16)}`),
          },
        ],
      });

      // Tendencia
      const sortedByDate = filteredResults.sort((a,b)=>dayjs(a.date).diff(dayjs(b.date)));
      const allDatesSetLine = new Set();
      sortedByDate.forEach((r)=>{
        if(trendInterval==='Día') allDatesSetLine.add(dayjs(r.date).format('YYYY-MM-DD'));
        else if(trendInterval==='Semana') allDatesSetLine.add(dayjs(r.date).startOf('week').format('YYYY-MM-DD'));
        else if(trendInterval==='Mes') allDatesSetLine.add(dayjs(r.date).startOf('month').format('YYYY-MM-DD'));
      });

      const allDatesLine=Array.from(allDatesSetLine).sort();
      const dateToResultsMapLine={};
      sortedByDate.forEach((r)=>{
        let dKey;
        if(trendInterval==='Día') dKey=dayjs(r.date).format('YYYY-MM-DD');
        else if(trendInterval==='Semana') dKey=dayjs(r.date).startOf('week').format('YYYY-MM-DD');
        else dKey=dayjs(r.date).startOf('month').format('YYYY-MM-DD');

        if(!dateToResultsMapLine[dKey])dateToResultsMapLine[dKey]=[];
        dateToResultsMapLine[dKey].push(r);
      });

      const lineChartDatasets=selectedPlayers.map((pid)=>({
        label:pid,
        data:[],
        borderColor:`#${Math.floor(Math.random()*16777215).toString(16)}`,
        fill:false,
      }));

      const cumulativeStats={};
      selectedPlayers.forEach((pid)=>{
        cumulativeStats[pid]={gamesWon:0,gamesPlayed:0,lastEfficiency:0};
      });

      allDatesLine.forEach((dStr)=>{
        const dResults=dateToResultsMapLine[dStr];
        selectedPlayers.forEach((pid,idx)=>{
          let gw=0,gp=0;
          dResults.forEach((rr)=>{
            const pGame=[rr.pair1.player1,rr.pair1.player2,rr.pair2.player1,rr.pair2.player2];
            if(pGame.includes(pid)){
              gp++;
              let p1w=0,p2w=0;
              rr.sets.forEach((ss)=>{
                const s1=parseInt(ss.pair1Score,10), s2=parseInt(ss.pair2Score,10);
                if(s1>s2)p1w++;else if(s2>s1)p2w++;
              });
              const wPair=p1w>p2w?'pair1':'pair2';
              if(rr[wPair].player1===pid||rr[wPair].player2===pid)gw++;
            }
          });

          cumulativeStats[pid].gamesPlayed+=gp;
          cumulativeStats[pid].gamesWon+=gw;
          const eff=cumulativeStats[pid].gamesPlayed>0?(cumulativeStats[pid].gamesWon/cumulativeStats[pid].gamesPlayed)*100:cumulativeStats[pid].lastEfficiency;
          cumulativeStats[pid].lastEfficiency=eff;
          lineChartDatasets[idx].data.push(eff.toFixed(2));
        });
      });

      const formattedDates=allDatesLine.map((dStr)=>{
        if(trendInterval==='Día') return dayjs(dStr).format('DD/MM/YYYY');
        else if(trendInterval==='Semana'){
          const sw=dayjs(dStr).startOf('week').format('DD/MM/YYYY');
          const ew=dayjs(dStr).endOf('week').format('DD/MM/YYYY');
          return `${sw} - ${ew}`;
        } else {
          return dayjs(dStr).format('MM/YYYY');
        }
      });

      setLineChartData({ labels:formattedDates, datasets:lineChartDatasets });

      // Partidos por mes
      const matchesPerMonth={};
      filteredResults.forEach((r)=>{
        const mk=dayjs(r.date).format('MMM YYYY');
        matchesPerMonth[mk]=(matchesPerMonth[mk]||0)+1;
      });
      const monthlyLabels=Object.keys(matchesPerMonth).sort((a,b)=>dayjs(a,'MMM YYYY').diff(dayjs(b,'MMM YYYY')));
      const monthlyValues=monthlyLabels.map((m)=>matchesPerMonth[m]);
      setMonthlyChartData({
        labels:monthlyLabels,
        datasets:[{label:'Partidos Jugados',data:monthlyValues,backgroundColor:'rgba(153,102,255,0.6)'}]
      });

      let totalSets=0;
      filteredResults.forEach((r)=>{totalSets+=r.sets.length;});

      // Hallar jugadores empatados en top eficiencia ya se hizo
      // maxEffPlayers, topEfficiency ya calculados
      // firstTopWins calculado

      setSummaryData({
        totalSets,
        topPlayers: maxEffPlayers,
        topPlayerWins: firstTopWins,
      });

      // Calcular maxSetsLost, playersMaxSetsLost
      let maxSetsLost=0; let playersMaxSetsLost=[];
      Object.values(efficiencyData).forEach((p)=>{
        if(p.setsLost>maxSetsLost){
          maxSetsLost=p.setsLost;playersMaxSetsLost=[p.name];
        } else if(p.setsLost===maxSetsLost && maxSetsLost>0){
          playersMaxSetsLost.push(p.name);
        }
      });

      let maxSetsWon=0; let playersMaxSetsWon=[];
      Object.values(efficiencyData).forEach((p)=>{
        if(p.setsWon>maxSetsWon){
          maxSetsWon=p.setsWon;playersMaxSetsWon=[p.name];
        } else if(p.setsWon===maxSetsWon && maxSetsWon>0){
          playersMaxSetsWon.push(p.name);
        }
      });

      let maxStreak=0; let playersMaxStreak=[];
      Object.entries(consecutiveWinsData).forEach(([pl,st])=>{
        if(st.maxStreak>maxStreak){
          maxStreak=st.maxStreak;playersMaxStreak=[pl];
        } else if(st.maxStreak===maxStreak && maxStreak>0){
          playersMaxStreak.push(pl);
        }
      });

      let maxMatches=0; let mostActivePairs=[];
      Object.entries(pairMatchesCount).forEach(([pairKey,cnt])=>{
        if(cnt>maxMatches){
          maxMatches=cnt;mostActivePairs=[pairKey];
        } else if(cnt===maxMatches && maxMatches>0){
          mostActivePairs.push(pairKey);
        }
      });

      // diffInsights
      let diffInsights=[];
      maxEffPlayers.forEach((pl)=>{
        const p=efficiencyData[pl];
        const diff=(p.setsWon-p.setsLost)/(p.gamesPlayed||1);
        const sign=diff>0?`+${diff.toFixed(1)}`:diff.toFixed(1);
        diffInsights.push(`Diferencia promedio de sets para ${pl}: ${sign}.`);
      });

      // Eficiencia mes actual vs mes anterior
      const efficiencyThisMonth={};
      selectedPlayers.forEach((p)=>{efficiencyThisMonth[p]={gamesWon:0,gamesPlayed:0}});

      currentMonthResults.forEach((r)=>{
        const pGame=[r.pair1.player1,r.pair1.player2,r.pair2.player1,r.pair2.player2];
        let p1w=0,p2w=0;
        r.sets.forEach((s)=>{
          const s1=parseInt(s.pair1Score,10), s2=parseInt(s.pair2Score,10);
          if(s1>s2)p1w++;else if(s2>s1)p2w++;
        });
        const wPair=p1w>p2w?'pair1':'pair2';

        pGame.forEach(pl=>{
          if(selectedPlayers.includes(pl)) efficiencyThisMonth[pl].gamesPlayed++;
        });
        [r[wPair].player1,r[wPair].player2].forEach(pl=>{
          if(selectedPlayers.includes(pl)) efficiencyThisMonth[pl].gamesWon++;
        });
      });

      const effThisMonth={};
      Object.keys(efficiencyThisMonth).forEach(pl=>{
        const d=efficiencyThisMonth[pl];
        effThisMonth[pl]=d.gamesPlayed>0?(d.gamesWon/d.gamesPlayed)*100:0;
      });

      const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
      const efficiencyLastMonth={};
      selectedPlayers.forEach((p)=>{efficiencyLastMonth[p]={gamesWon:0,gamesPlayed:0}});

      lastMonthResults.forEach((r)=>{
        const pGame=[r.pair1.player1,r.pair1.player2,r.pair2.player1,r.pair2.player2];
        let p1w=0,p2w=0;
        r.sets.forEach((s)=>{
          const s1=parseInt(s.pair1Score,10), s2=parseInt(s.pair2Score,10);
          if(s1>s2)p1w++;else if(s2>s1)p2w++;
        });
        const wPair=p1w>p2w?'pair1':'pair2';
        pGame.forEach(pl=>{
          if(selectedPlayers.includes(pl)) efficiencyLastMonth[pl].gamesPlayed++;
        });
        [r[wPair].player1,r[wPair].player2].forEach(pl=>{
          if(selectedPlayers.includes(pl)) efficiencyLastMonth[pl].gamesWon++;
        });
      });

      const effLastMonth={};
      Object.keys(efficiencyLastMonth).forEach(pl=>{
        const d=efficiencyLastMonth[pl];
        effLastMonth[pl]=d.gamesPlayed>0?(d.gamesWon/d.gamesPlayed)*100:0;
      });

      let maxImprovement=0;
      let playersMaxImprovement=[];
      Object.keys(effThisMonth).forEach(pl=>{
        const improvement=effThisMonth[pl]-effLastMonth[pl];
        if(improvement>maxImprovement){
          maxImprovement=improvement;playersMaxImprovement=[pl];
        } else if(Math.abs(improvement - maxImprovement)<0.0001 && improvement>0){
          playersMaxImprovement.push(pl);
        }
      });

      const currentMonthPairs={};
      currentMonthResults.forEach((r)=>{
        const p1=[r.pair1.player1,r.pair1.player2].sort().join(' & ');
        const p2=[r.pair2.player1,r.pair2.player2].sort().join(' & ');
        if(!currentMonthPairs[p1]) currentMonthPairs[p1]={currentStreak:0,maxStreak:0,lastWin:false};
        if(!currentMonthPairs[p2]) currentMonthPairs[p2]={currentStreak:0,maxStreak:0,lastWin:false};

        let p1w=0,p2w=0;
        r.sets.forEach((s)=>{
          const s1=parseInt(s.pair1Score,10), s2=parseInt(s.pair2Score,10);
          if(s1>s2)p1w++;else if(s2>s1)p2w++;
        });
        const wp = p1w>p2w?p1:p2;
        const lp = wp===p1?p2:p1;

        if(currentMonthPairs[wp].lastWin===false){
          currentMonthPairs[wp].currentStreak=1;
          currentMonthPairs[wp].lastWin=true;
        } else {
          currentMonthPairs[wp].currentStreak+=1;
        }
        if(currentMonthPairs[wp].currentStreak>currentMonthPairs[wp].maxStreak)
          currentMonthPairs[wp].maxStreak=currentMonthPairs[wp].currentStreak;

        currentMonthPairs[lp].lastWin=false;
        currentMonthPairs[lp].currentStreak=0;
      });

      let maxPairStreakMonth=0; let pairsMaxStreakMonth=[];
      Object.entries(currentMonthPairs).forEach(([pairKey,d])=>{
        if(d.maxStreak>maxPairStreakMonth){
          maxPairStreakMonth=d.maxStreak;pairsMaxStreakMonth=[pairKey];
        } else if(d.maxStreak===maxPairStreakMonth && maxPairStreakMonth>0){
          pairsMaxStreakMonth.push(pairKey);
        }
      });

      // Función para poner nombres en negrita
      const boldNames = (arr) => arr.map(n=>`<strong>${n}</strong>`).join(', ');

      // Insights del período seleccionado
      const insightsPeriod=[];

      if(playersMaxSetsLost.length>0 && maxSetsLost>0){
        insightsPeriod.push(`Jugador(es) con más sets perdidos: ${boldNames(playersMaxSetsLost)} (${maxSetsLost} sets perdidos).`);
      }

      if(playersMaxSetsWon.length>0 && maxSetsWon>0){
        insightsPeriod.push(`Jugador(es) con más sets ganados: ${boldNames(playersMaxSetsWon)} (${maxSetsWon} sets ganados).`);
      }

      if(playersMaxStreak.length>0 && maxStreak>0){
        insightsPeriod.push(`Jugador(es) con más victorias consecutivas: ${boldNames(playersMaxStreak)} (${maxStreak} victorias seguidas).`);
      }

      if(mostActivePairs.length>0 && maxMatches>0){
        insightsPeriod.push(`Pareja(s) más activa(s): ${boldNames(mostActivePairs)} (${maxMatches} partidos jugados).`);
      }

      diffInsights.forEach(d=>{
        const match = d.match(/para (.+?):/);
        if(match && match[1]){
          const plName=match[1];
          const boldD = d.replace(plName, `<strong>${plName}</strong>`);
          insightsPeriod.push(boldD);
        } else {
          insightsPeriod.push(d);
        }
      });

      if(bestMatches.length>0 && bestScore<Infinity){
        bestMatches.forEach((bm)=>{
          const m=bm.match;
          const p1=`${m.pair1.player1} & ${m.pair1.player2}`;
          const p2=`${m.pair2.player1} & ${m.pair2.player2}`;
          const setsDesc=m.sets.map(s=>`${s.pair1Score}-${s.pair2Score}`).join(', ');
          insightsPeriod.push(`Partido más ajustado: <strong>${p1}</strong> contra <strong>${p2}</strong> (${setsDesc}).`);
        });
      }

      if(maxEffPlayers.length>0 && topEfficiency>0){
        insightsPeriod.push(`Jugador(es) más eficiente(s): ${boldNames(maxEffPlayers)} (${topEfficiency.toFixed(2)}%).`);
      } else {
        insightsPeriod.push('No hay suficientes datos para determinar el jugador más eficiente.');
      }

      setInsightsSelectedPeriod(insightsPeriod);

      // Insights del mes actual
      const insightsMonth=[];

      if(playersMaxImprovement.length>0 && maxImprovement>0){
        insightsMonth.push(`Jugador(es) con mayor mejora en eficiencia: ${boldNames(playersMaxImprovement)} (+${maxImprovement.toFixed(2)}%)`);
      } else {
        insightsMonth.push('No hay mejora significativa en eficiencia respecto al mes anterior.');
      }

      if(pairsMaxStreakMonth.length>0 && maxPairStreakMonth>0){
        insightsMonth.push(`Pareja(s) con más victorias consecutivas (mes actual): ${boldNames(pairsMaxStreakMonth)} (${maxPairStreakMonth} victorias seguidas).`);
      }

      setInsightsCurrentMonth(insightsMonth);
    };

    fetchData();
  }, [selectedPlayers, startDate, endDate, players, trendInterval, lastMonthResults]);

  const handlePlayerChange = (event) => {
    const { target: { value } } = event;
    setSelectedPlayers(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTrendIntervalChange = (event) => {
    setTrendInterval(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const filteredMatchHistory = matchHistory.filter((match) => {
    let passPlayer=true;
    if(searchPlayerFilter && searchPlayerFilter!==''){
      const p=searchPlayerFilter.toLowerCase();
      const pInGame=[match.pair1.player1,match.pair1.player2,match.pair2.player1,match.pair2.player2].map(x=>x.toLowerCase());
      if(!pInGame.includes(p)) passPlayer=false;
    }

    let passPair=true;
    if(searchPairFilter && searchPairFilter!==''){
      const pairKey=searchPairFilter.toLowerCase();
      const p1=[match.pair1.player1.toLowerCase(),match.pair1.player2.toLowerCase()].sort().join(' & ');
      const p2=[match.pair2.player1.toLowerCase(),match.pair2.player2.toLowerCase()].sort().join(' & ');
      if(p1!==pairKey && p2!==pairKey) passPair=false;
    }

    return passPlayer && passPair;
  });

  const totalHistoryPages = Math.ceil(filteredMatchHistory.length / itemsPerPage);
  const handleHistoryPageChange = (event, value) => {
    setCurrentPage(value);
  };
  const startIndex=(currentPage-1)*itemsPerPage;
  const paginatedHistory=filteredMatchHistory.slice(startIndex,startIndex+itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ marginTop: '20px' }}>
      {/* Encabezado "Estadísticas Avanzadas" */}
      <Box sx={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center' }}>
        <Typography variant="h5">Estadísticas Avanzadas</Typography>
      </Box>

      {/* Popover para Tooltips */}
      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Typography sx={{ p: 2 }}>{popoverContent}</Typography>
      </Popover>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ marginBottom: '20px' }}
      >
        <Tab label="Resumen" />
        <Tab label="Gráficos" />
        <Tab label="Historial de Partidos" />
      </Tabs>

      {tabIndex === 0 && (
        <Fade in timeout={500}>
          <Box sx={{ marginTop: '20px' }}>
            {/* Date pickers mes-año en Resumen */}
            <Box sx={{ marginBottom: '20px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={3} md={2}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    views={['year','month']}
                    inputFormat="MM/YYYY"
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <DatePicker
                    label="Fecha Final"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    views={['year','month']}
                    inputFormat="MM/YYYY"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Resumen */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', border: '1px solid #ccc', padding:'10px', borderRadius:'8px' }}>
                  <Typography variant="h6">
                    Total de Sets Jugados
                    <IconButton
                      size="small"
                      onClick={(e) => handlePopoverOpen(e,'Número total de sets jugados en el rango seleccionado.')}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Typography variant="h4">{summaryData.totalSets}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', border: '1px solid #ccc', padding:'10px', borderRadius:'8px' }}>
                  <Typography variant="h6">
                    Rendimiento Máximo
                    <IconButton
                      size="small"
                      onClick={(e)=>
                        handlePopoverOpen(e,'Jugador con el mayor porcentaje de victorias acumuladas dentro del rango de fechas seleccionado.')
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Typography variant="h4" component="div" dangerouslySetInnerHTML={{__html: summaryData.topPlayers.map(p=>`<strong>${p}</strong>`).join(', ')}} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', border: '1px solid #ccc', padding:'10px', borderRadius:'8px' }}>
                  <Typography variant="h6">
                    Partidos Ganados
                    <IconButton
                      size="small"
                      onClick={(e)=>
                        handlePopoverOpen(e,`Cantidad de partidos ganados por el/los jugador(es) con el mejor rendimiento: ${summaryData.topPlayers.join(', ')}.`)
                      }
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                  <Typography variant="h4">{summaryData.topPlayerWins}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ marginTop:'20px' }}>
              <Typography variant="h6" gutterBottom>
                Insights del Período Seleccionado ({startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')})
              </Typography>
              <Divider sx={{ marginBottom:'10px' }} />
              <Paper sx={{ padding:'10px' }}>
                {insightsSelectedPeriod.map((insight, index) => (
                  <React.Fragment key={index}>
                    {renderInsight(insight)}
                  </React.Fragment>
                ))}
              </Paper>

              <Typography variant="h6" gutterBottom sx={{ marginTop:'20px' }}>
                Insights del Mes Actual
              </Typography>
              <Divider sx={{ marginBottom:'10px' }} />
              <Paper sx={{ padding:'10px' }}>
                {insightsCurrentMonth.map((insight, index) => (
                  <React.Fragment key={index}>
                    {renderInsight(insight)}
                  </React.Fragment>
                ))}
              </Paper>
            </Box>
          </Box>
        </Fade>
      )}

      {tabIndex === 1 && (
        <Fade in timeout={500}>
          <Box sx={{ marginTop:'20px' }}>
            {/* Filtros en pestaña Gráficos con solo mes-año */}
            <Box sx={{ marginBottom:'20px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="player-select-label">Seleccionar Jugadores</InputLabel>
                    <Select
                      labelId="player-select-label"
                      multiple
                      value={selectedPlayers}
                      onChange={handlePlayerChange}
                      input={<OutlinedInput label="Seleccionar Jugadores" />}
                      renderValue={(selected)=>selected.join(', ')}
                    >
                      {players.map((player)=>(
                        <MenuItem key={player.id} value={player.id}>
                          <Checkbox checked={selectedPlayers.indexOf(player.id)>-1}/>
                          <ListItemText primary={player.name}/>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={startDate}
                    onChange={(date)=>setStartDate(date)}
                    renderInput={(params)=><TextField {...params} fullWidth/>}
                    views={['year','month']}
                    inputFormat="MM/YYYY"
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <DatePicker
                    label="Fecha Final"
                    value={endDate}
                    onChange={(date)=>setEndDate(date)}
                    renderInput={(params)=><TextField {...params} fullWidth/>}
                    views={['year','month']}
                    inputFormat="MM/YYYY"
                  />
                </Grid>
              </Grid>
            </Box>

            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Rango activo: {startDate.format('DD/MM/YYYY')} - {endDate.format('DD/MM/YYYY')}
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Eficiencia de los Jugadores (%)
                  <IconButton
                    size="small"
                    onClick={(e)=>
                      handlePopoverOpen(e,'Este gráfico muestra la eficiencia de los jugadores seleccionados en términos de porcentaje de victorias.')
                    }
                  >
                    <InfoIcon fontSize="small"/>
                  </IconButton>
                </Typography>
                <Tooltip title="Gráfico de eficiencia de jugadores">
                  <Box sx={{ position:'relative', height:isSmallScreen?'300px':'500px' }} ref={chartRefs.barChart}>
                    {barChartData?(
                      <>
                        <Bar data={barChartData} options={barChartOptions}/>
                        <IconButton
                          onClick={()=>exportChartAsImage(chartRefs.barChart,'Eficiencia_Jugadores')}
                          sx={{ position:'absolute', top:0, right:0 }}
                        >
                          <FileDownloadIcon/>
                        </IconButton>
                      </>
                    ):<p>No hay datos.</p>}
                  </Box>
                </Tooltip>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Sets Ganados y Perdidos por Jugador
                  <IconButton
                    size="small"
                    onClick={(e)=>
                      handlePopoverOpen(e,'Este gráfico muestra el número de sets ganados y perdidos por cada jugador.')
                    }
                  >
                    <InfoIcon fontSize="small"/>
                  </IconButton>
                </Typography>
                <Tooltip title="Gráfico de sets ganados/perdidos">
                  <Box sx={{ position:'relative', height:isSmallScreen?'300px':'500px' }} ref={chartRefs.stackedBarChart}>
                    {stackedBarChartData?(
                      <>
                        <Bar data={stackedBarChartData} options={stackedBarChartOptions}/>
                        <IconButton
                          onClick={()=>exportChartAsImage(chartRefs.stackedBarChart,'Sets_Ganados_Perdidos')}
                          sx={{ position:'absolute', top:0, right:0 }}
                        >
                          <FileDownloadIcon/>
                        </IconButton>
                      </>
                    ):<p>No hay datos.</p>}
                  </Box>
                </Tooltip>
              </Grid>

              {/* Intervalo de Tendencia justo antes del gráfico de Tendencia de Eficiencia */}
              <Grid item xs={12}>
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
                    onClick={(e)=>
                      handlePopoverOpen(e,'Este gráfico muestra la tendencia de eficiencia acumulada de los jugadores a lo largo del tiempo.')
                    }
                  >
                    <InfoIcon fontSize="small"/>
                  </IconButton>
                </Typography>
                <Tooltip title="Gráfico de tendencia de eficiencia">
                  <Box sx={{ position:'relative', height:isSmallScreen?'300px':'500px' }} ref={chartRefs.lineChart}>
                    {lineChartData?(
                      <>
                        <Line data={lineChartData} options={lineChartOptions}/>
                        <IconButton
                          onClick={()=>exportChartAsImage(chartRefs.lineChart,'Tendencia_Eficiencia')}
                          sx={{ position:'absolute', top:0, right:0 }}
                        >
                          <FileDownloadIcon/>
                        </IconButton>
                      </>
                    ):<p>No hay datos.</p>}
                  </Box>
                </Tooltip>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Rendimiento de las Parejas
                  <IconButton
                    size="small"
                    onClick={(e)=>
                      handlePopoverOpen(e,'Este gráfico muestra la eficiencia de cada pareja de jugadores.')
                    }
                  >
                    <InfoIcon fontSize="small"/>
                  </IconButton>
                </Typography>
                <Tooltip title="Gráfico de rendimiento en parejas">
                  <Box sx={{ position:'relative', height:isSmallScreen?'300px':'500px' }} ref={chartRefs.pairEfficiencyChart}>
                    {pairEfficiencyChartData?(
                      <>
                        <Bar data={pairEfficiencyChartData} options={pairEfficiencyChartOptions}/>
                        <IconButton
                          onClick={()=>exportChartAsImage(chartRefs.pairEfficiencyChart,'Rendimiento_Parejas')}
                          sx={{ position:'absolute', top:0, right:0 }}
                        >
                          <FileDownloadIcon/>
                        </IconButton>
                      </>
                    ):<p>No hay datos.</p>}
                  </Box>
                </Tooltip>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Victorias por Parejas
                  <IconButton
                    size="small"
                    onClick={(e)=>
                      handlePopoverOpen(e,'Este gráfico muestra la distribución de victorias entre las diferentes parejas.')
                    }
                  >
                    <InfoIcon fontSize="small"/>
                  </IconButton>
                </Typography>
                <Tooltip title="Gráfico de victorias por parejas">
                  <Box sx={{ position:'relative', height:isSmallScreen?'300px':'500px' }} ref={chartRefs.pieChart}>
                    {pieChartData?(
                      <>
                        <Pie data={pieChartData} options={pieChartOptions}/>
                        <IconButton
                          onClick={()=>exportChartAsImage(chartRefs.pieChart,'Victorias_Parejas')}
                          sx={{ position:'absolute', top:0, right:0 }}
                        >
                          <FileDownloadIcon/>
                        </IconButton>
                      </>
                    ):<p>No hay datos.</p>}
                  </Box>
                </Tooltip>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Partidos Jugados por Mes
                  <IconButton
                    size="small"
                    onClick={(e)=>
                      handlePopoverOpen(e,'Este gráfico muestra el número de partidos jugados en cada mes.')
                    }
                  >
                    <InfoIcon fontSize="small"/>
                  </IconButton>
                </Typography>
                <Tooltip title="Gráfico de partidos por mes">
                  <Box sx={{ position:'relative', height:isSmallScreen?'300px':'500px' }} ref={chartRefs.monthlyChart}>
                    {monthlyChartData?(
                      <>
                        <Bar data={monthlyChartData} options={monthlyChartOptions}/>
                        <IconButton
                          onClick={()=>exportChartAsImage(chartRefs.monthlyChart,'Partidos_Por_Mes')}
                          sx={{ position:'absolute', top:0, right:0 }}
                        >
                          <FileDownloadIcon/>
                        </IconButton>
                      </>
                    ):<p>No hay datos.</p>}
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {tabIndex === 2 && (
        <Fade in timeout={500}>
          <Box sx={{ marginTop: '20px' }}>
            {/* Filtros en Historial */}
            <Box sx={{ marginBottom:'20px' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={3} md={2}>
                  <TextField
                    label="Jugador"
                    variant="outlined"
                    fullWidth
                    value={searchPlayerFilter}
                    onChange={(e)=>setSearchPlayerFilter(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <FormControl fullWidth>
                    <InputLabel id="pair-filter-label">Pareja</InputLabel>
                    <Select
                      labelId="pair-filter-label"
                      value={searchPairFilter}
                      onChange={(e)=>setSearchPairFilter(e.target.value)}
                      label="Pareja"
                    >
                      <MenuItem value="">(Todas)</MenuItem>
                      {(() => {
                        const allPairsSet = new Set();
                        matchHistory.forEach(m=>{
                          const p1=[m.pair1.player1,m.pair1.player2].sort().join(' & ');
                          const p2=[m.pair2.player1,m.pair2.player2].sort().join(' & ');
                          allPairsSet.add(p1);allPairsSet.add(p2);
                        });
                        const allPairs=Array.from(allPairsSet).sort();
                        return allPairs.map((p)=>(
                          <MenuItem key={p} value={p}>{p}</MenuItem>
                        ));
                      })()}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="h6" gutterBottom>
              Historial de Partidos
            </Typography>

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
                    .sort((a,b)=>dayjs(b.date).diff(dayjs(a.date)))
                    .slice((currentPage-1)*itemsPerPage, (currentPage-1)*itemsPerPage+itemsPerPage)
                    .map((match,index)=>{
                      let p1Wins=0,p2Wins=0;
                      match.sets.forEach(s=>{
                        const s1=parseInt(s.pair1Score,10), s2=parseInt(s.pair2Score,10);
                        if(s1>s2)p1Wins++;else if(s2>s1)p2Wins++;
                      });
                      const wPair=p1Wins>p2Wins?'pair1':'pair2';
                      const wPlayers=`${match[wPair].player1} & ${match[wPair].player2}`;
                      return (
                        <TableRow key={index}>
                          <TableCell>{dayjs(match.date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{match.pair1.player1} & {match.pair1.player2}</TableCell>
                          <TableCell>{match.pair2.player1} & {match.pair2.player2}</TableCell>
                          <TableCell><strong>{wPlayers}</strong></TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            {totalHistoryPages>1 && (
              <Box sx={{ display:'flex', justifyContent:'center', marginTop:'20px' }}>
                <Pagination
                  count={totalHistoryPages}
                  page={currentPage}
                  onChange={handleHistoryPageChange}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        </Fade>
      )}

      <Box sx={{ marginTop: '20px', textAlign:'center' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor:'black',
            color:'white',
            borderRadius:'30px',
            padding:'10px 20px',
            textTransform:'none',
            '&:hover':{
              backgroundColor:'#333',
            },
          }}
          onClick={()=>navigate('/')}
        >
          Volver a la pantalla principal
        </Button>
      </Box>
    </Container>
  );
};

export default StatsCharts;