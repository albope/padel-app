import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ResultsList from './ResultsList';

const HomePage = () => {
  return (
    <Container maxWidth="sm" disableGutters>
      {/* Encabezado de la App con logo y texto estilo minimalista */}
      <Box
        sx={{
          backgroundColor: 'transparent',
          color: 'black',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start', // Alineado a la izquierda
          fontFamily: '"Roboto", sans-serif', // Fuente moderna
        }}
      >
        {/* Logo de la raqueta */}
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/pelota-de-padel.ico`} // Ruta al logo de la raqueta
          alt="Raqueta"
          sx={{
            height: '40px', // Tamaño del logo ajustado para minimalismo
            marginRight: '15px', // Espacio adecuado entre logo y texto
          }}
        />

        {/* Título más estilizado y minimalista */}
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{
            fontWeight: 'bold', 
            letterSpacing: '1px', 
            fontSize: '1.8rem', // Tamaño más moderado para un look refinado
            color: '#333', // Color sutil para el texto
          }}
        >
          Padel Mas Camarena
        </Typography>
      </Box>

      {/* Lista de Resultados */}
      <ResultsList />
    </Container>
  );
};

export default HomePage;