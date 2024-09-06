import React from 'react';
import { Button, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ResultsList from './ResultsList'; 

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Últimos partidos
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/add-result')}
      >
        AÑADIR RESULTADO
      </Button>

      {/* Asegúrate de que ResultsList solo se renderiza aquí una vez */}
      <ResultsList />
    </Container>
  );
};

export default HomePage;