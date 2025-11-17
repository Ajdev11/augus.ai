// App-level styles are handled by Tailwind in index.css

function App() {
  return (
    <div className="relative min-h-screen flex flex-col antialiased font-sans text-white">
      <header className="px-6 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-extrabold tracking-tight">augus.ai</div>
          <span className="rounded-full bg-white/10 text-white text-xs font-medium px-2 py-0.5 ring-1 ring-white/20">
            Beta
          </span>
        </div>
        <button type="button" className="text-sm font-medium text-white/80 hover:text-white">
          Need Help?
        </button>
      </header>

      <main className="relative flex-1 px-6 sm:px-8">
        {/* Background gradient and ornaments */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a2540] via-[#0b2f52] to-[#06365d]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_20%_10%,rgba(255,255,255,0.10),transparent)]" />
          <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[min(1100px,92%)] h-[520px] rounded-[36px] border border-white/10" />
          <div className="absolute left-1/2 top-52 -translate-x-1/2 w-[min(1000px,86%)] h-[480px] rounded-[32px] border border-white/10" />
          <div className="absolute left-1/2 top-80 -translate-x-1/2 w-[min(900px,80%)] h-[420px] rounded-[28px] border border-white/10" />
          <div className="absolute -left-16 bottom-16 w-72 h-72 rounded-full border-2 border-dashed border-white/20 opacity-60 rotate-12" />
          <div className="absolute -right-24 -top-10 w-96 h-96 rounded-full border-2 border-dashed border-white/10 opacity-40 -rotate-12" />
        </div>

        <div className="mx-auto max-w-5xl pt-12 sm:pt-28 pb-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Welcome to <span className="whitespace-nowrap">interactive case study</span> learning
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/80">
            Begin your one-on-one discussion session with AI
          </p>
          <div className="mt-10">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-red-600 text-white px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold shadow-sm hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
            >
              Continue to Session
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-.001 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100/90 text-amber-900 px-4 py-3 text-sm ring-1 ring-amber-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.593c.75 1.334-.213 2.983-1.743 2.983H3.482c-1.53 0-2.492-1.65-1.743-2.983L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
              </svg>
              <span>Please ensure you have a stable internet connection and you are in a quiet environment</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
