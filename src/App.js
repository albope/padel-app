// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';

// --- COMPONENTES ---
import HomePage from './components/HomePage';
import ResultForm from './components/ResultForm';
import MatchInfo from './components/MatchInfo';
import Players from './components/Players';
import Insignias from './components/Insignias';
import ScrollToTop from './components/ScrollToTop';
import StatsCharts from './components/StatsCharts';
import BottomNav from './components/BottomNav'; // <--- IMPORTANTE: Tu barra de navegación

// --- TEMA GLOBAL ---
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Azul principal
    },
    secondary: {
      main: '#dc004e', // Rosa/Rojo secundario
    },
    background: {
      default: '#f4f6f8', // Un gris muy suave para el fondo global
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 800, // Más peso para títulos grandes
    },
    subtitle1: {
      fontWeight: 600,
    }
  },
  shape: {
    borderRadius: 12, // Bordes redondeados globales más modernos
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Evitar mayúsculas forzadas en botones
          fontWeight: 'bold',
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline normaliza estilos y aplica el background del tema al body */}
      <CssBaseline /> 
      
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <ScrollToTop />
          
          {/* CONTENEDOR PRINCIPAL (Layout Flex) */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '100vh',
              // Padding Bottom IMPORTANTE: 
              // Deja espacio (aprox 56px + extra) para que la barra de navegación no tape nada
              pb: { xs: 8, sm: 9 } 
            }}
          >
            
            {/* Área de Contenido (Crece para ocupar espacio) */}
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/add-result" element={<ResultForm />} />
                <Route path="/info" element={<MatchInfo />} />
                <Route path="/players" element={<Players />} />
                <Route path="/insignias" element={<Insignias />} />
                <Route path="/stats-charts" element={<StatsCharts />} />
              </Routes>
            </Box>

            {/* Footer */}
            <Box 
              component="footer" 
              sx={{ 
                textAlign: 'center', 
                py: 3, 
                bgcolor: 'rgba(0,0,0,0.03)', // Color sutil diferente al fondo
                color: 'text.secondary', 
                fontSize: '0.875rem'
              }}
            >
              © <strong>{new Date().getFullYear()}</strong> Made with <span style={{ fontSize: '1.2rem', verticalAlign: 'middle', color: '#dc004e' }}>❤️</span> by Alberto Bort
            </Box>

            {/* BARRA DE NAVEGACIÓN FIJA */}
            <BottomNav />

          </Box>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;