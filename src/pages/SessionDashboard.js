import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { apiFetch } from '../api';
import { logout as doLogout } from '../auth';
// Configure PDF.js worker after all imports
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

function decodeEmailFromToken() {
  try {
    const raw = localStorage.getItem('augus_token') || '';
    const [, payload] = raw.split('.');
    if (!payload) return '';
    const json = JSON.parse(atob(payload));
    return json.email || '';
  } catch {
    return '';
  }
}

export default function SessionDashboard() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expired, setExpired] = useState(false);
  const [userEmail, setUserEmail] = useState(() => decodeEmailFromToken());
  const [showLogout, setShowLogout] = useState(false);
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Upload a PDF and click Start Session to begin. Ask me anything about your document.' },
  ]);
  const [userInput, setUserInput] = useState('');
  const [micStatusMsg, setMicStatusMsg] = useState('');
  const [ttsVolume, setTtsVolume] = useState(() => {
    const v = localStorage.getItem('TTS_VOLUME');
    const n = v !== null ? parseFloat(v) : 0.8;
    return isNaN(n) ? 0.8 : Math.min(1, Math.max(0, n));
  });
  // Activity + check‑in
  const [lastActivityTs, setLastActivityTs] = useState(() => Date.now());
  const lastCheckinTsRef = useRef(0);
  const CHECKIN_SECONDS = 30; // inactivity before AI checks in (30s)
  // Quiz state
  const [quiz, setQuiz] = useState([]); // [{ q, keywords: [] }]
  const [qIndex, setQIndex] = useState(0);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const intervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const SESSION_LIMIT_SECONDS = 10 * 60; // 10 minutes
  // Voice input (SpeechRecognition)
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const silenceTimerRef = useRef(null);
  const lastResultTsRef = useRef(0);

  // Fetch current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/auth/me');
        if (mounted) setUserEmail(res.user?.email || '');
      } catch {
        doLogout();
        navigate('/');
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent navigating back/forward while signed in dashboard
  useEffect(() => {
    // Softer back behavior: first back shows a transient toast, second back signs out
    let warned = false;
    const onPop = (e) => {
      e.preventDefault();
      if (!warned) {
        warned = true;
        setMicStatusMsg('Press back again to sign out and leave the dashboard.');
        // push state back to stay on page
        window.history.pushState(null, '', window.location.href);
        // auto-clear warning after a few seconds
        setTimeout(() => { setMicStatusMsg(''); warned = false; }, 3500);
        return;
      }
      // second back confirms logout
      doLogout();
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', onPop);
    try { window.history.pushState(null, '', window.location.href); } catch {}
    return () => window.removeEventListener('popstate', onPop);
  }, [navigate]);

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

  // Auto-scroll chat as new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stop session automatically when time limit is reached
  useEffect(() => {
    if (elapsed >= SESSION_LIMIT_SECONDS) {
      if (running) setRunning(false);
      if (!expired) setExpired(true);
    }
  }, [elapsed, running, expired, SESSION_LIMIT_SECONDS]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const remaining = Math.max(0, SESSION_LIMIT_SECONDS - elapsed);
  const rmm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const rss = String(remaining % 60).padStart(2, '0');

  function pushAssistant(text) {
    setMessages((m) => [...m, { role: 'assistant', content: text }]);
    speak(text);
  }

  // Basic TTS using the Web Speech API
  function speak(text) {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (isMuted || !text) return;
      const synth = window.speechSynthesis;
      // Cancel any ongoing utterance to avoid overlap
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(String(text).slice(0, 500));
      const voices = synth.getVoices?.() || [];
      const en = voices.find(v => (v.lang || '').toLowerCase().startsWith('en'));
      if (en) utterance.voice = en;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = Math.min(1, Math.max(0, ttsVolume));
      synth.speak(utterance);
    } catch {
      // no-op if TTS unavailable
    }
  }

  // Stop any speech when session expires or user mutes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (expired || isMuted) window.speechSynthesis.cancel();
    }
  }, [expired, isMuted]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Persist volume preference
  useEffect(() => {
    localStorage.setItem('TTS_VOLUME', String(ttsVolume));
  }, [ttsVolume]);

  // Initialize browser SpeechRecognition (voice answers)
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => {
      setListening(true);
      setLiveTranscript('');
      setMicStatusMsg('Listening…');
      lastResultTsRef.current = Date.now();
      // Fallback timer: if we never get a result, still finalize after 10s
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        finalizeVoiceAnswer();
      }, 10000);
    };
    rec.onresult = (e) => {
      setLastActivityTs(Date.now());
      // Combine latest chunk
      const result = e.results[e.resultIndex];
      const text = result?.[0]?.transcript;
      if (text) setLiveTranscript((prev) => (prev ? `${prev} ${text}` : text));
      lastResultTsRef.current = Date.now();
      setMicStatusMsg('Capturing speech…');
      // (Re)start a 10s silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        finalizeVoiceAnswer();
      }, 10000);
    };
    rec.onend = () => {
      setListening(false);
      setMicStatusMsg('Mic paused');
      // Always finalize what we have on end; if empty and awaiting, skip
      if (awaitingAnswer && running && !expired) {
        finalizeVoiceAnswer();
      }
      // If still waiting for next answer, restart automatically
      if (awaitingAnswer && running && !expired) {
        try {
          rec.start();
          setListening(true);
        } catch {}
      }
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e?.error === 'not-allowed') {
        setMicStatusMsg('Microphone permission denied');
      } else if (e?.error === 'no-speech') {
        setMicStatusMsg('No speech detected');
      } else {
        setMicStatusMsg('Microphone error');
      }
      if (awaitingAnswer && running && !expired) {
        // Fall back to skip on mic errors after a short moment
        setTimeout(() => finalizeVoiceAnswer(), 500);
      }
      if (e?.error === 'not-allowed') {
        pushAssistant('Microphone permission denied. Please allow mic access and click Listen.');
      } else if (e?.error === 'no-speech') {
        // Will be handled by finalizeVoiceAnswer -> skip
      }
    };
    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startListening() {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
      setListening(true);
      setMicStatusMsg('Listening…');
    } catch {}
  }
  function stopListening() {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
      setListening(false);
      setMicStatusMsg('Mic paused');
    } catch {}
  }

  function finalizeVoiceAnswer() {
    const text = (liveTranscript || '').trim();
    setLiveTranscript('');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (text) {
      ask(text);
    } else if (awaitingAnswer) {
      // No input captured: do NOT skip automatically; keep the conversation alive
      pushAssistant("I didn't catch that. I'm listening—take your time. You can also say “hint”, “repeat”, or “skip” when ready.");
      // Re-arm listening so the student can continue speaking
      startListening();
    }
  }

  // Inactivity check‑in
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - lastActivityTs) / 1000);
      const sinceCheck = Math.floor((now - (lastCheckinTsRef.current || 0)) / 1000);
      if (
        running &&
        !expired &&
        docText &&
        awaitingAnswer && // only check in when waiting on the student
        delta >= CHECKIN_SECONDS &&
        sinceCheck >= CHECKIN_SECONDS // avoid spamming
      ) {
        lastCheckinTsRef.current = now;
        pushAssistant("Still with me? Would you like a hint, or should I repeat the question? You can also say 'skip' to move on.");
        // ensure we're listening again after check-in
        startListening();
      }
    }, 15000);
    return () => clearInterval(id);
  }, [running, expired, docText, awaitingAnswer, lastActivityTs]);
  async function extractPdfText(file) {
    setLoadingDoc(true);
    setDocError('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      if (pdf.numPages > 80) {
        setDocError('PDF has too many pages (max 80). Please upload a smaller document.');
        return '';
      }
      let text = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str);
        text += strings.join(' ') + '\n';
      }
      return text.replace(/\s+/g, ' ').trim();
    } catch (e) {
      setDocError('Unable to read PDF. Please try another file.');
      return '';
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
    return `From your document, here is the most relevant part:\n\n"${snippet}"\n\nSummary: The passage above is likely related to your question. If you need deeper reasoning, ensure the server-side AI is configured.`;
  }

  function extractKeywordsLocal(text, k = 6) {
    const stop = new Set(['the','a','an','and','or','to','of','for','in','on','is','are','was','were','be','been','with','as','that','this','these','those','by','from','at','it','its','into','you','your','we','our','they','their','will','can','may','should','could','would','not','there','also','than','about','over','under','within','such']);
    const tokens = (text.toLowerCase().match(/\b[a-z][a-z0-9-]{2,}\b/g) || []).filter(t => !stop.has(t));
    const freq = new Map();
    for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
    const sorted = [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w);
    return Array.from(new Set(sorted)).slice(0, k);
  }

  function localHint(currentQuestion) {
    // Provide a short hint by surfacing a few keywords and a tiny doc snippet
    const keys = quiz[qIndex]?.keywords || extractKeywordsLocal(docText, 3);
    const piece = localAnswer(currentQuestion, docText);
    const quote = piece.split('"')[1] || '';
    return `Hint: focus on ${keys.map(k=>`"${k}"`).join(', ')}. ${quote ? `Consider this part of the document: “${quote.slice(0, 160)}${quote.length>160?'…':''}”` : ''}`;
  }

  async function generateQuiz() {
    if (!docText) {
      pushAssistant('Please upload a PDF first so I can generate questions.');
      return;
    }
    pushAssistant('Generating a few questions from your document…');

    // Try backend Gemini for better questions, else fall back to local heuristic.
    try {
      const res = await apiFetch('/ai/quiz', {
        method: 'POST',
        body: JSON.stringify({ docText }),
      });
      if (res?.questions?.length) {
        setQuiz(res.questions.slice(0, 5));
        setQIndex(0);
        setAwaitingAnswer(true);
        pushAssistant(`Question 1: ${res.questions[0].q}`);
        startListening();
        return;
      }
    } catch (e) {
      // fallback to local below
    }

    // Local fallback: pick frequent keywords and form questions.
    const keys = extractKeywordsLocal(docText, 5);
    const qs = keys.map((k) => ({ q: `Explain "${k}" in the context of this document.`, keywords: [k] }));
    setQuiz(qs);
    setQIndex(0);
    setAwaitingAnswer(true);
    pushAssistant(`Question 1: ${qs[0].q}`);
    startListening();
  }

  function evaluateLocally(answer, keywords = []) {
    const a = (answer || '').toLowerCase();
    const hits = (keywords || []).filter(k => a.includes(String(k).toLowerCase()));
    const score = keywords?.length ? Math.round((hits.length / keywords.length) * 100) : 0;
    return { score, hits };
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

    // If a quiz question is active, treat user's message as an answer.
    if (awaitingAnswer && quiz[qIndex]) {
      setLastActivityTs(Date.now());

      // Handle commands
      const lower = question.trim().toLowerCase();
      if (lower === 'hint' || lower.startsWith('hint')) {
        setMessages((m) => [...m, { role: 'user', content: question }]);
        const hint = localHint(quiz[qIndex].q);
        pushAssistant(hint);
        setUserInput('');
        return;
      }
      if (lower === 'skip' || lower.startsWith('skip')) {
        setMessages((m) => [...m, { role: 'user', content: question }]);
        const next = qIndex + 1;
        if (quiz[next]) {
          setQIndex(next);
          pushAssistant(`Okay, skipping. Question ${next + 1}: ${quiz[next].q}`);
        } else {
          pushAssistant('We have finished all questions. Ask me anything else or reset the session to start over.');
          setAwaitingAnswer(false);
        }
        setUserInput('');
        return;
      }

      setMessages((m) => [...m, { role: 'user', content: question }]);
      let feedback = '';
      try {
        const current = quiz[qIndex];
        const resp = await apiFetch('/ai/eval', {
          method: 'POST',
          body: JSON.stringify({
            docText,
            question: current.q,
            answer: question,
            keywords: current.keywords || [],
          }),
        });
        feedback = resp?.feedback || '';
      } catch {
        // fallback below
      }
      if (!feedback) {
        const { score, hits } = evaluateLocally(question, quiz[qIndex].keywords);
        feedback = `Your answer covers ${hits.length}/${(quiz[qIndex].keywords||[]).length} key term(s) [${hits.join(', ')}]. Estimated match: ${score}%. ${score < 60 ? 'Want a hint? Say "hint".' : ''}`;
      }
      pushAssistant(feedback);

      // Next question
      const next = qIndex + 1;
      if (quiz[next]) {
        setQIndex(next);
        pushAssistant(`Question ${next + 1}: ${quiz[next].q}`);
        setAwaitingAnswer(true);
        startListening();
      } else {
        pushAssistant('Great job! You have completed all questions for this session. You can continue asking questions or reset the session.');
        setAwaitingAnswer(false);
        stopListening();
      }
      setUserInput('');
      return;
    }

    // Normal free-form question to the AI about the document.
    setLastActivityTs(Date.now());
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setUserInput('');
    let answer = '';
    try {
      if (docText) {
        const resp = await apiFetch('/ai/answer', {
          method: 'POST',
          body: JSON.stringify({ docText, question }),
        });
        answer = resp?.answer || '';
      } else {
        answer = localAnswer(question, docText || '');
      }
    } catch (e) {
      answer = localAnswer(question, docText || '');
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
    setQuiz([]);
    setQIndex(0);
    setAwaitingAnswer(false);
    stopListening();
    setLiveTranscript('');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight hover:opacity-90">augus.ai</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">{userEmail || 'Account'}</span>
          <button
            className="text-sm font-medium text-white/80 hover:text-white rounded-full ring-1 ring-white/15 px-3 py-1.5"
            onClick={() => setShowLogout(true)}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative px-6 sm:px-10">
        {showLogout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowLogout(false)} />
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-sm rounded-2xl bg-[#0b0b0b] text-white ring-1 ring-white/10 p-6 shadow-2xl"
            >
              <div className="text-lg font-semibold">End session and log out?</div>
              <p className="mt-2 text-sm text-white/70 break-words">
                {userEmail ? `You are signed in as ${userEmail}.` : 'You are signed in.'}
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  className="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/15 hover:bg-white/5"
                  onClick={() => setShowLogout(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-full bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => {
                    setShowLogout(false);
                    doLogout();
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Document upload (stacked on mobile; pinned on larger screens) */}
        <div className="w-full sm:w-64 sm:absolute right-6 sm:right-10 top-24 sm:top-24 mt-4 sm:mt-0">
          <div className="flex flex-col items-stretch sm:items-end gap-2 sm:gap-3 text-left sm:text-right">
              <label className="w-full inline-flex items-center justify-center rounded-full bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 cursor-pointer text-sm sm:text-base">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setDocError('');
                    if (!file.type.includes('pdf')) {
                      setDocError('Please upload a PDF file.');
                      return;
                    }
                    if (file.size > 12 * 1024 * 1024) {
                      setDocError('PDF too large (max 12MB).');
                      return;
                    }
                    setDocName(file.name);
                    const text = await extractPdfText(file);
                    setDocText(text);
                  }}
                />
                Upload PDF
              </label>
              <div className="text-xs sm:text-sm text-white/70 w-full break-words">
                {loadingDoc ? 'Processing PDF…' : docName ? `Loaded: ${docName}` : 'No document loaded'}
              </div>
              <div className="mt-1 sm:mt-2 text-xs text-white/60 w-full">
                {docText ? `${Math.min(docText.length, 99999)} chars extracted` : ''}
              </div>
              {docError && <div className="text-xs text-rose-300 w-full">{docError}</div>}
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center relative">
          {/* Big mic orb */}
          <div className="relative mt-8 sm:mt-14">
            <div className={`size-[240px] sm:size-[380px] rounded-full bg-gradient-to-b from-[#dff2ff] to-[#cfe9ff] shadow-[0_30px_120px_rgba(59,130,246,0.3)] ring-8 ${listening ? 'ring-emerald-300' : 'ring-[#eaf5ff]'} flex items-end justify-center overflow-hidden transition-all`}>
              <div className="w-full h-1/2 bg-gradient-to-t from-[#c7bfff] to-[#c9f0ff]" />
            </div>
            <button
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-12 sm:size-20 rounded-full bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center"
            onClick={() => {
              if (expired) return;
              if (listening) {
                stopListening();
              } else {
                startListening();
              }
            }}
              aria-label="Microphone"
            >
              {/* mic icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H8v2h8v-2h-3v-2.07A7 7 0 0 0 19 11h-2Z" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {!expired ? (
              <button
                onClick={async () => {
                  if (!running) {
                    if (!docText) {
                      pushAssistant('Please upload a PDF before starting the session so I can generate questions.');
                      return;
                    }
                    // Friendly welcome before questions begin
                    pushAssistant(
                      `Welcome! We'll use "${docName || 'your document'}". I'll ask 5 short questions — reply in the chat to answer.`
                    );
                    await generateQuiz();
                    setRunning(true);
                    // begin listening for spoken answer
                    startListening();
                  } else {
                    setRunning(false);
                    stopListening();
                  }
                }}
                className="rounded-full bg-emerald-400/90 hover:bg-emerald-400 text-white font-semibold px-5 sm:px-8 py-2.5 sm:py-3 shadow disabled:opacity-50 text-sm sm:text-base"
              >
                {running ? 'Pause Session' : 'Start Session'}
              </button>
            ) : (
              <button
                onClick={resetSession}
                className="rounded-full bg-gray-900 hover:bg-black text-white font-semibold px-5 sm:px-8 py-2.5 sm:py-3 shadow text-sm sm:text-base"
              >
                Reset Session
              </button>
            )}

            {quiz.length > 0 && (
              <span className="rounded-full bg-white/10 text-white px-3 py-2 text-xs sm:text-sm ring-1 ring-white/15">
                Question {Math.min(qIndex + 1, quiz.length)} of {quiz.length}
              </span>
            )}

            <button
              onClick={() => setIsMuted((v) => !v)}
              className={`rounded-full px-3 sm:px-4 py-2.5 sm:py-3 ring-1 ring-black/10 shadow text-sm sm:text-base ${isMuted ? 'bg-rose-50 text-rose-600' : 'bg-white text-[#0b2545]'}`}
              aria-pressed={isMuted}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11a7 7 0 0 1-7 7v-2a5 5 0 0 0 5-5h2Zm-7-9a3 3 0 0 1 3 3v5.59l-6.3-6.3A3 3 0 0 1 12 2Zm-7.3.3 16 16-1.4 1.4-3.1-3.1a6.96 6.96 0 0 1-4.2 1.4v2H8v-2.07A6.99 6.99 0 0 1 5 11h2a5 5 0 0 0 5 5c.93 0 1.8-.26 2.55-.71l-1.55-1.55V10.4L5.7 3.7 4.6 2.3Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H8v2h8v-2h-3v-2.07A7 7 0 0 0 19 11h-2Z" />
                </svg>
              )}
            </button>

            <div className="text-xl sm:text-3xl font-extrabold tabular-nums tracking-wider text-white">
              {hh}:{mm}:{ss}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
              {expired ? 'Time limit reached' : `Remaining ${rmm}:${rss}`}
              <div className="flex items-center gap-1">
                <span className="hidden sm:inline">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={ttsVolume}
                  onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-white"
                  aria-label="Voice volume"
                />
              </div>
            </div>
          </div>

          {micStatusMsg && (
            <div className="mt-2 text-xs text-white/70">
              {micStatusMsg}
            </div>
          )}

          {expired && (
            <div className="mt-3 text-sm text-amber-300">
              Session ended. Reset to start a new session.
            </div>
          )}

          {/* Chat panel */}
          <div className="mt-10 w-full max-w-3xl">
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-4">
              <div className="space-y-3 max-h-[50vh] sm:max-h-[320px] overflow-y-auto">
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
                <div ref={messagesEndRef} />
              </div>
              {awaitingAnswer ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                  <span className={`inline-block h-2 w-2 rounded-full ${listening ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-[#0b2545]">{listening ? 'Listening for your answer…' : 'Mic paused'}</span>
                  <button onClick={startListening} className="rounded-lg bg-gray-900 hover:bg-black text-white px-3 py-1 font-semibold text-xs sm:text-sm">
                    Listen
                  </button>
                  <button onClick={stopListening} className="rounded-lg bg-slate-200 hover:bg-slate-300 text-[#0b2545] px-3 py-1 font-semibold text-xs sm:text-sm">
                    Stop
                  </button>
                  <span className="text-xs text-[#0b2545]/70 ml-1">Say “hint” or “skip” anytime.</span>
                  {quiz.length > 0 && (
                    <button
                      onClick={resetSession}
                      className="rounded-lg bg-white/70 hover:bg-white text-[#0b2545] px-3 py-1 font-semibold text-xs sm:text-sm"
                    >
                      Reset quiz
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask a question about the uploaded PDF…"
                    className="flex-1 rounded-lg border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:bg-gray-50 disabled:text-gray-400"
                    disabled={expired}
                  />
                  <button
                    onClick={() => ask(userInput)}
                    className="rounded-lg bg-gray-900 hover:bg-black text-white px-4 py-2 font-semibold disabled:opacity-50 w-full sm:w-auto"
                    disabled={expired}
                  >
                    Send
                  </button>
                </div>
              )}
              {liveTranscript && awaitingAnswer && (
                <div className="mt-3">
                  <div className="text-xs text-[#0b2545]/60 mb-1">You (speaking)…</div>
                  <div className="inline-block rounded-2xl px-3 py-2 text-sm bg-[#0b2545] text-white/90 opacity-90">
                    {liveTranscript}
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-[#0b2545]/80">
                AI is served from the backend (Gemini). No API key entry needed on this page.
              </div>
            </div>
          </div>

          {/* Help row */}
          <div className="mt-6 text-xs sm:text-sm text-white/70 flex flex-wrap items-center justify-center gap-2 px-4 text-center">
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


