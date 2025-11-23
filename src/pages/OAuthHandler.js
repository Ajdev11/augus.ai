import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../auth';

export default function OAuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search || (location.hash.includes('?') ? location.hash.split('?')[1] : ''));
    const token = params.get('token');
    if (token) {
      login(token);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/session', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-sm text-white/70">Signing you in…</div>
    </div>
  );
}


