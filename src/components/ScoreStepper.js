// src/components/ScoreStepper.js
import React from 'react';
import { Box, IconButton, Typography, useTheme, alpha } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

const ScoreStepper = ({
  value,
  onChange,
  min = 0,
  max = 7,
  label,
  error,
  helperText,
  pairColor,
  isWinning = false,
}) => {
  const theme = useTheme();
  const numValue = value === '' || value === null || value === undefined ? null : parseInt(value, 10);

  const handleIncrement = () => {
    if (numValue === null) {
      onChange(min);
    } else if (numValue < max) {
      onChange(numValue + 1);
    }
  };

  const handleDecrement = () => {
    if (numValue === null) {
      onChange(min);
    } else if (numValue > min) {
      onChange(numValue - 1);
    }
  };

  const displayValue = numValue !== null ? numValue : '-';
  const color = pairColor || theme.palette.primary.main;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {label && (
        <Typography
          variant="caption"
          sx={{
            mb: 0.5,
            fontWeight: 500,
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            fontSize: '0.7rem',
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: error
            ? alpha(theme.palette.error.main, 0.08)
            : isWinning
            ? alpha(theme.palette.success.main, 0.1)
            : alpha(theme.palette.grey[500], 0.08),
          borderRadius: 3,
          border: error
            ? `2px solid ${theme.palette.error.main}`
            : isWinning
            ? `2px solid ${alpha(theme.palette.success.main, 0.5)}`
            : `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
        }}
      >
        <IconButton
          onClick={handleDecrement}
          disabled={numValue === null || numValue <= min}
          size="small"
          sx={{
            borderRadius: 0,
            color: color,
            '&:hover': {
              backgroundColor: alpha(color, 0.1),
            },
            '&.Mui-disabled': {
              color: theme.palette.text.disabled,
            },
          }}
        >
          <Remove fontSize="small" />
        </IconButton>
        <Box
          sx={{
            minWidth: 44,
            textAlign: 'center',
            py: 0.5,
            px: 1,
            backgroundColor: isWinning
              ? alpha(theme.palette.success.main, 0.15)
              : 'transparent',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: isWinning
                ? theme.palette.success.dark
                : error
                ? theme.palette.error.main
                : theme.palette.text.primary,
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            {displayValue}
          </Typography>
        </Box>
        <IconButton
          onClick={handleIncrement}
          disabled={numValue !== null && numValue >= max}
          size="small"
          sx={{
            borderRadius: 0,
            color: color,
            '&:hover': {
              backgroundColor: alpha(color, 0.1),
            },
            '&.Mui-disabled': {
              color: theme.palette.text.disabled,
            },
          }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Box>
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            fontSize: '0.65rem',
            textAlign: 'center',
            maxWidth: 100,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

// Componente para un set completo (dos scores)
export const SetScoreInput = ({
  setNumber,
  pair1Score,
  pair2Score,
  onPair1Change,
  onPair2Change,
  pair1Label = 'Pareja 1',
  pair2Label = 'Pareja 2',
  pair1Color,
  pair2Color,
  error,
  helperText,
}) => {
  const theme = useTheme();

  const p1Score = pair1Score === '' ? null : parseInt(pair1Score, 10);
  const p2Score = pair2Score === '' ? null : parseInt(pair2Score, 10);
  const pair1Winning = p1Score !== null && p2Score !== null && p1Score > p2Score;
  const pair2Winning = p1Score !== null && p2Score !== null && p2Score > p1Score;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        backgroundColor: alpha(theme.palette.grey[500], 0.04),
        borderRadius: 2,
        border: error
          ? `1px solid ${theme.palette.error.main}`
          : `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontWeight: 600,
          color: error ? theme.palette.error.main : theme.palette.text.primary,
        }}
      >
        Set {setNumber}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <ScoreStepper
          value={pair1Score}
          onChange={onPair1Change}
          label={pair1Label}
          pairColor={pair1Color}
          isWinning={pair1Winning}
          error={error}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.secondary,
            mx: 1,
          }}
        >
          -
        </Typography>
        <ScoreStepper
          value={pair2Score}
          onChange={onPair2Change}
          label={pair2Label}
          pairColor={pair2Color}
          isWinning={pair2Winning}
          error={error}
        />
      </Box>
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            textAlign: 'center',
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default ScoreStepper;
