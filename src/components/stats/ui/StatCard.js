// src/components/stats/ui/StatCard.js
// Premium Stat Card with icon and trend indicator

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { tokens } from '../../../theme';
import GlassCard from './GlassCard';

const StatCard = ({
  icon,
  label,
  value,
  trend,
  trendDirection = 'neutral', // 'up', 'down', 'neutral'
  color = 'gold', // 'gold', 'blue', 'lime', 'burgundy'
  size = 'medium', // 'small', 'medium', 'large'
  onClick,
}) => {
  const theme = useTheme();

  const colorMap = {
    gold: theme.palette.secondary.main,
    blue: theme.palette.info.main,
    lime: theme.palette.lime?.main || '#CCFF00',
    burgundy: theme.palette.error.main,
  };

  const accentColor = colorMap[color] || colorMap.gold;

  const sizeMap = {
    small: { padding: 1.5, iconSize: 24, valueSize: '1.5rem', labelSize: '0.65rem' },
    medium: { padding: 2, iconSize: 32, valueSize: '2rem', labelSize: '0.75rem' },
    large: { padding: 2.5, iconSize: 40, valueSize: '2.5rem', labelSize: '0.85rem' },
  };

  const sizeConfig = sizeMap[size] || sizeMap.medium;

  const TrendIcon = {
    up: TrendingUpIcon,
    down: TrendingDownIcon,
    neutral: TrendingFlatIcon,
  }[trendDirection];

  const trendColor = {
    up: theme.palette.success.main,
    down: theme.palette.error.main,
    neutral: alpha(theme.palette.text.primary, 0.5),
  }[trendDirection];

  return (
    <GlassCard
      accentColor={accentColor}
      accentPosition="left"
      hover={!!onClick}
      sx={{
        p: sizeConfig.padding,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Icon */}
        {icon && (
          <Box
            sx={{
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& svg': { fontSize: sizeConfig.iconSize },
            }}
          >
            {icon}
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Label */}
          <Typography
            variant="caption"
            sx={{
              fontFamily: tokens.typography.bodyFont,
              fontSize: sizeConfig.labelSize,
              fontWeight: 600,
              color: alpha(theme.palette.text.primary, 0.7),
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>

          {/* Value */}
          <Typography
            variant="h4"
            component={motion.div}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            sx={{
              fontFamily: tokens.typography.monoFont,
              fontSize: sizeConfig.valueSize,
              fontWeight: 700,
              color: theme.palette.text.primary,
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          {/* Trend */}
          {trend && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
              }}
            >
              <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: tokens.typography.bodyFont,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: trendColor,
                }}
              >
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </GlassCard>
  );
};

export default StatCard;
