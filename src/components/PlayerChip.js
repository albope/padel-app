// src/components/PlayerChip.js
import React from 'react';
import { Box, Avatar, Typography, useTheme, alpha } from '@mui/material';
import { Check } from '@mui/icons-material';

// Colores de avatar por jugador (consistentes)
const PLAYER_COLORS = {
  Lucas: '#1976d2',    // Azul
  Ricardo: '#388e3c',  // Verde
  Martin: '#f57c00',   // Naranja
  Bort: '#7b1fa2',     // Morado
  Invitado: '#616161', // Gris
};

// Obtener iniciales del nombre
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Obtener color del avatar
const getAvatarColor = (name) => {
  return PLAYER_COLORS[name] || '#616161';
};

const PlayerChip = React.memo(({
  player,
  selected = false,
  disabled = false,
  onClick,
  size = 'medium', // 'small', 'medium', 'large'
  showName = true,
  pairColor, // Color del equipo (para indicar a qué pareja pertenece)
}) => {
  const theme = useTheme();

  const sizes = {
    small: {
      avatar: 32,
      fontSize: '0.7rem',
      nameFontSize: '0.65rem',
      padding: 0.5,
    },
    medium: {
      avatar: 48,
      fontSize: '0.9rem',
      nameFontSize: '0.75rem',
      padding: 1,
    },
    large: {
      avatar: 64,
      fontSize: '1.1rem',
      nameFontSize: '0.85rem',
      padding: 1.5,
    },
  };

  const currentSize = sizes[size] || sizes.medium;
  const avatarColor = getAvatarColor(player);

  return (
    <Box
      onClick={!disabled ? onClick : undefined}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        p: currentSize.padding,
        borderRadius: 2,
        transition: 'all 0.2s ease',
        backgroundColor: selected
          ? alpha(pairColor || theme.palette.primary.main, 0.12)
          : 'transparent',
        border: selected
          ? `2px solid ${pairColor || theme.palette.primary.main}`
          : '2px solid transparent',
        '&:hover': !disabled
          ? {
              backgroundColor: alpha(
                pairColor || theme.palette.primary.main,
                selected ? 0.18 : 0.06
              ),
              transform: 'scale(1.05)',
            }
          : {},
        '&:active': !disabled
          ? {
              transform: 'scale(0.98)',
            }
          : {},
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar
          sx={{
            width: currentSize.avatar,
            height: currentSize.avatar,
            backgroundColor: avatarColor,
            fontSize: currentSize.fontSize,
            fontWeight: 600,
            boxShadow: selected
              ? `0 0 0 3px ${alpha(pairColor || avatarColor, 0.4)}`
              : theme.shadows[2],
            transition: 'box-shadow 0.2s ease',
          }}
        >
          {getInitials(player)}
        </Avatar>
        {selected && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: pairColor || theme.palette.primary.main,
              borderRadius: '50%',
              width: currentSize.avatar * 0.4,
              height: currentSize.avatar * 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows[2],
            }}
          >
            <Check
              sx={{
                color: 'white',
                fontSize: currentSize.avatar * 0.3,
              }}
            />
          </Box>
        )}
      </Box>
      {showName && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            fontWeight: selected ? 600 : 400,
            fontSize: currentSize.nameFontSize,
            color: selected
              ? pairColor || theme.palette.primary.main
              : theme.palette.text.secondary,
            textAlign: 'center',
            maxWidth: currentSize.avatar + 20,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {player}
        </Typography>
      )}
    </Box>
  );
});

// Componente para seleccionar jugadores de una pareja
export const PlayerSelector = ({
  players,
  selectedPlayers = [],
  disabledPlayers = [],
  onSelect,
  pairColor,
  maxSelections = 2,
  label,
}) => {
  const theme = useTheme();

  const handleSelect = (player) => {
    if (disabledPlayers.includes(player)) return;

    if (selectedPlayers.includes(player)) {
      // Deseleccionar
      onSelect(selectedPlayers.filter((p) => p !== player));
    } else if (selectedPlayers.length < maxSelections) {
      // Seleccionar
      onSelect([...selectedPlayers, player]);
    }
  };

  return (
    <Box>
      {label && (
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1.5,
            fontWeight: 600,
            color: pairColor || theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: pairColor || theme.palette.primary.main,
            }}
          />
          {label}
          <Typography
            component="span"
            variant="caption"
            sx={{ color: theme.palette.text.secondary, ml: 'auto' }}
          >
            {selectedPlayers.length}/{maxSelections}
          </Typography>
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        {players.map((player) => (
          <PlayerChip
            key={player}
            player={player}
            selected={selectedPlayers.includes(player)}
            disabled={
              disabledPlayers.includes(player) ||
              (!selectedPlayers.includes(player) &&
                selectedPlayers.length >= maxSelections)
            }
            onClick={() => handleSelect(player)}
            pairColor={pairColor}
            size="medium"
          />
        ))}
      </Box>
    </Box>
  );
};

export default PlayerChip;
