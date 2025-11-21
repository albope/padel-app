// src/components/StatsCharts.js
import React, { useState, useMemo, useRef } from 'react';
import {
  Box, Container, Grid, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, OutlinedInput, Typography, Tabs, Tab, IconButton,
  useMediaQuery, useTheme, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Fade, Card, CardContent, CardHeader, Popover, Divider,
  Tooltip, Pagination, Skeleton, Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Iconos
import {
  InfoOutlined as InfoIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as EmojiEventsIcon,
  DoneAll as DoneAllIcon,
  BarChart as BarChartIcon,
  ArrowBack as ArrowBackIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

// Utils
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

// Hook
import { usePadelResults } from '../hooks/usePadelResults';

dayjs.locale('es');

// --- UTILIDADES ---
const exportChartAsImage = async (chartRef, chartName) => {
  if (!chartRef.current) return;
  const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
  canvas.toBlob((blob) => saveAs(blob, `${chartName}.png`));
};

const baseChartOptions = (theme, title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: theme.palette.text.primary } },
    title: { display: !!title, text: title, color: theme.palette.text.primary }
  },
  scales: {
    y: { ticks: { color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } },
    x: { ticks: { color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } }
  }
});

// --- SUB-COMPONENTE: CHART CARD (Aquí es donde arreglamos el error) ---
// Al ser un componente (empieza por Mayúscula), puede usar useRef
const ChartCard = ({ title, data, ChartComponent, options, loading }) => {
  const ref = useRef(null);

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%', minHeight: 350, display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">{title}</Typography>
        <IconButton size="small" onClick={() => exportChartAsImage(ref, title)}>
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box flexGrow={1} position="relative" ref={ref}>
        {loading ? (
          <Skeleton variant="rectangular" height="100%" />
        ) : data ? (
          <ChartComponent data={data} options={options} />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
             <BarChartIcon color="disabled" sx={{ fontSize: 40 }} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// --- COMPONENTE PRINCIPAL ---
const StatsCharts = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // 1. HOOK DE DATOS
  const { results: allResults, loading } = usePadelResults();

  // 2. ESTADOS DE FILTRO
  const [selectedPlayers, setSelectedPlayers] = useState(['Lucas', 'Bort', 'Martin', 'Ricardo']);
  const [startDate, setStartDate] = useState(dayjs().startOf('year'));
  const [endDate, setEndDate] = useState(dayjs().endOf('year'));
  const [tabIndex, setTabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 3. PROCESAMIENTO DE DATOS (useMemo)
  const processedData = useMemo(() => {
    if (loading || !allResults.length) return null;

    // Filtrar por fecha
    const filteredByDate = allResults.filter(r => {
        const d = dayjs(r.date);
        return d.isAfter(startDate.subtract(1, 'day')) && d.isBefore(endDate.add(1, 'day'));
    });

    // Filtrar por jugadores seleccionados
    const filteredResults = filteredByDate.filter(r => 
        [r.pair1.player1, r.pair1.player2, r.pair2.player1, r.pair2.player2]
        .some(p => selectedPlayers.includes(p))
    );

    // Inicializar acumuladores
    const playerStats = {};
    selectedPlayers.forEach(p => {
        playerStats[p] = { gamesPlayed: 0, gamesWon: 0, setsWon: 0, setsLost: 0 };
    });
    const pairStats = {};
    let totalSets = 0;

    filteredResults.forEach(match => {
        const p1 = match.pair1; const p2 = match.pair2;
        const p1Name = [p1.player1, p1.player2].sort().join(' & ');
        const p2Name = [p2.player1, p2.player2].sort().join(' & ');

        // Inicializar parejas
        if(!pairStats[p1Name]) pairStats[p1Name] = { played: 0, won: 0 };
        if(!pairStats[p2Name]) pairStats[p2Name] = { played: 0, won: 0 };
        
        // Contar participación solo si están en la selección
        const allPlayers = [p1.player1, p1.player2, p2.player1, p2.player2];
        allPlayers.forEach(p => { if(playerStats[p]) playerStats[p].gamesPlayed++; });
        
        const allSelected = allPlayers.every(p => selectedPlayers.includes(p));
        if(allSelected) {
             pairStats[p1Name].played++;
             pairStats[p2Name].played++;
        }

        // Analizar Sets
        let p1Sets = 0, p2Sets = 0;
        if(match.sets) {
            match.sets.forEach(s => {
                const s1 = parseInt(s.pair1Score), s2 = parseInt(s.pair2Score);
                if(s1 > s2) p1Sets++; else if(s2 > s1) p2Sets++;
                totalSets++;
            });
        }

        // Asignar Victorias/Derrotas
        const winner = p1Sets > p2Sets ? 1 : 2;
        
        // Sets Individuales
        [p1.player1, p1.player2].forEach(p => { if(playerStats[p]) { playerStats[p].setsWon += p1Sets; playerStats[p].setsLost += p2Sets; if(winner===1) playerStats[p].gamesWon++; } });
        [p2.player1, p2.player2].forEach(p => { if(playerStats[p]) { playerStats[p].setsWon += p2Sets; playerStats[p].setsLost += p1Sets; if(winner===2) playerStats[p].gamesWon++; } });

        // Sets Parejas (Solo si full selected)
        if(allSelected) {
            if(winner === 1) pairStats[p1Name].won++;
            else pairStats[p2Name].won++;
        }
    });

    return { playerStats, pairStats, filteredResults, totalSets };
  }, [allResults, loading, startDate, endDate, selectedPlayers]);

  // --- PREPARACIÓN DE GRÁFICOS ---
  const chartData = useMemo(() => {
    if(!processedData) return null;
    const { playerStats, pairStats, filteredResults } = processedData;

    // 1. Eficiencia Jugadores
    const effLabels = Object.keys(playerStats);
    const effValues = effLabels.map(p => {
        const s = playerStats[p];
        return s.gamesPlayed > 0 ? ((s.gamesWon / s.gamesPlayed) * 100).toFixed(1) : 0;
    });

    // 2. Sets Ganados/Perdidos
    const setsWon = effLabels.map(p => playerStats[p].setsWon);
    const setsLost = effLabels.map(p => playerStats[p].setsLost);

    // 3. Eficiencia Parejas
    const pairLabels = Object.keys(pairStats).filter(k => pairStats[k].played > 0);
    const pairEff = pairLabels.map(k => ((pairStats[k].won / pairStats[k].played) * 100).toFixed(1));

    // 4. Partidos por Mes
    const months = {};
    filteredResults.forEach(r => {
        const m = dayjs(r.date).format('MMM YY');
        months[m] = (months[m] || 0) + 1;
    });
    // Ordenar meses cronológicamente
    const sortedMonths = Object.keys(months).sort((a, b) => dayjs(a, 'MMM YY').diff(dayjs(b, 'MMM YY')));

    return {
        efficiency: {
            labels: effLabels,
            datasets: [{ label: 'Eficiencia (%)', data: effValues, backgroundColor: theme.palette.primary.main }]
        },
        sets: {
            labels: effLabels,
            datasets: [
                { label: 'Sets Ganados', data: setsWon, backgroundColor: theme.palette.success.light },
                { label: 'Sets Perdidos', data: setsLost, backgroundColor: theme.palette.error.light }
            ]
        },
        pairs: {
            labels: pairLabels,
            datasets: [{ label: 'Eficiencia Pareja (%)', data: pairEff, backgroundColor: theme.palette.secondary.main }]
        },
        monthly: {
            labels: sortedMonths,
            datasets: [{ label: 'Partidos', data: sortedMonths.map(m => months[m]), backgroundColor: theme.palette.info.main }]
        }
    };
  }, [processedData, theme]);

  // --- RENDERIZADO ---
  const headerStyle = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: theme.palette.common.white,
    padding: theme.spacing(3),
    borderRadius: 3,
    marginBottom: theme.spacing(4),
    textAlign: 'center',
    boxShadow: '0px 8px 20px rgba(0,0,0,0.15)',
    position: 'relative'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, pb: 8 }}>
        
        {/* HEADER */}
        <Paper elevation={0} sx={headerStyle}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Centro de Estadísticas
            </Typography>
            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                Análisis detallado de rendimiento
            </Typography>
        </Paper>

        {/* FILTROS */}
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 4, bgcolor: theme.palette.action.hover }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Jugadores</InputLabel>
                        <Select
                            multiple
                            value={selectedPlayers}
                            onChange={(e) => setSelectedPlayers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            input={<OutlinedInput label="Jugadores" />}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {['Lucas', 'Bort', 'Martin', 'Ricardo'].map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={selectedPlayers.indexOf(name) > -1} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6} md={3}>
                    <DatePicker 
                        label="Desde" 
                        value={startDate} 
                        onChange={setStartDate} 
                        slotProps={{ textField: { size: 'small', fullWidth: true } }} 
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <DatePicker 
                        label="Hasta" 
                        value={endDate} 
                        onChange={setEndDate} 
                        slotProps={{ textField: { size: 'small', fullWidth: true } }} 
                    />
                </Grid>
            </Grid>
        </Paper>

        {/* KPI CARDS */}
        {processedData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Sets Totales', value: processedData.totalSets, icon: <AssessmentIcon color="primary"/> },
                    { label: 'Partidos Jugados', value: processedData.filteredResults.length, icon: <DoneAllIcon color="success"/> },
                    { label: 'Mejor Eficiencia', value: chartData?.efficiency?.datasets[0]?.data.length ? Math.max(...chartData.efficiency.datasets[0].data) + '%' : '0%', icon: <EmojiEventsIcon color="warning"/> }
                ].map((kpi, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <Card elevation={2}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.action.selected, mr: 2 }}>
                                    {kpi.icon}
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" textTransform="uppercase">
                                        {kpi.label}
                                    </Typography>
                                    <Typography variant="h5" fontWeight="800">
                                        {kpi.value}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        )}

        {/* TABS */}
        <Tabs 
            value={tabIndex} 
            onChange={(e, v) => setTabIndex(v)} 
            centered 
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
            <Tab label="Rendimiento" />
            <Tab label="Parejas & Histórico" />
        </Tabs>

        {/* CONTENIDO TABS */}
        <Box sx={{ minHeight: 400 }}>
            <Fade in>
                <Box>
                    {tabIndex === 0 && chartData && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <ChartCard 
                                    title="Eficiencia Individual" 
                                    data={chartData.efficiency} 
                                    ChartComponent={Bar} 
                                    options={baseChartOptions(theme)} 
                                    loading={loading}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <ChartCard 
                                    title="Balance de Sets" 
                                    data={chartData.sets} 
                                    ChartComponent={Bar} 
                                    options={baseChartOptions(theme)}
                                    loading={loading}
                                />
                            </Grid>
                        </Grid>
                    )}
                    {tabIndex === 1 && chartData && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <ChartCard 
                                    title="Rendimiento Parejas" 
                                    data={chartData.pairs} 
                                    ChartComponent={Bar} 
                                    options={baseChartOptions(theme)}
                                    loading={loading}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <ChartCard 
                                    title="Evolución Mensual" 
                                    data={chartData.monthly} 
                                    ChartComponent={Line} 
                                    options={baseChartOptions(theme)}
                                    loading={loading}
                                />
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </Fade>
        </Box>

        {/* HISTORIAL TABLA (Página 2 de tabs) */}
        {tabIndex === 1 && processedData && (
            <Box mt={4}>
                <Typography variant="h6" gutterBottom fontWeight="bold">Detalle de Partidos</Typography>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Pareja 1</TableCell>
                                <TableCell>Pareja 2</TableCell>
                                <TableCell>Resultado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {processedData.filteredResults
                                .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
                                .slice((currentPage-1)*5, currentPage*5)
                                .map((r, i) => (
                                <TableRow key={i}>
                                    <TableCell>{dayjs(r.date).format('DD/MM/YY')}</TableCell>
                                    <TableCell>{r.pair1.player1} & {r.pair1.player2}</TableCell>
                                    <TableCell>{r.pair2.player1} & {r.pair2.player2}</TableCell>
                                    <TableCell>
                                        {r.sets.map(s => `${s.pair1Score}-${s.pair2Score}`).join(', ')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination 
                        count={Math.ceil(processedData.filteredResults.length / 5)} 
                        page={currentPage} 
                        onChange={(e, v) => setCurrentPage(v)} 
                    />
                </Box>
            </Box>
        )}

    </Container>
  );
};

export default StatsCharts;