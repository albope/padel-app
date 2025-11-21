// src/components/BottomNav.js
import React from 'react';
import { Paper, Grid, Button, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AddCircleOutline as AddIcon,
  Info as InfoIcon,
  Leaderboard as RankingIcon,
  MilitaryTech as InsigniasIcon,
  BarChart as StatsIcon,
  Home as HomeIcon
} from '@mui/icons-material';

const BottomNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationButtons = [
    { label: 'Inicio', icon: <HomeIcon />, path: '/', color: 'default' }, // default usará gris/primary
    { label: 'Añadir', icon: <AddIcon />, path: '/add-result', color: 'primary' },
    { label: 'Info', icon: <InfoIcon />, path: '/info', color: 'info' },
    { label: 'Ranking', icon: <RankingIcon />, path: '/players', color: 'success' },
    { label: 'Logros', icon: <InsigniasIcon />, path: '/insignias', color: 'warning' },
    { label: 'Stats', icon: <StatsIcon />, path: '/stats-charts', color: 'secondary' }
  ];

  return (
    <Paper 
      elevation={10} 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1300, 
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper, // Mantenemos el blanco/papel
        paddingBottom: 'env(safe-area-inset-bottom)' // Para iPhone X/11/12+ (la barra negra de abajo)
      }}
    >
      <Grid container spacing={0} justifyContent="space-between">
        {navigationButtons.map((item) => {
          const isActive = location.pathname === item.path;
          
          // Lógica de color:
          // Si está activo: Usar el color específico de la sección (o primary si no tiene).
          // Si está inactivo: Usar gris (text.secondary).
          let iconColor = theme.palette.text.secondary;
          
          if (isActive) {
             if (item.color === 'default') iconColor = theme.palette.primary.main;
             else if (theme.palette[item.color]) iconColor = theme.palette[item.color].main;
             else iconColor = theme.palette.primary.main;
          }

          return (
            <Grid item xs key={item.label} sx={{ textAlign: 'center' }}>
              <Button
                fullWidth
                onClick={() => navigate(item.path)}
                sx={{
                  flexDirection: 'column',
                  py: 0.8,
                  px: 0,
                  borderRadius: 0,
                  minWidth: 'auto',
                  color: iconColor,
                  textTransform: 'none',
                  transition: 'color 0.3s ease', // Suaviza el cambio de color
                  '& .MuiButton-startIcon': { 
                      margin: 0, 
                      mb: 0.3, 
                      color: iconColor, // Forzar color al icono
                      '& > *:first-of-type': { 
                          fontSize: isActive ? 24 : 22, // Un pelín más grande si está activo
                          transition: 'all 0.2s ease'
                      } 
                  }
                }}
                startIcon={item.icon}
              >
                <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: isActive ? 'bold' : 'normal', 
                    letterSpacing: '-0.2px',
                    color: iconColor 
                }}>
                  {item.label}
                </span>
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default BottomNav;