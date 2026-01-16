// PlayerCardSkeleton.js - Skeleton loader para PlayerCard
import React from 'react';
import { Box, Card, Skeleton, useTheme } from '@mui/material';

const PlayerCardSkeleton = () => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        boxShadow: theme.shadows[3],
        height: 400,
      }}
    >
      {/* Imagen del jugador */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={200}
        animation="wave"
      />

      <Box sx={{ p: 2 }}>
        {/* Nombre del jugador */}
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />

        {/* Posición */}
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />

        {/* Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="text" width="30%" height={24} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>

        {/* Eficiencia */}
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="50%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Card>
  );
};

export default PlayerCardSkeleton;
