import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import QuoteBuilderApp from './apps/QuoteBuilderApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quote-builder/*" element={<QuoteBuilderApp />} />
      </Routes>
    </Router>
  );
}

export default App;