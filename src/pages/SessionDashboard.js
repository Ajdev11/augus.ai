import { Link } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
// PDF.js (disable worker to avoid bundler worker configuration)
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

export default function SessionDashboard() {
  const [isMuted, setIsMuted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expired, setExpired] = useState(false);
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Upload a PDF and click Start Session to begin. Ask me anything about your document.' },
  ]);
  const [userInput, setUserInput] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('OPENAI_API_KEY') || '');
  const intervalRef = useRef(null);
  const SESSION_LIMIT_SECONDS = 15 * 60; // 15 minutes

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

  // Stop session automatically when time limit is reached
  useEffect(() => {
    if (elapsed >= SESSION_LIMIT_SECONDS) {
      if (running) setRunning(false);
      if (!expired) setExpired(true);
    }
  }, [elapsed, running, expired]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const remaining = Math.max(0, SESSION_LIMIT_SECONDS - elapsed);
  const rmm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const rss = String(remaining % 60).padStart(2, '0');

  async function extractPdfText(file) {
    setLoadingDoc(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, useWorker: false }).promise;
      let text = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str);
        text += strings.join(' ') + '\n';
      }
      return text.replace(/\s+/g, ' ').trim();
    } finally {
      setLoadingDoc(false);
    }
  }

  function chunk(text, size = 1200) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
    return chunks;
  }

  function similarity(a, b) {
    const aw = new Map();
    a.toLowerCase().split(/\W+/).forEach((w) => w && aw.set(w, (aw.get(w) || 0) + 1));
    const bw = new Map();
    b.toLowerCase().split(/\W+/).forEach((w) => w && bw.set(w, (bw.get(w) || 0) + 1));
    let dot = 0;
    let an = 0;
    let bn = 0;
    for (const [w, c] of aw) {
      an += c * c;
      if (bw.has(w)) dot += c * (bw.get(w) || 0);
    }
    for (const c of bw.values()) bn += c * c;
    return an && bn ? dot / (Math.sqrt(an) * Math.sqrt(bn)) : 0;
  }

  function localAnswer(question, text) {
    const pieces = chunk(text, 1500);
    let best = '';
    let bestScore = -1;
    for (const piece of pieces) {
      const s = similarity(piece, question);
      if (s > bestScore) {
        bestScore = s;
        best = piece;
      }
    }
    const snippet = best.length > 800 ? best.slice(0, 800) + '…' : best;
    return `From your document, here is the most relevant part:\n\n"${snippet}"\n\nSummary: The passage above is likely related to your question. If you need deeper reasoning, provide an OpenAI API key to enable richer answers.`;
  }

  async function ask(question) {
    if (!question.trim()) return;
    if (expired) {
      setMessages((m) => [
        ...m,
        { role: 'user', content: question },
        { role: 'assistant', content: 'Session time limit reached. Please reset the session to continue.' },
      ]);
      setUserInput('');
      return;
    }
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setUserInput('');
    let answer = '';
    try {
      if (apiKey && docText) {
        const system = 'You are a helpful tutor. Use only the provided document to answer. Cite short quotes where helpful.';
        const context = docText.length > 16000 ? docText.slice(0, 16000) : docText;
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: `Document:\n${context}` },
              { role: 'user', content: `Question: ${question}` },
            ],
            temperature: 0.3,
          }),
        });
        const data = await res.json();
        answer = data?.choices?.[0]?.message?.content || 'No answer.';
      } else {
        answer = localAnswer(question, docText || '');
      }
    } catch (e) {
      answer = 'Unable to generate an answer right now.';
    }
    setMessages((m) => [...m, { role: 'assistant', content: answer }]);
  }

  function resetSession() {
    setRunning(false);
    setElapsed(0);
    setExpired(false);
    setMessages([
      { role: 'assistant', content: 'Session reset. Upload a PDF and click Start Session to begin.' },
    ]);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-90">augus.ai</Link>
        </div>
        <Link to="/session" className="text-sm font-medium text-white/80 hover:text-white">
          Need Help?
        </Link>
      </header>

      {/* Main content */}
      <main className="relative px-6 sm:px-10">
        {/* Document upload (vertical, pinned to viewport right like header) */}
        <div className="absolute right-6 sm:right-10 top-24 w-64">
          <div className="flex flex-col items-end gap-2 sm:gap-3 text-right">
              <label className="w-full inline-flex items-center justify-center rounded-full bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setDocName(file.name);
                    const text = await extractPdfText(file);
                    setDocText(text);
                  }}
                />
                Upload PDF
              </label>
              <div className="text-sm text-white/70 w-full break-words">
                {loadingDoc ? 'Processing PDF…' : docName ? `Loaded: ${docName}` : 'No document loaded'}
              </div>
              <div className="mt-2 text-xs text-white/60 w-full">
                {docText ? `${Math.min(docText.length, 99999)} chars extracted` : ''}
              </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center relative">
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
            {!expired ? (
              <button
                onClick={() => setRunning((v) => !v)}
                className="rounded-full bg-emerald-400/90 hover:bg-emerald-400 text-white font-semibold px-6 sm:px-8 py-3 shadow disabled:opacity-50"
              >
                {running ? 'Pause Session' : 'Start Session'}
              </button>
            ) : (
              <button
                onClick={resetSession}
                className="rounded-full bg-gray-900 hover:bg-black text-white font-semibold px-6 sm:px-8 py-3 shadow"
              >
                Reset Session
              </button>
            )}

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

            <div className="text-3xl font-extrabold tabular-nums tracking-wider text-white">
              {hh}:{mm}:{ss}
            </div>
            <div className="text-sm text-white/60">
              {expired ? 'Time limit reached' : `Remaining ${rmm}:${rss}`}
            </div>
          </div>

          {/* Chat panel */}
          <div className="mt-10 w-full max-w-3xl">
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-4">
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                        m.role === 'user' ? 'bg-[#0b2545] text-white' : 'bg-slate-100 text-[#0b2545]'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask a question about the uploaded PDF…"
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-50 disabled:text-gray-400"
                  disabled={expired}
                />
                <button
                  onClick={() => ask(userInput)}
                  className="rounded-lg bg-gray-900 hover:bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
                  disabled={expired}
                >
                  Send
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('OPENAI_API_KEY', e.target.value);
                  }}
                  placeholder="Optional: OpenAI API Key for better answers"
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            </div>
          </div>

          {/* Help row */}
          <div className="mt-6 text-sm text-white/70 flex items-center gap-2">
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


