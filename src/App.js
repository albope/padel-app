// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Theme
import theme from './theme';

// Components
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './components/HomePage';
import ResultForm from './components/ResultForm';
import MatchInfo from './components/MatchInfo';
import Players from './components/Players';
import Insignias from './components/Insignias';
import StatsCharts from './components/StatsCharts';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/add-result" element={<ResultForm />} />
              <Route path="/info" element={<MatchInfo />} />
              <Route path="/players" element={<Players />} />
              <Route path="/insignias" element={<Insignias />} />
              <Route path="/stats-charts" element={<StatsCharts />} />
            </Routes>
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
