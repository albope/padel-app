// App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box, CircularProgress } from '@mui/material';
import { AnimatePresence } from 'framer-motion';

// Theme
import theme from './theme';

// Context Providers
import { SnackbarProvider } from './context/SnackbarContext';
import { ConfirmDialogProvider } from './context/ConfirmDialog';
import { DataProvider } from './context/DataContext';

// Components cargados inmediatamente (críticos)
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loading de páginas (code splitting)
const HomePage = lazy(() => import('./components/HomePage'));
const ResultForm = lazy(() => import('./components/ResultForm'));
const MatchInfo = lazy(() => import('./components/MatchInfo'));
const Players = lazy(() => import('./components/Players'));
const Insignias = lazy(() => import('./components/Insignias'));
const StatsCharts = lazy(() => import('./components/StatsCharts'));

// Loading component para Suspense
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <CircularProgress size={48} />
  </Box>
);

// Componente interno para acceder a useLocation dentro del Router
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
            <Route path="/add-result" element={<PageTransition><ResultForm /></PageTransition>} />
            <Route path="/info" element={<PageTransition><MatchInfo /></PageTransition>} />
            <Route path="/players" element={<PageTransition><Players /></PageTransition>} />
            <Route path="/insignias" element={<PageTransition><Insignias /></PageTransition>} />
            <Route path="/stats-charts" element={<PageTransition><StatsCharts /></PageTransition>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Layout>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <ConfirmDialogProvider>
            <DataProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Router>
                  <ScrollToTop />
                  <OfflineBanner />
                  <InstallPrompt />
                  <AnimatedRoutes />
                </Router>
              </LocalizationProvider>
            </DataProvider>
          </ConfirmDialogProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
