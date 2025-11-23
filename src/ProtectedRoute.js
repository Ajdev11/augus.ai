import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/session" replace />;
  }
  return children;
}


