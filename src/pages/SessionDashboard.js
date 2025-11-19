import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SessionDashboard() {
  const [isMuted, setIsMuted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-white text-[#0b2545]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <div className="text-xl font-extrabold tracking-tight">augus.ai</div>
        </div>
        <Link to="/session" className="text-sm font-medium text-[#0b2545]/80 hover:text-[#0b2545]">
          Need Help?
        </Link>
      </header>

      {/* Main content */}
      <main className="px-6 sm:px-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          {/* Big mic orb */}
          <div className="relative mt-10 sm:mt-14">
            <div className="size-[320px] sm:size-[380px] rounded-full bg-gradient-to-b from-[#dff2ff] to-[#cfe9ff] shadow-[0_30px_120px_rgba(59,130,246,0.3)] ring-8 ring-[#eaf5ff] flex items-end justify-center overflow-hidden">
              <div className="w-full h-1/2 bg-gradient-to-t from-[#c7bfff] to-[#c9f0ff]" />
            </div>
            <button
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-16 sm:size-20 rounded-full bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center"
              aria-label="Microphone"
            >
              {/* mic icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H8v2h8v-2h-3v-2.07A7 7 0 0 0 19 11h-2Z" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={() => setRunning((v) => !v)}
              className="rounded-full bg-emerald-400/90 hover:bg-emerald-400 text-white font-semibold px-6 sm:px-8 py-3 shadow"
            >
              {running ? 'Pause Session' : 'Start Session'}
            </button>

            <button
              onClick={() => setIsMuted((v) => !v)}
              className={`rounded-full px-4 py-3 ring-1 ring-black/10 shadow ${isMuted ? 'bg-rose-50 text-rose-600' : 'bg-white text-[#0b2545]'}`}
              aria-pressed={isMuted}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11a7 7 0 0 1-7 7v-2a5 5 0 0 0 5-5h2Zm-7-9a3 3 0 0 1 3 3v5.59l-6.3-6.3A3 3 0 0 1 12 2Zm-7.3.3 16 16-1.4 1.4-3.1-3.1a6.96 6.96 0 0 1-4.2 1.4v2H8v-2.07A6.99 6.99 0 0 1 5 11h2a5 5 0 0 0 5 5c.93 0 1.8-.26 2.55-.71l-1.55-1.55V10.4L5.7 3.7 4.6 2.3Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H8v2h8v-2h-3v-2.07A7 7 0 0 0 19 11h-2Z" />
                </svg>
              )}
            </button>

            <div className="text-3xl font-extrabold tabular-nums tracking-wider text-[#0b2545]">
              {hh}:{mm}:{ss}
            </div>
          </div>

          {/* Help row */}
          <div className="mt-6 text-sm text-[#0b2545]/70 flex items-center gap-2">
            <span className="inline-flex size-5 items-center justify-center rounded bg-emerald-100 text-emerald-600">✓</span>
            <span>Having Trouble? Please contact</span>
            <a href="mailto:support@augus.ai" className="font-semibold underline underline-offset-2">
              support@augus.ai
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}


