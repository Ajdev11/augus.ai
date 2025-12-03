import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout } from './auth';

export default function ProtectedRoute({ children }) {
  // Call hooks unconditionally at the top to satisfy Rules of Hooks
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes
  const WARNING_MS = 30 * 1000; // show 30s before logout
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed) return;

    const clearAll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };

    const schedule = () => {
      clearAll();
      setShowWarning(false);
      timerRef.current = setTimeout(() => {
        logout();
        navigate('/session', { replace: true });
      }, INACTIVITY_MS);
      // Warning timer
      warnTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        setSecondsLeft(30);
        countdownRef.current = setInterval(() => {
          setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
      }, Math.max(0, INACTIVITY_MS - WARNING_MS));
    };

    const reset = () => schedule();
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    document.addEventListener('visibilitychange', reset);

    schedule();

    return () => {
      clearAll();
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', reset);
    };
  }, [authed, navigate]);

  if (!authed) {
    return <Navigate to="/session" replace />;
  }
  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
          <div className="mx-auto max-w-md rounded-xl bg-black/90 text-white ring-1 ring-white/10 p-4 shadow-lg">
            <div className="text-sm">
              You’ve been inactive. Auto sign-out in {secondsLeft}s.
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              <button
                className="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/20 hover:bg-white/5"
                onClick={() => {
                  // reset timers and hide warning
                  setShowWarning(false);
                  if (countdownRef.current) clearInterval(countdownRef.current);
                  // Manually dispatch a fake activity to reuse the same scheduling path
                  window.dispatchEvent(new Event('mousemove'));
                }}
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


