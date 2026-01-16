// src/components/Header.js - Premium "Championship Bar" Design
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, IconButton, useTheme, alpha } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import { motion } from 'framer-motion';
import { tokens } from '../theme';
import { hapticMedium } from '../utils/haptics';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const isHome = location.pathname === '/';

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return null;
      case '/add-result':
        return 'Añadir Resultado';
      case '/info':
        return 'Info Partidas';
      case '/players':
        return 'Ranking';
      case '/insignias':
        return 'Insignias';
      case '/stats-charts':
        return 'Estadísticas';
      default:
        return 'Padel Mas Camarena';
    }
  };

  const pageTitle = getPageTitle();

  const handleBackClick = () => {
    hapticMedium();
    navigate(-1);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.dark, 0.92),
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderBottom: 'none',
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.dark, 0.4)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        // Bevel effect on edges
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.success.main, 0.3)} 50%, transparent 100%)`,
        },
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 72, sm: 80 },
          px: { xs: 2, sm: 3 },
          flexDirection: 'column',
          justifyContent: 'center',
          pt: 1,
        }}
      >
        {/* Main Header Content */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            mb: 1,
          }}
        >
          {/* Back Button */}
          {!isHome && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <IconButton
                edge="start"
                onClick={handleBackClick}
                sx={{
                  mr: 2,
                  color: theme.palette.text.primary,
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.success.main, 0.2),
                    transform: 'scale(1.1)',
                    boxShadow: theme.shadows[16],
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
                aria-label="Volver"
              >
                <ArrowBackIcon />
              </IconButton>
            </motion.div>
          )}

          {/* Logo with Rotating Ring */}
          {isHome ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: { xs: 2.5, sm: 3 },
                  cursor: 'pointer',
                  '&:hover': {
                    '& .rotating-ring': {
                      animationDuration: '4s',
                    },
                  },
                }}
                onClick={() => {
                  hapticMedium();
                  navigate('/');
                }}
              >
                {/* Rotating Gold Ring */}
                <Box
                  className="rotating-ring"
                  sx={{
                    position: 'absolute',
                    width: { xs: 52, sm: 60 },
                    height: { xs: 52, sm: 60 },
                    borderRadius: '50%',
                    border: `2px solid transparent`,
                    borderTopColor: theme.palette.success.main,
                    borderRightColor: alpha(theme.palette.success.main, 0.5),
                    animation: 'rotate 8s linear infinite',
                    '@keyframes rotate': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                {/* Secondary Ring (opposite direction) */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: { xs: 44, sm: 50 },
                    height: { xs: 44, sm: 50 },
                    borderRadius: '50%',
                    border: `1px solid transparent`,
                    borderBottomColor: alpha(theme.palette.success.main, 0.3),
                    borderLeftColor: alpha(theme.palette.success.main, 0.15),
                    animation: 'rotateReverse 12s linear infinite',
                    '@keyframes rotateReverse': {
                      '0%': { transform: 'rotate(360deg)' },
                      '100%': { transform: 'rotate(0deg)' },
                    },
                  }}
                />
                {/* Logo Icon */}
                <SportsTennisIcon
                  sx={{
                    position: 'relative',
                    fontSize: { xs: 28, sm: 32 },
                    color: theme.palette.success.main,
                    filter: 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.5))',
                    zIndex: 1,
                  }}
                />
              </Box>
            </motion.div>
          ) : null}

          {/* Title */}
          <motion.div
            key={isHome ? 'home' : location.pathname}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ flexGrow: 1 }}
          >
            <Typography
              variant={isHome ? 'h5' : 'h6'}
              component="h1"
              sx={{
                fontFamily: tokens.typography.displayFont,
                fontWeight: 400,
                fontSize: isHome ? { xs: '1.5rem', sm: '1.75rem' } : { xs: '1.25rem', sm: '1.4rem' },
                color: theme.palette.text.primary,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {isHome ? 'Padel Mas Camarena' : pageTitle}
            </Typography>
          </motion.div>

          {/* LIVE Indicator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: tokens.borderRadius.pill,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
              }}
            >
              {/* Pulsing Dot */}
              <Box
                sx={{
                  position: 'relative',
                  width: 8,
                  height: 8,
                }}
              >
                {/* Ping animation */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                    '@keyframes ping': {
                      '0%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                      '75%, 100%': {
                        transform: 'scale(2)',
                        opacity: 0,
                      },
                    },
                  }}
                />
                {/* Solid dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    boxShadow: `0 0 8px ${theme.palette.success.main}`,
                  }}
                />
              </Box>
              {/* LIVE Text */}
              <Typography
                sx={{
                  fontFamily: tokens.typography.bodyFont,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: theme.palette.success.main,
                  textTransform: 'uppercase',
                }}
              >
                Live
              </Typography>
            </Box>
          </motion.div>
        </Box>

        {/* Championship Gold Bar */}
        <Box
          sx={{
            width: '100%',
            height: 3,
            borderRadius: tokens.borderRadius.pill,
            background: `linear-gradient(90deg,
              transparent 0%,
              ${alpha(theme.palette.success.main, 0.3)} 10%,
              ${theme.palette.success.main} 50%,
              ${alpha(theme.palette.success.main, 0.3)} 90%,
              transparent 100%
            )`,
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '50%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha('#FFFFFF', 0.4)}, transparent)`,
              animation: 'shimmer 3s ease-in-out infinite',
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '200%' },
              },
            },
          }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
