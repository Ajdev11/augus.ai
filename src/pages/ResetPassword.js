import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';

function useQuery() {
  const { search, hash } = useLocation();
  // Support both /reset?token= and /#/reset?token= styles
  const qs = new URLSearchParams(search || (hash.includes('?') ? hash.split('?')[1] : ''));
  return qs;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
        <h1 className="text-xl font-extrabold">Reset password</h1>
        {!token && <p className="mt-2 text-sm text-red-400">Invalid or missing token.</p>}
        {message && <p className="mt-2 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <label className="block mt-4">
          <span className="block mb-2 text-sm font-medium text-white/90">New password</span>
          <input
            type="password"
            className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={loading || !token}
          className="mt-4 w-full rounded-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
          onClick={async()=>{
            try{
              setLoading(true); setError(''); setMessage('');
              await apiFetch('/auth/reset', { method:'POST', body: JSON.stringify({ token, password }) });
              setMessage('Password reset successful. You can now sign in.');
              setTimeout(()=> navigate('/session'), 1000);
            }catch(e){ setError(e.message); } finally { setLoading(false); }
          }}
        >
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
        <button
          type="button"
          className="mt-3 w-full rounded-full ring-1 ring-white/15 text-white/80 hover:text-white hover:bg-white/5 py-2"
          onClick={()=>navigate('/session')}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}


