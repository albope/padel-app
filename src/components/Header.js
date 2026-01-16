// src/components/Header.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, IconButton, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const isHome = location.pathname === '/';

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return null; // En home mostramos el logo
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
        return 'Padel +K';
    }
  };

  const pageTitle = getPageTitle();

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {!isHome && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 1 }}
            aria-label="Volver"
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {isHome ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Box
              component="img"
              src={`${process.env.PUBLIC_URL}/pelota-de-padel.ico`}
              alt="Logo Padel"
              sx={{
                height: { xs: 36, sm: 42 },
                width: 'auto',
                mr: 1.5,
              }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                letterSpacing: '-0.5px',
              }}
            >
              Padel +K
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {pageTitle}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
