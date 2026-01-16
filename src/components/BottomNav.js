// src/components/BottomNav.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction, useTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import BarChartIcon from '@mui/icons-material/BarChart';

const navItems = [
  { label: 'Inicio', icon: <HomeIcon />, path: '/' },
  { label: 'Añadir', icon: <AddCircleOutlineIcon />, path: '/add-result' },
  { label: 'Info', icon: <InfoIcon />, path: '/info' },
  { label: 'Ranking', icon: <LeaderboardIcon />, path: '/players' },
  { label: 'Insignias', icon: <MilitaryTechIcon />, path: '/insignias' },
  { label: 'Stats', icon: <BarChartIcon />, path: '/stats-charts' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const currentIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderRadius: 0,
      }}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(event, newValue) => {
          navigate(navItems[newValue].path);
        }}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 0',
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.65rem',
            '&.Mui-selected': {
              fontSize: '0.7rem',
            },
          },
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
