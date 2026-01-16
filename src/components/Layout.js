// src/components/Layout.js
import React from 'react';
import { Box, useTheme } from '@mui/material';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Header />

      <Box
        component="main"
        sx={{
          flex: 1,
          pb: '80px', // Espacio para BottomNav (64px) + margen
        }}
      >
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 64, // Encima del BottomNav
          left: 0,
          right: 0,
          textAlign: 'center',
          py: 1,
          backgroundColor: theme.palette.grey[100],
          borderTop: `1px solid ${theme.palette.divider}`,
          fontSize: '0.75rem',
          color: theme.palette.text.secondary,
          zIndex: theme.zIndex.appBar - 1,
        }}
      >
        © {new Date().getFullYear()} Made with ❤️ by Alberto Bort
      </Box>

      <BottomNav />
    </Box>
  );
};

export default Layout;
