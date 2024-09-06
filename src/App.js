import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/HomePage';
import ResultForm from './components/ResultForm';
import StatsChart from './components/StatsChart';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add-result" element={<ResultForm />} />
        <Route path="/stats" element={<StatsChart />} />
      </Routes>
    </Router>
  );
};

export default App;