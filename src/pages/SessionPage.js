import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SessionPage() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin'
  const navigate = useNavigate();

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
          {mode === 'signup' ? <SignupForm onSuccess={() => navigate('/dashboard')} /> : <SigninForm onSuccess={() => navigate('/dashboard')} />}
          <SocialAuth />
          <div className="mt-5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 ring-1 ring-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Continue as guest (skip for now)
            </button>
          </div>
          <div className="mt-6 text-center text-xs text-white/60">
            By continuing you agree to the Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', placeholder }) {
  return (
    <label className="block mb-4">
      <span className="block mb-2 text-sm font-medium text-white/90">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
    </label>
  );
}

function SignupForm({ onSuccess }) {
  return (
    <form className="space-y-2">
      <Input label="Email" type="email" placeholder="you@domain.com" />
      <Input label="Password" type="password" placeholder="••••••••" />
      <button
        type="button"
        className="mt-2 w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        onClick={onSuccess}
      >
        Create account
      </button>
    </form>
  );
}

function SigninForm({ onSuccess }) {
  return (
    <form className="space-y-2">
      <Input label="Email" type="email" placeholder="you@domain.com" />
      <Input label="Password" type="password" placeholder="••••••••" />
      <div className="flex items-center justify-between text-sm text-white/70 mb-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="rounded bg-black/40 border-white/20" />
          Remember me
        </label>
        <button type="button" className="hover:text-white">Forgot password?</button>
      </div>
      <button
        type="button"
        className="w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        onClick={onSuccess}
      >
        Sign in
      </button>
    </form>
  );
}

function SocialAuth() {
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
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-semibold shadow-sm hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Continue with Google"
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
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 text-white px-3 py-2 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Continue with GitHub"
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
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 text-white px-3 py-2 text-sm font-semibold ring-1 ring-white/15 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Continue with Apple"
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
        </button>
      </div>
    </div>
  );
}


