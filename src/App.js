import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import ResultForm from './components/ResultForm';
import StatsChart from './components/StatsChart';
import MatchInfo from './components/MatchInfo';
import Players from './components/Players';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add-result" element={<ResultForm />} />
        <Route path="/stats" element={<StatsChart />} />
        <Route path="/info" element={<MatchInfo />} />
        <Route path="/players" element={<Players />} />
      </Routes>

      {/* Footer añadido */}
      <footer style={{ textAlign: 'center', padding: '20px 0', backgroundColor: '#f1f1f1', color: '#333', fontSize: '14px', marginTop: '30px' }}>
        © <strong>2024</strong> Made by Alberto Bort
      </footer>
    </Router>
  );
};

export default App;