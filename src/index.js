import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter, Routes, Route } from 'react-router-dom';
import SessionPage from './pages/SessionPage';
import SessionDashboard from './pages/SessionDashboard';
import ProtectedRoute from './ProtectedRoute';
import ResetPassword from './pages/ResetPassword';
import OAuthHandler from './pages/OAuthHandler';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/oauth" element={<OAuthHandler />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SessionDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

// App bootstrapped
