import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ResultsList from './ResultsList';

const HomePage = () => {
  return (
    <Container maxWidth="sm" disableGutters>
      {/* Encabezado de la App sin fondo negro y con texto negro */}
      <Box
        sx={{
          backgroundColor: 'transparent', // Sin fondo
          color: 'black', // Texto en negro
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1">
          Padel Mas Camarena
        </Typography>
      </Box>

      {/* Lista de Resultados */}
      <ResultsList />
    </Container>
  );
};

export default HomePage;