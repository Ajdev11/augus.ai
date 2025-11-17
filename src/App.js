import './App.css';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-extrabold tracking-tight">MIND by MIVA</div>
          <span className="rounded-full bg-gray-900 text-white text-xs font-medium px-2 py-0.5">
            Beta
          </span>
        </div>
        <button type="button" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Need Help?
        </button>
      </header>

      <main className="flex-1 px-6 sm:px-8">
        <div className="mx-auto max-w-3xl pt-16 sm:pt-24 pb-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Welcome to <span className="whitespace-nowrap">interactive case study</span> learning
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600">
            Begin your one-on-one discussion session with AI
          </p>
          <div className="mt-8">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 text-white px-5 py-3 text-sm sm:text-base font-semibold shadow-sm hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
            >
              Continue to Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
