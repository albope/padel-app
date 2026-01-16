// src/components/stats/ui/RadialProgress.js
// Premium Radial Progress Ring (extracted from PlayerCard)

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';

const RadialProgress = ({
  value,
  size = 120,
  strokeWidth = 8,
  label = '%',
  color,
  showLabel = true,
  animate = true,
}) => {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const progressColor = color || theme.palette.success.main;

  // Generate unique gradient ID
  const gradientId = `radial-gradient-${label}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={alpha(theme.palette.background.dark, 0.3)}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle with Gradient */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={alpha(progressColor, 0.8)} />
            <stop offset="100%" stopColor={progressColor} />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {/* Center Value */}
      {showLabel && (
        <Box
          sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontFamily: tokens.typography.monoFont,
              fontWeight: 700,
              color: progressColor,
              lineHeight: 1,
              fontSize: size * 0.25,
            }}
          >
            {Math.round(value)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: tokens.typography.bodyFont,
              fontSize: size * 0.09,
              fontWeight: 600,
              color: alpha(theme.palette.text.primary, 0.7),
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mt: 0.5,
            }}
          >
            {label}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RadialProgress;
