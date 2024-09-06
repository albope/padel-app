import React from 'react';
import { Button, Container, Typography } from '@mui/material';

const HomePage = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>Últimos partidos</Typography>
      {/* Aquí mostrarás los resultados */}
      <Button variant="contained" color="primary" href="/add-result">Añadir Resultado</Button>
    </Container>
  );
};

export default HomePage;
