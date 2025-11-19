import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter, Routes, Route } from 'react-router-dom';
import SessionPage from './pages/SessionPage';
import SessionDashboard from './pages/SessionDashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/dashboard" element={<SessionDashboard />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

// App bootstrapped
