// src/components/stats/ui/GlassCard.js
// Premium Glass Morphism Card Container

import React from 'react';
import { Paper, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  elevation = 4,
  accentColor,
  accentPosition = 'top', // 'top', 'left', 'none'
  hover = true,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const accent = accentColor || theme.palette.secondary.main;

  const accentStyles = {
    top: {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${accent} 0%, ${alpha(accent, 0.3)} 100%)`,
        borderRadius: '12px 12px 0 0',
      },
    },
    left: {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
        backgroundColor: accent,
        borderRadius: '12px 0 0 12px',
      },
    },
    none: {},
  };

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { y: -4, boxShadow: theme.shadows[8] } : {}}
      elevation={elevation}
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: `linear-gradient(145deg,
          ${alpha(theme.palette.primary.light, 0.9)} 0%,
          ${alpha(theme.palette.primary.main, 0.95)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
        ...accentStyles[accentPosition],
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default GlassCard;
