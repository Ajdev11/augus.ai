// App-level styles are handled by Tailwind in index.css
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return (
    <div className="relative min-h-screen flex flex-col antialiased font-sans text-white bg-black">
      <header className="px-6 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-90">
            augus.ai
          </Link>
        </div>
        {/* Right-side actions removed */}
      </header>

      <main className="relative flex-1 px-0 sm:px-0">

        {/* Networks style hero with animated rainbow trail */}
        <section className="relative isolate min-h-screen flex items-center justify-center overflow-hidden bg-black text-white" style={{ '--tile': '80px' }}>
          {/* Centered grid area occupies 60% of width; rest stays pure black */}
          <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[70%] max-w-[1200px]">
            {/* Grid background (two layered gradients) */}
            <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:80px_80px] [background-position:0_0,0_0]" />
            {/* Animated rainbow trails within grid area */}
            <div
              className="absolute h-px w-32 rounded-full bg-gradient-to-r from-yellow-300 via-lime-300 via-cyan-300 via-blue-400 to-fuchsia-500 shadow-[0_0_12px_rgba(168,85,247,0.35)] animate-rainbow-travel"
              style={{ top: 'calc(var(--tile) * 2)' }}
              aria-hidden="true"
            />
            <div
              className="absolute h-px w-32 rounded-full bg-gradient-to-r from-fuchsia-500 via-blue-400 via-cyan-300 via-lime-300 to-yellow-300 shadow-[0_0_12px_rgba(168,85,247,0.35)] animate-rainbow-travel-rev"
              style={{ top: 'calc(var(--tile) * 8)' }}
              aria-hidden="true"
            />
            {/* Vertical arrows on left and right grid lines */}
            <div
              className="absolute w-px h-32 rounded-full bg-gradient-to-b from-yellow-300 via-lime-300 via-cyan-300 via-blue-400 to-fuchsia-500 shadow-[0_0_12px_rgba(168,85,247,0.35)] animate-rainbow-travel-y"
              style={{ left: 'calc(var(--tile) * 2)', top: 'calc(var(--tile) * 2)', '--vy': 'calc(var(--tile) * 6)' }}
              aria-hidden="true"
            />
            <div
              className="absolute w-px h-32 rounded-full bg-gradient-to-b from-fuchsia-500 via-blue-400 via-cyan-300 via-lime-300 to-yellow-300 shadow-[0_0_12px_rgba(168,85,247,0.35)] animate-rainbow-travel-y-rev"
              style={{ right: 'calc(var(--tile) * 2)', top: 'calc(var(--tile) * 2)', '--vy': 'calc(var(--tile) * 6)' }}
              aria-hidden="true"
            />
            {/* Floating network badges aligned to grid squares */}
            <div className="absolute inset-0">
              {/* Tile 1 */}
              <div className="absolute" style={{ left: 'calc(var(--tile) * 2)', top: 'calc(var(--tile) * 1.5)' }}>
                <div className="w-[var(--tile)] h-[var(--tile)] rounded-xl border border-white/15 grid place-items-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div className="size-10 sm:size-12 rounded-xl bg-fuchsia-500/90 grid place-items-center text-white font-bold shadow-[0_10px_30px_rgba(236,72,153,0.35)]">✦</div>
                </div>
              </div>
              {/* Tile 2 */}
              <div className="absolute" style={{ left: 'calc(var(--tile) * 5.5)', top: 'calc(var(--tile) * 0.8)' }}>
                <div className="w-[var(--tile)] h-[var(--tile)] rounded-xl border border-white/15 grid place-items-center">
                  <div className="size-10 sm:size-12 rounded-full bg-yellow-300 text-black font-extrabold grid place-items-center">M</div>
                </div>
              </div>
              {/* Tile 3 */}
              <div className="absolute" style={{ right: 'calc(var(--tile) * 2.2)', top: 'calc(var(--tile) * 1.2)' }}>
                <div className="w-[var(--tile)] h-[var(--tile)] rounded-xl border border-white/15 grid place-items-center">
                  <div className="size-10 sm:size-12 rounded-full bg-blue-500 grid place-items-center text-white font-bold">e</div>
                </div>
              </div>
              {/* Tile 4 */}
              <div className="absolute" style={{ right: 'calc(var(--tile) * 2.4)', bottom: 'calc(var(--tile) * 1.2)' }}>
                <div className="w-[var(--tile)] h-[var(--tile)] rounded-xl border border-white/15 grid place-items-center">
                  <div className="size-12 sm:size-14 rounded-xl bg-yellow-400 grid place-items-center text-black font-extrabold">B</div>
                </div>
              </div>
              {/* Tile 5 */}
              <div className="absolute" style={{ left: 'calc(var(--tile) * 6)', bottom: 'calc(var(--tile) * 1.2)' }}>
                <div className="w-[var(--tile)] h-[var(--tile)] rounded-xl border border-white/15 grid place-items-center">
                  <div className="size-10 sm:size-12 rounded-full bg-purple-500 grid place-items-center text-white">∞</div>
                </div>
              </div>
              {/* Tile 6 */}
              <div className="absolute" style={{ right: 'calc(var(--tile) * 4)', bottom: 'calc(var(--tile) * 1.2)' }}>
                <div className="w-[var(--tile)] h-[var(--tile)] rounded-xl border border-white/15 grid place-items-center">
                  <div className="size-10 sm:size-12 rounded-full bg-red-500 grid place-items-center text-white font-extrabold">OP</div>
                </div>
              </div>
            </div>
          </div>
          {/* Heading */}
          <div className="relative z-10 px-6">
            <h1 className="text-center text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Interact wit Augus.AI
            </h1>
            <div className="mt-8 flex justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold shadow-sm hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0"
              >
                Go To Session
                <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-.001 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            {isOffline && (
              <div className="mt-6 flex justify-center" role="status" aria-live="polite">
                <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100/90 text-amber-900 px-4 py-3 text-sm ring-1 ring-amber-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.593c.75 1.334-.213 2.983-1.743 2.983H3.482c-1.53 0-2.492-1.65-1.743-2.983L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
                  </svg>
                  <span>Please ensure you have a stable internet connection and you are in a quiet environment</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* End networks hero */}
      </main>
    </div>
  );
}

export default App;
