// App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import ResultForm from './components/ResultForm';
import MatchInfo from './components/MatchInfo';
import Players from './components/Players';
import Insignias from './components/Insignias';
import ScrollToTop from './components/ScrollToTop';
import StatsCharts from './components/StatsCharts';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Router>
        <ScrollToTop />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Contenido de la app */}
          <div style={{ flex: '1' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/add-result" element={<ResultForm />} />
              <Route path="/info" element={<MatchInfo />} />
              <Route path="/players" element={<Players />} />
              <Route path="/insignias" element={<Insignias />} />
              <Route path="/stats-charts" element={<StatsCharts />} />
            </Routes>
          </div>

          {/* Footer común para todas las páginas */}
          <footer style={{ textAlign: 'center', padding: '20px 0', backgroundColor: '#f1f1f1', color: '#333', fontSize: '14px', marginTop: '30px' }}>
            © <strong>2024</strong> Made with <span style={{ fontSize: '16px' }}>❤️</span> by Alberto Bort
          </footer>
        </div>
      </Router>
    </LocalizationProvider>
  );
};

export default App;