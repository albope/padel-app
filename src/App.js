import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import ResultForm from './components/ResultForm';
import StatsChart from './components/StatsChart';
import MatchInfo from './components/MatchInfo'; // Importa la nueva página

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add-result" element={<ResultForm />} />
        <Route path="/stats" element={<StatsChart />} />
        <Route path="/info" element={<MatchInfo />} /> {/* Nueva ruta */}
      </Routes>
    </Router>
  );
};

export default App;