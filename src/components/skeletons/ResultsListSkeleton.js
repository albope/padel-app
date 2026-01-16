// ResultsListSkeleton.js - Skeleton loader para ResultsList
import React from 'react';
import { Box, Grid, Paper, Skeleton, useTheme } from '@mui/material';
import MatchCardSkeleton from './MatchCardSkeleton';

const ResultsListSkeleton = ({ itemCount = 5 }) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header con filtros */}
      <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3, borderRadius: 3 }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2, mx: 'auto' }} />
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={5}>
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de cards */}
      <Grid container spacing={2.5}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <Grid item xs={12} key={index}>
            <MatchCardSkeleton />
          </Grid>
        ))}
      </Grid>

      {/* Paginación */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          mb: 2,
        }}
      >
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1, mr: 2 }} />
        <Skeleton variant="text" width={80} height={20} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1, ml: 2 }} />
      </Box>
    </Box>
  );
};

export default ResultsListSkeleton;
