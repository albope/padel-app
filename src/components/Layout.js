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

      <BottomNav />
    </Box>
  );
};

export default Layout;
