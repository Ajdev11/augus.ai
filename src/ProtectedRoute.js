import React, { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from './auth';

export default function ProtectedRoute({ children }) {
  // Call hooks unconditionally at the top to satisfy Rules of Hooks
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed) return;

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
        navigate('/session', { replace: true });
      }, INACTIVITY_MS);
    };

    const reset = () => schedule();
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener('visibilitychange', reset);

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', reset);
    };
  }, [authed, navigate]);

  if (!authed) {
    return <Navigate to="/session" replace />;
  }
  return children;
}


