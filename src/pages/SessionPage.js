import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth';
import { apiFetch } from '../api';

export default function SessionPage() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin' | 'forgot'
  const navigate = useNavigate();

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
    navigate('/dashboard');
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
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  return (
    <form className="space-y-2">
      {error && <div className="text-xs text-red-400">{error}</div>}
      <Input label="Email" type="email" placeholder="you@domain.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button
        type="button"
        disabled={loading}
        className="mt-2 w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
        onClick={async()=>{
          try {
            setLoading(true); setError('');
            await onSuccess({ email, password });
          } catch(e){ setError(e.message); } finally { setLoading(false); }
        }}
      >
        {loading ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}

function SigninForm({ onSuccess, onForgot }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  return (
    <form className="space-y-2">
      {error && <div className="text-xs text-red-400">{error}</div>}
      <Input label="Email" type="email" placeholder="you@domain.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <div className="flex items-center justify-between text-sm text-white/70 mb-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="rounded bg-black/40 border-white/20" />
          Remember me
        </label>
        <button type="button" className="hover:text-white" onClick={onForgot}>Forgot password?</button>
      </div>
      <button
        type="button"
        disabled={loading}
        className="w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
        onClick={async()=>{
          try {
            setLoading(true); setError('');
            await onSuccess({ email, password });
          } catch(e){ setError(e.message); } finally { setLoading(false); }
        }}
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
              // Use GET by default for maximum compatibility
              await apiFetch(`/auth/forgot?email=${encodeURIComponent(email)}`, { method: 'GET' });
              setMessage('If the email exists, a reset link has been sent.');
            }catch(e){ setError(e.message); } finally { setLoading(false); }
          }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <button type="button" className="rounded-full ring-1 ring-white/15 px-4 py-2 text-sm hover:bg-white/5" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    </form>
  );
}

function SocialAuth() {
  const providers = { google: true, github: true, apple: true }; // default links will work when configured
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
      <div className="mt-5 grid grid-cols-3 gap-3">
        <a
          href="/api/oauth/google"
          className={`inline-flex items-center justify-center gap-2 rounded-lg ${providers.google ? 'bg-white text-black hover:bg-white/90' : 'bg-white/20 text-white/50 cursor-not-allowed'} px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
          aria-label="Continue with Google"
          onClick={(e)=>{ if(!providers.google) e.preventDefault(); }}
        >
          <img
            src="https://cdn.simpleicons.org/google/000000"
            alt=""
            className="h-5 w-5"
            loading="lazy"
            width="20"
            height="20"
          />
          <span className="sr-only">Google</span>
        </a>
        <a
          href="/api/oauth/github"
          className={`inline-flex items-center justify-center gap-2 rounded-lg ${providers.github ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white/10 text-white/40 cursor-not-allowed'} px-3 py-2 text-sm font-semibold ring-1 ring-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
          aria-label="Continue with GitHub"
          onClick={(e)=>{ if(!providers.github) e.preventDefault(); }}
        >
          <img
            src="https://cdn.simpleicons.org/github/FFFFFF"
            alt=""
            className="h-5 w-5"
            loading="lazy"
            width="20"
            height="20"
          />
          <span className="sr-only">GitHub</span>
        </a>
        <a
          href="/api/oauth/apple"
          className={`inline-flex items-center justify-center gap-2 rounded-lg ${providers.apple ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-white/10 text-white/40 cursor-not-allowed'} px-3 py-2 text-sm font-semibold ring-1 ring-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
          aria-label="Continue with Apple"
          onClick={(e)=>{ if(!providers.apple) e.preventDefault(); }}
        >
          <img
            src="https://cdn.simpleicons.org/apple/FFFFFF"
            alt=""
            className="h-5 w-5"
            loading="lazy"
            width="20"
            height="20"
          />
          <span className="sr-only">Apple</span>
        </a>
      </div>
    </div>
  );
}


