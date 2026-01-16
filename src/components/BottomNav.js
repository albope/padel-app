// src/components/BottomNav.js - Premium "Athletic Luxury Club" Design
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction, useTheme, alpha, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import BarChartIcon from '@mui/icons-material/BarChart';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { hapticLight } from '../utils/haptics';

const navItems = [
  { label: 'Inicio', icon: <HomeIcon />, path: '/' },
  { label: 'Añadir', icon: <AddCircleOutlineIcon />, path: '/add-result' },
  { label: 'Calendario', icon: <CalendarMonthIcon />, path: '/info' },
  { label: 'Ranking', icon: <LeaderboardIcon />, path: '/players' },
  { label: 'Insignias', icon: <MilitaryTechIcon />, path: '/insignias' },
  { label: 'Stats', icon: <BarChartIcon />, path: '/stats-charts' },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const currentIndex = navItems.findIndex(item => item.path === location.pathname);
  const [selectedIndex, setSelectedIndex] = useState(currentIndex >= 0 ? currentIndex : 0);

  // Liquid Blob Animation Values
  const blobX = useMotionValue(0);
  const blobWidth = 60; // Width of each nav item (approximate)

  // Update blob position when selection changes
  useEffect(() => {
    const newIndex = currentIndex >= 0 ? currentIndex : 0;
    setSelectedIndex(newIndex);

    // Animate blob to new position with spring physics
    const targetX = newIndex * (100 / navItems.length);
    animate(blobX, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    });
  }, [currentIndex, blobX]);

  // Transform blob position to percentage
  const blobLeft = useTransform(
    blobX,
    [0, 100],
    ['0%', '100%']
  );

  const handleNavigation = (event, newValue) => {
    hapticLight();
    navigate(navItems[newValue].path);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        borderRadius: 0,
        overflow: 'hidden',
        // Premium Frosted Glass Effect
        backgroundColor: alpha(theme.palette.background.dark, 0.9),
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
        boxShadow: `0 -4px 30px ${alpha(theme.palette.primary.dark, 0.3)}`,
        // Subtle gradient overlay
        backgroundImage: `linear-gradient(0deg, ${alpha(theme.palette.success.main, 0.02)} 0%, transparent 100%)`,
      }}
    >
      {/* Liquid Blob Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: '8px',
            left: blobLeft,
            width: `${100 / navItems.length}%`,
            height: 'calc(100% - 16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Liquid Blob Shape */}
          <Box
            sx={{
              width: '70%',
              height: '75%',
              background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.1)} 50%, transparent 100%)`,
              borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
              filter: 'blur(8px)',
              animation: 'morph 6s ease-in-out infinite',
              '@keyframes morph': {
                '0%, 100%': {
                  borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
                },
                '33%': {
                  borderRadius: '60% 40% 40% 60% / 40% 60% 40% 60%',
                },
                '66%': {
                  borderRadius: '50% 50% 50% 50% / 50% 50% 50% 50%',
                },
              },
            }}
          />
          {/* Solid Gold Underline */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: '15%',
              right: '15%',
              height: '3px',
              background: `linear-gradient(90deg, transparent 0%, ${theme.palette.success.main} 20%, ${theme.palette.success.main} 80%, transparent 100%)`,
              borderRadius: '2px 2px 0 0',
              boxShadow: `0 0 12px ${alpha(theme.palette.success.main, 0.6)}`,
            }}
          />
        </motion.div>
      </Box>

      <BottomNavigation
        value={selectedIndex}
        onChange={handleNavigation}
        showLabels
        sx={{
          height: 72,
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 4px',
            color: alpha(theme.palette.text.primary, 0.6),
            transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            position: 'relative',
            zIndex: 1,
            '&.Mui-selected': {
              color: theme.palette.success.main,
              '& .MuiBottomNavigationAction-label': {
                fontWeight: 700,
                textShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.5)}`,
              },
              '& .MuiSvgIcon-root': {
                filter: `drop-shadow(0 0 6px ${alpha(theme.palette.success.main, 0.6)})`,
                transform: 'scale(1.15)',
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              '& .MuiSvgIcon-root': {
                transform: 'scale(1.1) translateY(-2px)',
              },
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          },
          '& .MuiBottomNavigationAction-label': {
            fontFamily: '"Work Sans", sans-serif',
            fontSize: '0.625rem',
            fontWeight: 500,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            marginTop: '4px',
            '&.Mui-selected': {
              fontSize: '0.6875rem',
            },
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.5rem',
            transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          },
        }}
      >
        {navItems.map((item, index) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={
              <motion.div
                initial={false}
                animate={{
                  scale: selectedIndex === index ? 1.15 : 1,
                  rotateY: selectedIndex === index ? 360 : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  rotateY: {
                    duration: 0.6,
                    ease: 'easeOut',
                  },
                }}
              >
                {item.icon}
              </motion.div>
            }
            sx={{
              // Individual item hover glow
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '0%',
                height: '0%',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.15)} 0%, transparent 70%)`,
                opacity: 0,
                transition: 'all 0.4s ease',
              },
              '&:hover::before': {
                width: '120%',
                height: '120%',
                opacity: 1,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
