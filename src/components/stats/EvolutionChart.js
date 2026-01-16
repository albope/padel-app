// src/components/stats/EvolutionChart.js
// Section 4: Evolution chart showing efficiency over time

import React, { useState, useMemo } from 'react';
import { Box, Typography, useTheme, alpha, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import dayjs from 'dayjs';
import { tokens } from '../../theme';
import GlassCard from './ui/GlassCard';
import InsightChip from './ui/InsightChip';

const EvolutionChart = ({ evolutionStats, selectedPlayer }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('all'); // '3m', '6m', '1y', 'all'

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!evolutionStats || evolutionStats.length === 0) return [];

    const now = dayjs();
    let cutoff;

    switch (timeRange) {
      case '3m':
        cutoff = now.subtract(3, 'months');
        break;
      case '6m':
        cutoff = now.subtract(6, 'months');
        break;
      case '1y':
        cutoff = now.subtract(1, 'year');
        break;
      default:
        return evolutionStats;
    }

    return evolutionStats.filter((d) => dayjs(d.month).isAfter(cutoff));
  }, [evolutionStats, timeRange]);

  // Calculate trend
  const trendInsight = useMemo(() => {
    if (filteredData.length < 2) return null;

    const recent = filteredData.slice(-3);
    const older = filteredData.slice(0, Math.max(1, filteredData.length - 3));

    const recentAvg = recent.reduce((sum, d) => sum + d.efficiency, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.efficiency, 0) / older.length;

    const change = Math.round(recentAvg - olderAvg);

    // Find best month
    const bestMonth = filteredData.reduce(
      (best, d) => (d.efficiency > best.efficiency ? d : best),
      filteredData[0]
    );

    return {
      change,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      bestMonth,
    };
  }, [filteredData]);

  // Chart configuration
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    return {
      labels: filteredData.map((d) => d.label),
      datasets: [
        {
          label: 'Eficiencia',
          data: filteredData.map((d) => d.efficiency),
          fill: true,
          borderColor: theme.palette.secondary.main,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, alpha(theme.palette.secondary.main, 0.4));
            gradient.addColorStop(1, alpha(theme.palette.secondary.main, 0.02));
            return gradient;
          },
          tension: 0.4,
          pointBackgroundColor: theme.palette.secondary.main,
          pointBorderColor: theme.palette.background.paper,
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: theme.palette.secondary.main,
          pointHoverBorderColor: theme.palette.background.paper,
          pointHoverBorderWidth: 3,
        },
      ],
    };
  }, [filteredData, theme]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Eficiencia %',
            color: alpha(theme.palette.text.primary, 0.7),
            font: {
              family: tokens.typography.bodyFont,
              size: 11,
            },
          },
          ticks: {
            color: alpha(theme.palette.text.primary, 0.6),
            font: {
              family: tokens.typography.monoFont,
              size: 10,
            },
            callback: (value) => `${value}%`,
          },
          grid: {
            color: alpha(theme.palette.secondary.main, 0.1),
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            color: alpha(theme.palette.text.primary, 0.6),
            font: {
              family: tokens.typography.bodyFont,
              size: 10,
            },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: alpha(theme.palette.primary.dark, 0.95),
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.primary,
          borderColor: alpha(theme.palette.secondary.main, 0.3),
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: tokens.typography.bodyFont,
            weight: 600,
          },
          bodyFont: {
            family: tokens.typography.monoFont,
          },
          padding: 12,
          callbacks: {
            label: (context) => {
              const dataIndex = context.dataIndex;
              const data = filteredData[dataIndex];
              return [
                `Eficiencia: ${data.efficiency}%`,
                `Partidos: ${data.games}`,
                `Victorias: ${data.wins}`,
              ];
            },
          },
        },
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart',
      },
    }),
    [theme, filteredData]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!evolutionStats || evolutionStats.length === 0) {
    return (
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.text.primary,
            mb: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Mi Evolucion
        </Typography>
        <GlassCard>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: alpha(theme.palette.text.primary, 0.5),
              py: 4,
            }}
          >
            No hay suficientes datos para mostrar la evolucion
          </Typography>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          component={motion.h2}
          variants={itemVariants}
          sx={{
            fontFamily: tokens.typography.displayFont,
            color: theme.palette.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Mi Evolucion
        </Typography>

        {/* Time Range Toggle */}
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, value) => value && setTimeRange(value)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: alpha(theme.palette.text.primary, 0.6),
              borderColor: alpha(theme.palette.secondary.main, 0.3),
              fontFamily: tokens.typography.bodyFont,
              fontSize: '0.7rem',
              px: 1.5,
              py: 0.5,
              '&.Mui-selected': {
                color: theme.palette.secondary.main,
                backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                },
              },
            },
          }}
        >
          <ToggleButton value="3m">3M</ToggleButton>
          <ToggleButton value="6m">6M</ToggleButton>
          <ToggleButton value="1y">1A</ToggleButton>
          <ToggleButton value="all">Todo</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <GlassCard component={motion.div} variants={itemVariants}>
        <Box sx={{ height: 280 }}>
          {chartData && <Line data={chartData} options={chartOptions} />}
        </Box>
      </GlassCard>

      {/* Insights */}
      {trendInsight && (
        <Box
          component={motion.div}
          variants={itemVariants}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mt: 2,
            justifyContent: 'center',
          }}
        >
          <InsightChip
            emoji={trendInsight.trend === 'up' ? '📈' : trendInsight.trend === 'down' ? '📉' : '➡️'}
            text={`Tendencia ${
              trendInsight.trend === 'up'
                ? 'POSITIVA'
                : trendInsight.trend === 'down'
                ? 'NEGATIVA'
                : 'ESTABLE'
            } (${trendInsight.change > 0 ? '+' : ''}${trendInsight.change}%)`}
            variant={
              trendInsight.trend === 'up'
                ? 'success'
                : trendInsight.trend === 'down'
                ? 'error'
                : 'info'
            }
          />

          {trendInsight.bestMonth && (
            <InsightChip
              emoji="🔥"
              text={`Mejor mes: ${trendInsight.bestMonth.label} (${trendInsight.bestMonth.efficiency}%)`}
              variant="success"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default EvolutionChart;
