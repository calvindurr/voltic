import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard, Sites, Portfolios, Forecasts } from './pages';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="sites" element={<Sites />} />
              <Route path="portfolios" element={<Portfolios />} />
              <Route path="forecasts" element={<Forecasts />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
