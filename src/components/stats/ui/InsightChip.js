// src/components/stats/ui/InsightChip.js
// Premium Insight Chip with emoji and text

import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { tokens } from '../../../theme';

const InsightChip = ({
  emoji,
  icon,
  text,
  variant = 'default', // 'default', 'success', 'warning', 'info'
  size = 'medium', // 'small', 'medium'
  onClick,
}) => {
  const theme = useTheme();

  const variantStyles = {
    default: {
      background: alpha(theme.palette.primary.light, 0.5),
      borderColor: alpha(theme.palette.secondary.main, 0.2),
      textColor: theme.palette.text.primary,
    },
    success: {
      background: alpha(theme.palette.success.main, 0.15),
      borderColor: alpha(theme.palette.success.main, 0.3),
      textColor: theme.palette.success.main,
    },
    warning: {
      background: alpha(theme.palette.warning.main, 0.15),
      borderColor: alpha(theme.palette.warning.main, 0.3),
      textColor: theme.palette.warning.main,
    },
    info: {
      background: alpha(theme.palette.info.main, 0.2),
      borderColor: alpha(theme.palette.info.main, 0.4),
      textColor: theme.palette.text.primary,
    },
    error: {
      background: alpha(theme.palette.error.main, 0.15),
      borderColor: alpha(theme.palette.error.main, 0.3),
      textColor: theme.palette.error.light,
    },
  };

  const sizeStyles = {
    small: { px: 2, py: 1, fontSize: '0.75rem', emojiSize: '1rem' },
    medium: { px: 2.5, py: 1.25, fontSize: '0.85rem', emojiSize: '1.25rem' },
  };

  const style = variantStyles[variant] || variantStyles.default;
  const sizing = sizeStyles[size] || sizeStyles.medium;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        px: sizing.px,
        py: sizing.py,
        borderRadius: 3,
        background: style.background,
        border: `1px solid ${style.borderColor}`,
        boxShadow: `0 2px 8px ${alpha(style.borderColor, 0.3)}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        maxWidth: '100%',
      }}
    >
      {/* Emoji or Icon */}
      {emoji && (
        <Typography
          component="span"
          sx={{ fontSize: sizing.emojiSize, lineHeight: 1 }}
        >
          {emoji}
        </Typography>
      )}
      {icon && !emoji && (
        <Box
          sx={{
            color: style.textColor,
            display: 'flex',
            alignItems: 'center',
            '& svg': { fontSize: sizing.emojiSize },
          }}
        >
          {icon}
        </Box>
      )}

      {/* Text */}
      <Typography
        variant="caption"
        sx={{
          fontFamily: tokens.typography.bodyFont,
          fontSize: sizing.fontSize,
          fontWeight: 600,
          color: style.textColor,
          lineHeight: 1.2,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default InsightChip;
