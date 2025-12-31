import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../auth';
import { apiFetch, API_BASE } from '../api';

export default function SessionPage() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin' | 'forgot'
  const navigate = useNavigate();

  // If already authenticated, redirect away from auth page
  React.useEffect(() => {
    const remember = localStorage.getItem('augus_remember') === '1';
    if (isAuthenticated() && remember) {
      navigate('/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignup({ email, password }) {
    const res = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // After successful registration, direct user to Sign in
    setMode('signin');
  }
  async function handleSignin({ email, password }) {
    const res = await apiFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    login(res.token);
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold">Welcome to augus.ai</h1>
          <p className="mt-2 text-sm text-white/70">Create an account or sign in to begin your session.</p>
        </div>

        <div className="flex rounded-full bg-white/10 p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-semibold ${mode === 'signup' ? 'bg-white text-black' : 'text-white/80 hover:text-white'}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-semibold ${mode === 'signin' ? 'bg-white text-black' : 'text-white/80 hover:text-white'}`}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
          {mode === 'signup' ? <SignupForm onSuccess={handleSignup} /> : mode === 'signin' ? <SigninForm onSuccess={handleSignin} onForgot={()=>setMode('forgot')} /> : <ForgotForm onBack={()=>setMode('signin')} />}
          <SocialAuth />
          <div className="mt-6 text-center text-xs text-white/60">
            By continuing you agree to the Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', placeholder, value, onChange }) {
  return (
    <label className="block mb-4">
      <span className="block mb-2 text-sm font-medium text-white/90">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
    </label>
  );
}

function SignupForm({ onSuccess }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const submit = async () => {
    try {
      setLoading(true); setError('');
      await onSuccess({ email, password });
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  };
  return (
    <form className="space-y-2" onSubmit={(e)=>{e.preventDefault(); submit();}}>
      {error && <div className="text-xs text-red-400">{error}</div>}
      <Input label="Email" type="email" placeholder="you@domain.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <label className="block mb-2">
        <span className="block mb-2 text-sm font-medium text-white/90">Password</span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 pr-24 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 text-xs font-semibold text-white/70 hover:text-white"
            onClick={()=>setShowPassword((v)=>!v)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
        onClick={submit}
      >
        {loading ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}

function SigninForm({ onSuccess, onForgot }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const submit = async () => {
    try {
      setLoading(true); setError(''); setInfo('');
      await onSuccess({ email, password });
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  };
  return (
    <form className="space-y-2" onSubmit={(e)=>{e.preventDefault(); submit();}}>
      {error && <div className="text-xs text-red-400">{error}</div>}
      {info && <div className="text-xs text-emerald-400">{info}</div>}
      <Input label="Email" type="email" placeholder="you@domain.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <label className="block mb-2">
        <span className="block mb-2 text-sm font-medium text-white/90">Password</span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 pr-24 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 text-xs font-semibold text-white/70 hover:text-white"
            onClick={()=>setShowPassword((v)=>!v)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>
      <div className="flex items-center justify-between text-sm text-white/70 mb-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded bg-black/40 border-white/20"
            onChange={(e) => localStorage.setItem('augus_remember', e.target.checked ? '1' : '0')}
          />
          Remember me
        </label>
        <button type="button" className="hover:text-white" onClick={onForgot}>Forgot password?</button>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
        onClick={submit}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function ForgotForm({ onBack }) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  return (
    <form className="space-y-3">
      {message && <div className="text-xs text-emerald-400">{message}</div>}
      {error && <div className="text-xs text-red-400">{error}</div>}
      <Input label="Email" type="email" placeholder="you@domain.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={loading}
          className="flex-1 rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
          onClick={async()=>{
            try{
              setLoading(true); setError(''); setMessage('');
              const trimmed = String(email || '').trim();
              // Basic email validation
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
                throw new Error('Enter a valid email address');
              }
              // Try POST first
              try {
                await apiFetch('/auth/forgot', { method: 'POST', body: JSON.stringify({ email: trimmed }) });
              } catch (e) {
                // Fallback to GET (query) if POST fails (older proxies)
                await apiFetch(`/auth/forgot?email=${encodeURIComponent(trimmed)}`, { method: 'GET' });
              }
              setMessage('If the email exists, a reset link has been sent.');
            }catch(e){ setError(e.message || 'Could not send reset link'); } finally { setLoading(false); }
          }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <button type="button" className="rounded-full ring-1 ring-white/15 px-4 py-2 text-sm hover:bg-white/5" onClick={onBack}>
          Back to sign in
        </button>
      </div>
      <div className="text-xs text-white/50">
        Tip: Check your spam folder. If you still don’t receive an email, try again later.
      </div>
    </form>
  );
}

function SocialAuth() {
  const base = API_BASE || '';
  const [providers, setProviders] = useState({ google: true });
  const [loadedProviders, setLoadedProviders] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${base}/api/oauth/providers`, { credentials: 'include' });
        if (!mounted) return;
        const json = await res.json();
        if (json && typeof json === 'object') setProviders(json);
      } catch {
        // ignore fetch errors, keep default
      } finally {
        if (mounted) setLoadedProviders(true);
      }
    })();
    return () => { mounted = false; };
  }, [base]);

  const showGoogle = providers?.google;
  return (
    <div className="mt-7">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/5 px-2 text-xs text-white/60">or continue with</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3">
        {showGoogle && (
          <a
            href={`${base}/api/oauth/google`}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-white text-black px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Continue with Google"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.5 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 3l5.7-5.7C33.6 6.7 28.9 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.6-.2-3.1-.4-4.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.7 3l5.7-5.7C33.6 6.7 28.9 5 24 5c-7.4 0-13.7 4.1-17.7 9.7z"/>
              <path fill="#4CAF50" d="M24 45c5.2 0 9.6-1.7 12.8-4.7l-5.9-4.8c-2 1.4-4.6 2.3-6.9 2.3-5.2 0-9.5-3.4-11.1-8l-6.6 5.1C9.1 40.9 16.1 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.1-6.1 7-11.3 7-5.7 0-10.5-3.9-12.2-9.1l-6.6 5.1C8.3 39.6 15.6 45 24 45c9.5 0 17.5-6.6 19.6-15.5.4-1.6.6-3.2.6-5s-.2-3.4-.6-5z"/>
            </svg>
            <span>Google</span>
          </a>
        )}
        {loadedProviders && !showGoogle && (
          <div className="text-center text-xs text-white/60">
            No social providers are enabled.
          </div>
        )}
      </div>
    </div>
  );
}


